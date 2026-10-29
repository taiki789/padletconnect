import { createSign, randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";

type ServiceAccountCreds = {
  project_id: string;
  client_email: string;
  private_key: string;
  private_key_id?: string;
};

let cachedCreds: ServiceAccountCreds | null = null;
let cachedJwt: { token: string; expiresAt: number } | null = null;
let lastInitError: string | null = null;

function loadServiceAccountCreds(): ServiceAccountCreds | null {
  if (cachedCreds) return cachedCreds;

  // 1. JSON文字列またはBase64からの読み込み (FIREBASE_SERVICE_ACCOUNT_KEY)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      let raw = serviceAccountJson.trim();
      if (
        (raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"'))
      ) {
        raw = raw.slice(1, -1);
      }

      let parsed: Partial<ServiceAccountCreds>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const decoded = Buffer.from(raw, "base64").toString("utf-8");
        parsed = JSON.parse(decoded);
      }

      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        cachedCreds = {
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, "\n"),
          private_key_id: parsed.private_key_id,
        };
        lastInitError = null;
        return cachedCreds;
      }
    } catch (e) {
      lastInitError = e instanceof Error ? e.message : String(e);
      console.error("FIREBASE_SERVICE_ACCOUNT_KEY parse error:", lastInitError);
    }
  }

  // 2. ローカルファイルからの読み込み (FIREBASE_SERVICE_ACCOUNT_FILE)
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (serviceAccountFile) {
    try {
      const filePath = path.isAbsolute(serviceAccountFile)
        ? serviceAccountFile
        : path.resolve(/*turbopackIgnore: true*/ process.cwd(), serviceAccountFile);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileContent) as Partial<ServiceAccountCreds>;
        if (parsed.project_id && parsed.client_email && parsed.private_key) {
          cachedCreds = {
            project_id: parsed.project_id,
            client_email: parsed.client_email,
            private_key: parsed.private_key.replace(/\\n/g, "\n"),
            private_key_id: parsed.private_key_id,
          };
          lastInitError = null;
          return cachedCreds;
        }
      }
    } catch (e) {
      lastInitError = e instanceof Error ? e.message : String(e);
      console.error("FIREBASE_SERVICE_ACCOUNT_FILE read error:", lastInitError);
    }
  }

  // 3. 個別環境変数からの読み込み
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    cachedCreds = {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
    lastInitError = null;
    return cachedCreds;
  }

  return null;
}

function getBearerToken(creds: ServiceAccountCreds): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.expiresAt > now + 120) {
    return cachedJwt.token;
  }

  const headerObj: Record<string, string> = { alg: "RS256", typ: "JWT" };
  if (creds.private_key_id) {
    headerObj.kid = creds.private_key_id;
  }
  const header = Buffer.from(JSON.stringify(headerObj)).toString("base64url");
  const expiresAt = now + 3600;
  const payload = Buffer.from(
    JSON.stringify({
      iss: creds.client_email,
      sub: creds.client_email,
      aud: "https://firestore.googleapis.com/",
      iat: now - 60,
      exp: expiresAt,
    })
  ).toString("base64url");

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(creds.private_key, "base64url");
  const token = `${header}.${payload}.${signature}`;

  cachedJwt = { token, expiresAt };
  return token;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreValue(val: any): Record<string, any> {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFirestoreValue(val: Record<string, any>): any {
  if (!val || typeof val !== "object") return undefined;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return Boolean(val.booleanValue);
  if ("stringValue" in val) return String(val.stringValue);
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) {
    const d = new Date(val.timestampValue);
    // Firestore Timestamp 互換の .toDate() メソッドを付与
    Object.defineProperty(d, "toDate", {
      value: () => d,
      enumerable: false,
    });
    return d;
  }
  if ("arrayValue" in val) {
    const values = val.arrayValue?.values ?? [];
    return values.map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    return fromFirestoreFields(val.mapValue?.fields);
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFirestoreFields(fields?: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  if (!fields) return result;
  for (const [key, val] of Object.entries(fields)) {
    result[key] = fromFirestoreValue(val);
  }
  return result;
}

export type DocSnapshot = {
  id: string;
  exists: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: () => Record<string, any> | undefined;
};

export type DocRef = {
  id: string;
  path: string;
  get: () => Promise<DocSnapshot>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (data: Record<string, any>) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (data: Record<string, any>) => Promise<void>;
};

export function getAdminApp(): { options: { projectId: string } } {
  const creds = loadServiceAccountCreds();
  return {
    options: {
      projectId: creds?.project_id ?? "placeholder-build",
    },
  };
}

export function getAdminFirestore() {
  const creds = loadServiceAccountCreds();
  if (!creds) {
    throw new Error(
      lastInitError
        ? `Firebase認証情報の解析に失敗しました: ${lastInitError}`
        : "Firebase設定（FIREBASE_SERVICE_ACCOUNT_KEY）が見つかりません。Vercelの環境変数をご確認ください。"
    );
  }

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${creds.project_id}/databases/(default)/documents`;

  const createDocRef = (docPath: string): DocRef => {
    const cleanPath = docPath.replace(/^\/+/, "");
    const id = cleanPath.split("/").pop() ?? "";

    return {
      id,
      path: cleanPath,
      async get(): Promise<DocSnapshot> {
        const token = getBearerToken(creds);
        const res = await fetch(`${baseUrl}/${cleanPath}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (res.status === 404) {
          return { id, exists: false, data: () => undefined };
        }
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Firestore GET failed (${res.status}): ${errText.slice(0, 200)}`);
        }

        const json = (await res.json()) as { fields?: Record<string, unknown> };
        const parsed = fromFirestoreFields(json.fields);
        return {
          id,
          exists: true,
          data: () => parsed,
        };
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async set(data: Record<string, any>): Promise<void> {
        const token = getBearerToken(creds);
        const res = await fetch(`${baseUrl}/${cleanPath}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: toFirestoreFields(data) }),
          cache: "no-store",
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Firestore SET failed (${res.status}): ${errText.slice(0, 200)}`);
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async update(data: Record<string, any>): Promise<void> {
        const token = getBearerToken(creds);
        const keys = Object.keys(data).filter((k) => data[k] !== undefined);
        const maskParams = keys
          .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
          .join("&");
        const url = maskParams ? `${baseUrl}/${cleanPath}?${maskParams}` : `${baseUrl}/${cleanPath}`;

        const res = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: toFirestoreFields(data) }),
          cache: "no-store",
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Firestore UPDATE failed (${res.status}): ${errText.slice(0, 200)}`);
        }
      },
    };
  };

  return {
    doc(docPath: string): DocRef {
      return createDocRef(docPath);
    },

    collection(collectionPath: string) {
      const cleanCol = collectionPath.replace(/^\/+|\/+$/g, "");
      return {
        doc(docId?: string): DocRef {
          const finalId = docId || randomUUID().replace(/-/g, "").slice(0, 20);
          return createDocRef(`${cleanCol}/${finalId}`);
        },
        orderBy(field: string, direction: "asc" | "desc" = "asc") {
          return {
            limit(count: number) {
              return {
                async get() {
                  const token = getBearerToken(creds);
                  const res = await fetch(`${baseUrl}:runQuery`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      structuredQuery: {
                        from: [{ collectionId: cleanCol }],
                        orderBy: [
                          {
                            field: { fieldPath: field },
                            direction: direction === "desc" ? "DESCENDING" : "ASCENDING",
                          },
                        ],
                        limit: count,
                      },
                    }),
                    cache: "no-store",
                  });

                  if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`Firestore QUERY failed (${res.status}): ${errText.slice(0, 200)}`);
                  }

                  const results = (await res.json()) as Array<{
                    document?: { name: string; fields?: Record<string, unknown> };
                  }>;

                  const docs: DocSnapshot[] = [];
                  for (const item of results) {
                    if (item.document) {
                      const docId = item.document.name.split("/").pop() ?? "";
                      const parsed = fromFirestoreFields(item.document.fields);
                      docs.push({
                        id: docId,
                        exists: true,
                        data: () => parsed,
                      });
                    }
                  }
                  return { docs };
                },
              };
            },
          };
        },
      };
    },

    async runTransaction<T>(
      updateFunction: (transaction: {
        get: (ref: DocRef) => Promise<DocSnapshot>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set: (ref: DocRef, data: Record<string, any>) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: (ref: DocRef, data: Record<string, any>) => void;
      }) => Promise<T>
    ): Promise<T> {
      const pendingWrites: Array<() => Promise<void>> = [];
      const tx = {
        async get(ref: DocRef): Promise<DocSnapshot> {
          return ref.get();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(ref: DocRef, data: Record<string, any>) {
          pendingWrites.push(() => ref.set(data));
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update(ref: DocRef, data: Record<string, any>) {
          pendingWrites.push(() => ref.update(data));
        },
      };

      const result = await updateFunction(tx);
      for (const writeOp of pendingWrites) {
        await writeOp();
      }
      return result;
    },
  };
}

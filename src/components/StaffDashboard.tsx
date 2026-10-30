"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Prize = {
  initialStock: number;
  currentStock: number;
  distributed: number;
  isAccepting: boolean;
  measurementStarted: boolean;
  initialStock3: number;
  initialStock2: number;
  initialStock1: number;
  stock3: number;
  stock2: number;
  stock1: number;
  mission2Reached?: number;
  mission2Completed?: number;
};
type Log = { id: string; action: string; beforeStock: number | null; afterStock: number | null; note?: string | null; createdAt: string };

const actionLabels: Record<string, string> = {
  STOCK_CHANGE: "在庫数変更",
  ACCEPT_START: "計測開始",
  ACCEPT_STOP: "受付停止",
  REDEEM: "景品配布（参加者画面）",
  MANUAL_REDEEM: "景品配布（管理画面）",
  MISSION2_RESET: "Padlet離脱率リセット",
};
const EMPTY_PRIZE: Prize = {
  initialStock: 0,
  currentStock: 0,
  distributed: 0,
  isAccepting: false,
  measurementStarted: false,
  initialStock3: 0,
  initialStock2: 0,
  initialStock1: 0,
  stock3: 0,
  stock2: 0,
  stock1: 0,
  mission2Reached: 0,
  mission2Completed: 0,
};

async function readJson<T>(response: Response): Promise<{ data: T | null; raw: string }> {
  const text = await response.text();
  if (!text.trim()) return { data: null, raw: "" };
  try { return { data: JSON.parse(text) as T, raw: text }; } catch { return { data: null, raw: text }; }
}

export default function StaffDashboard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [stocks, setStocks] = useState({ stock3: "0", stock2: "0", stock1: "0" });
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [prizeResponse, logsResponse] = await Promise.all([fetch("/api/staff/prize"), fetch("/api/staff/logs")]);
    if (prizeResponse.ok) {
      const { data: nextPrize } = await readJson<Prize>(prizeResponse);
      if (nextPrize) {
        setPrize(nextPrize);
        setStocks({ stock3: String(nextPrize.stock3), stock2: String(nextPrize.stock2), stock1: String(nextPrize.stock1) });
        setError("");
      } else setError("景品情報の応答を読み取れませんでした。再度最新化してください。");
    } else {
      setPrize(EMPTY_PRIZE);
      const { data: errRes, raw } = await readJson<{ error?: string }>(prizeResponse);
      setError(errRes?.error || raw.slice(0, 100) || `景品情報の取得に失敗しました（HTTP ${prizeResponse.status}）。`);
    }
    if (logsResponse.ok) {
      const { data: logData } = await readJson<Log[]>(logsResponse);
      setLogs(logData ?? []);
    }
    setLoading(false);
  };

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const { data: result, raw } = await readJson<{ authenticated?: boolean; error?: string }>(response);
      if (!response.ok || !result?.authenticated) {
        setError(result?.error || raw.slice(0, 100) || `ログインに失敗しました（HTTP ${response.status}）。パスワードをご確認ください。`);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      setError("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const update = async (action: string) => {
    setLoading(true);
    setError("");
    try {
      const body = action === "stock" ? { action, stock3: Number(stocks.stock3), stock2: Number(stocks.stock2), stock1: Number(stocks.stock1), note } : { action, note };
      const response = await fetch("/api/staff/prize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { data: result, raw } = await readJson<Prize & { error?: string }>(response);
      setLoading(false);
      if (!response.ok) {
        setError(result?.error || raw.slice(0, 100) || `操作に失敗しました（HTTP ${response.status}）。`);
        return;
      }
      if (!result) {
        setError("サーバーから空の応答が返りました。");
        return;
      }
      setError("");
      setConfirming(false);
      await refresh();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "通信エラーが発生しました。");
    }
  };

  const requestStockChange = () => {
    if (![stocks.stock3, stocks.stock2, stocks.stock1].every((value) => /^[0-9]+$/.test(value))) { setError("景品数は0以上の整数で入力してください。"); return; }
    setError("");
    setConfirming(true);
  };

  const graphLogs = logs.filter((log) => log.afterStock !== null).slice().reverse();
  const maxStock = Math.max(prize?.initialStock ?? 1, 1);
  const graphPoints = graphLogs.map((log, index) => `${(index / Math.max(graphLogs.length - 1, 1)) * 100},${100 - ((log.afterStock ?? 0) / maxStock) * 100}`).join(" ");

  const m2Reached = prize?.mission2Reached ?? 0;
  const m2Completed = prize?.mission2Completed ?? 0;
  const m2Dropoff = Math.max(0, m2Reached - m2Completed);
  const dropoffRate = m2Reached > 0 ? Math.round((m2Dropoff / m2Reached) * 100) : 0;

  return <main className="staff-shell">
    <button className="staff-home-button" onClick={() => router.push("/")}>最初の画面へ</button>
    <div className="staff-warning">【スタッフ専用・外部共有厳禁】このURLおよびパスワードをSNSや外部に漏らさないでください</div>
    {!authenticated ? <section className="staff-login"><p className="label">STAFF ACCESS</p><h1>管理画面</h1><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="共通パスワード" /><button onClick={login} disabled={loading}>ログイン</button>{error && <p className="staff-error">{error}</p>}</section> : <section><div className="staff-heading"><div><p className="label">PRIZE CONTROL</p><h1>景品管理</h1></div><button className="refresh-button" onClick={refresh} disabled={loading}>↻ 最新化</button></div>{prize && <><div className={`status-banner ${prize.isAccepting && prize.currentStock > 0 ? "accepting" : "sold-out"}`}><span>現在の受付ステータス</span><strong>{prize.isAccepting && prize.currentStock > 0 ? "受付中（配布可能）" : "受付終了（SOLD OUT表示中）"}</strong></div><div className="staff-stats"><div className="stock-main"><span>現在の残り景品数</span><strong>{prize.currentStock}</strong>{prize.currentStock === 0 ? <em className="stock-danger">在庫切れ（受付終了状態）</em> : prize.currentStock <= 5 ? <em className="stock-warning">残りわずか！</em> : null}</div><div><span>配布済み数</span><strong>{prize.distributed}</strong></div><div><span>初期総数</span><strong>{prize.initialStock}</strong></div></div><div className="staff-stats" style={{ marginTop: "18px" }}><div className="stock-main"><span>Padlet投稿の離脱率（MISSION 02）</span><strong>{dropoffRate}%</strong></div><div><span>MISSION 02 到達数</span><strong>{m2Reached}</strong></div><div><span>完了数 / 離脱数</span><strong>{m2Completed} / {m2Dropoff}</strong></div></div><div className="rank-stock-grid"><label>3問正解用景品<input inputMode="numeric" value={stocks.stock3} onChange={(event) => setStocks((current) => ({ ...current, stock3: event.target.value.replace(/\D/g, "") }))} />個</label><label>2問正解用景品<input inputMode="numeric" value={stocks.stock2} onChange={(event) => setStocks((current) => ({ ...current, stock2: event.target.value.replace(/\D/g, "") }))} />個</label><label>1問正解用景品<input inputMode="numeric" value={stocks.stock1} onChange={(event) => setStocks((current) => ({ ...current, stock1: event.target.value.replace(/\D/g, "") }))} />個</label></div><div className="staff-actions"><button onClick={requestStockChange} disabled={loading}>景品数を登録</button><button onClick={() => update("start")} disabled={loading || prize.isAccepting || prize.currentStock === 0}>景品計測開始</button><button className="danger-button" onClick={() => update("stop")} disabled={loading || !prize.isAccepting}>受付停止</button><button onClick={() => update("reset_mission2")} disabled={loading}>離脱率リセット</button></div><div className="manual-area"><label>操作メモ（任意）<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="担当者名・補充理由など" /></label><button onClick={() => update("manual_redeem")} disabled={loading || !prize.isAccepting || prize.currentStock === 0}>＋1個配布</button></div>{prize.measurementStarted && <div className="stock-graph"><h2>景品の減少推移</h2>{graphPoints ? <svg viewBox="0 0 100 100" role="img" aria-label="景品残数の推移グラフ" preserveAspectRatio="none"><polyline points={graphPoints} /></svg> : <p>配布が始まると、ここに推移が表示されます。</p>}<div><span>開始時 {prize.initialStock}個</span><span>現在 {prize.currentStock}個</span></div></div>}{error && <p className="staff-error">{error}</p>}<h2>操作履歴</h2><ul className="staff-logs">{logs.map((log) => <li key={log.id}><strong>{actionLabels[log.action] ?? log.action}</strong><span>{log.beforeStock ?? "-"}個 → {log.afterStock ?? "-"}個</span><small>{new Date(log.createdAt).toLocaleString("ja-JP")}<br />{log.note ?? ""}</small></li>)}</ul></>}</section>}
    {confirming && <div className="confirm-overlay"><div className="confirm-modal"><h2>景品数を登録しますか？</h2><p>3問：<strong>{stocks.stock3}個</strong>、2問：<strong>{stocks.stock2}個</strong>、1問：<strong>{stocks.stock1}個</strong>で登録します。</p><div><button onClick={() => setConfirming(false)}>キャンセル</button><button onClick={() => update("stock")}>登録する</button></div></div></div>}
  </main>;
}

export type Quiz = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  difficulty?: "normal" | "hard";
};

export const quizzes: Quiz[] = [
  {
    id: "q01",
    question: "2026年のまちかね祭のテーマは？",
    choices: ["六華七煌", "EXPOSION", "本気（マジ）かね！", "一祭合才"],
    answer: 0,
    explanation: "2026年のまちかね祭テーマは「六華七煌（りっかしちこう）」です。",
    difficulty: "normal",
  },
  {
    id: "q02",
    question: "掲示板企画の名前は？",
    choices: ["まちかねっと！", "まちかね掲示板！", "まちかねボード！", "まちかね広場！"],
    answer: 0,
    explanation: "掲示板企画の名前は「まちかねっと！」です。",
    difficulty: "normal",
  },
  {
    id: "q03",
    question: "阪大の主要キャンパスの数はいくつ？",
    choices: ["2", "3", "4"],
    answer: 1,
    explanation: "大阪大学の主要キャンパスは、豊中・吹田・箕面の3つです。",
    difficulty: "normal",
  },
  {
    id: "q04",
    question: "阪大の学章のモチーフは？",
    choices: ["いちょう", "さくら", "もみじ"],
    answer: 0,
    explanation: "大阪大学の学章は、いちょうの葉がモチーフです。",
    difficulty: "normal",
  },
  {
    id: "q05",
    question: "ステージ「宙」の読み方は？",
    choices: ["そら", "ちゅう", "ひろ", "あまね"],
    answer: 0,
    explanation: "ステージ「宙」は「そら」と読みます。",
    difficulty: "normal",
  },
  {
    id: "q06",
    question: "まちかね祭の大トリを飾る、阪大生限定の漫才頂上決戦の企画名は？",
    choices: [
      "M-1 Grand Prix",
      "O-1 Grand Prix",
      "H-1 Grand Prix",
      "ワニ-1 Grand Prix",
    ],
    answer: 1,
    explanation:
      "「偏差値より、笑いをとれ。」を合言葉に、阪大一面白いコンビを決める「O-1 Grand Prix 2026」がステージ奏で開催されます！",
    difficulty: "normal",
  },
  {
    id: "q07",
    question:
      "今年の新企画「阪大キャンドルNight」で、夜の帰り道を照らすために来場者がデザインできるものは？",
    choices: ["うちわ", "風船", "ランタン", "ペンライト"],
    answer: 2,
    explanation:
      "「阪大キャンドルNight」では、来場者が描いたデザインのランタンでステージ宙前広場やメインストリートをライトアップします（参加無料）！",
    difficulty: "normal",
  },
  {
    id: "q08",
    question:
      "共通C棟中庭に期間限定で登場し、おみくじを引けるスポットは？",
    choices: ["阪大神社", "まちかね寺", "ワニ博士の祠", "いちょう天満宮"],
    answer: 0,
    explanation:
      "共通C棟中庭には期間限定で「阪大神社」が登場！おみくじを引いたり、絵馬キーホルダーも楽しめます。",
    difficulty: "normal",
  },
  {
    id: "q09",
    question: "大阪大学中央実行委員会のキャラクター「まちかめ」の相棒はだれ？",
    choices: ["まちわに", "まちうさ", "まちねこ", "まちかに"],
    answer: 3,
    explanation:
      "大阪大学中央実行委員会のキャラクターはカメの「まちかめ」とカニの「まちかに」です！メインストリートの総合案内所で公式グッズも販売中です。",
    difficulty: "normal",
  },
  {
    id: "q10",
    question:
      "会場内で困ったときに頼れる、実行委員スタッフが付けている「STAFF」腕章の色は？",
    choices: ["青色", "オレンジ色", "緑色", "紫色"],
    answer: 1,
    explanation:
      "会場内で困ったことがあれば、「STAFF」と書かれたオレンジ色の腕章を付けた実行委員や総合案内所にお気軽にお声がけください！",
    difficulty: "normal",
  },
  // --- 阪大にまつわる難問 (difficulty: "hard") ---
  {
    id: "h01",
    question:
      "【難問】豊中キャンパスの理学部建設現場で「マチカネワニ」の化石が発見されたのは西暦何年？",
    choices: ["1954年", "1964年", "1974年", "1984年"],
    answer: 1,
    explanation:
      "マチカネワニの化石は東京オリンピックと同じ1964年（昭和39年）5月、豊中キャンパスの理学部新校舎建設現場で発見されました（全長約7m）！",
    difficulty: "hard",
  },
  {
    id: "h02",
    question:
      "【難問】1931年の大阪帝国大学創設時、初代総長を務めた世界的物理学者はだれ？",
    choices: ["湯川秀樹", "長岡半太郎", "緒方洪庵", "八木秀次"],
    answer: 1,
    explanation:
      "初代総長は土星型原子模型などで知られる物理学者の長岡半太郎です。湯川秀樹は阪大在職中にノーベル賞受賞作となる中間子論を発表しました！",
    difficulty: "hard",
  },
  {
    id: "h03",
    question:
      "【難問】石橋阪大前駅から豊中キャンパスへ登る名物「阪大坂」の途中にある池の名前は？",
    choices: [
      "待兼池（まちかねいけ）",
      "中山池（なかやまいけ）",
      "刀根山池（とねやまいけ）",
      "柴原池（しばはらいけ）",
    ],
    answer: 1,
    explanation:
      "阪大坂の途中右手に見える池は「中山池（なかやまいけ）」といいます！",
    difficulty: "hard",
  },
  {
    id: "h04",
    question:
      "【難問】箕面キャンパスにある大阪大学外国語学部には、現在いくつの専攻語が設置されている？",
    choices: ["15専攻語", "20専攻語", "25専攻語", "30専攻語"],
    answer: 2,
    explanation:
      "大阪大学外国語学部には、世界各地域の言語を学べる25もの専攻語が設置されており、日本の国立大学で最多クラスを誇ります！",
    difficulty: "hard",
  },
  {
    id: "h05",
    question:
      "【難問】緒方洪庵が現在の大阪市中央区に蘭学塾「適塾」を開いたのは西暦何年？",
    choices: ["1818年", "1838年", "1853年", "1868年"],
    answer: 1,
    explanation:
      "緒方洪庵は1838年（天保9年）に「適塾」を開き、福沢諭吉など日本の近代化を支えた多くの人材を輩出しました。",
    difficulty: "hard",
  },
  {
    id: "h06",
    question:
      "【難問】国の登録有形文化財である「大阪大学会館（旧イ号館）」は、1928年に何という学校の校舎として建てられた？",
    choices: [
      "旧制浪速高等学校",
      "旧制第三高等学校",
      "大阪医科大学",
      "懐徳堂",
    ],
    answer: 0,
    explanation:
      "現在の大阪大学会館は、1928年（昭和3年）に「旧制浪速高等学校」の校舎として建てられた歴史的建築物です！",
    difficulty: "hard",
  },
];

/**
 * 景品在庫（stock3, stock2, stock1）に応じて難問の数（0〜3問）を決定し、計3問のクイズIDリストを返す
 * - 3問正解用が多い場合 → 難問0問（3問正解へ誘導）
 * - 2問正解用が多い場合 → 難問1問（2問正解へ誘導）
 * - 1問正解用が多い場合 → 難問2問（1問正解へ誘導）
 * - 3問・2問正解用がほぼ無い／枯渇している場合 → 難問3問（0〜1問正解へ誘導）
 */
export function selectQuizIdsByStock(
  stock3 = 50,
  stock2 = 50,
  stock1 = 50
): string[] {
  let hardCount = 0;

  if (stock3 <= 0 && stock2 <= 0) {
    // 3問用・2問用がともに在庫0の場合は3問すべて難問
    hardCount = 3;
  } else if (stock3 <= 0 && stock1 > stock2) {
    // 3問用が在庫0で、1問用が2問用より多い場合も難問3問
    hardCount = 3;
  } else if (stock3 >= stock2 && stock3 >= stock1) {
    // 3問正解用の在庫が一番多い（または同率トップ）→ 難問0問
    hardCount = 0;
  } else if (stock2 >= stock3 && stock2 >= stock1) {
    // 2問正解用の在庫が一番多い → 難問1問
    hardCount = 1;
  } else {
    // 1問正解用の在庫が一番多い → 難問2問（3問用が極端に少ない場合は3問）
    hardCount = stock3 <= 2 ? 3 : 2;
  }

  const normalPool = quizzes
    .filter((q) => q.difficulty !== "hard")
    .sort(() => Math.random() - 0.5);
  const hardPool = quizzes
    .filter((q) => q.difficulty === "hard")
    .sort(() => Math.random() - 0.5);

  const selectedHard = hardPool.slice(0, hardCount);
  const selectedNormal = normalPool.slice(0, 3 - selectedHard.length);

  return [...selectedNormal, ...selectedHard]
    .sort(() => Math.random() - 0.5)
    .map((q) => q.id);
}

export const ranks = ["参加賞相当", "秀", "優秀", "超優秀"] as const;

export const PADLET_URL =
  "https://padlet.com/tyuujitu/padlet-s023yz9svk0h9sbxq0vq";

export const CAMPUS_MAP_HIGHLIGHT_PATH = "/campus-map-highlight.jpg";

export const EXCHANGE_MAP_EMBED_URL =
  "https://maps.google.com/maps?q=%E5%A4%A7%E9%98%AA%E5%A4%A7%E5%AD%A6%20%E5%A4%9A%E7%9B%AE%E7%9A%84%E5%80%89%E5%BA%AB&ll=34.8068938,135.4556937&z=18&hl=ja&output=embed";

export const EXCHANGE_MAP_URL =
  "https://www.google.co.jp/maps/place/%E5%A4%A7%E9%98%AA%E5%A4%A7%E5%AD%A6+%E5%A4%9A%E7%9B%AE%E7%9A%84%E5%80%89%E5%BA%AB/@34.8068982,135.4531188,17z/data=!3m1!4b1!4m6!3m5!1s0x6000fbbf3c4ccb89:0x7f8220e6faddec21!8m2!3d34.8068938!4d135.4556937!16s%2Fg%2F11j6f1j11k?entry=ttu";

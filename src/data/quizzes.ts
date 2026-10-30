export type Quiz = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export const quizzes: Quiz[] = [
  {
    id: "q01",
    question: "2026年のテーマは？",
    choices: ["六華七煌", "EXPOSION", "本気（マジ）かね！", "一祭合才"],
    answer: 0,
    explanation: "2026年のまちかね祭テーマは「六華七煌（りっかしちこう）」です。",
  },
  {
    id: "q02",
    question: "掲示板企画の名前は？",
    choices: ["まちかねっと！", "まちかね掲示板！", "まちかねボード！", "まちかね広場！"],
    answer: 0,
    explanation: "掲示板企画の名前は「まちかねっと！」です。",
  },
  {
    id: "q03",
    question: "阪大の主要キャンパスの数はいくつ？",
    choices: ["2", "3", "4"],
    answer: 1,
    explanation: "大阪大学の主要キャンパスは、豊中・吹田・箕面の3つです。",
  },
  {
    id: "q04",
    question: "阪大の学章のモチーフは？",
    choices: ["いちょう", "さくら", "もみじ"],
    answer: 0,
    explanation: "大阪大学の学章は、いちょうの葉がモチーフです。",
  },
  {
    id: "q05",
    question: "ステージ「宙」の読み方は？",
    choices: ["そら", "ちゅう", "ひろ", "あまね"],
    answer: 0,
    explanation: "ステージ「宙」は「そら」と読みます。",
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
  },
  {
    id: "q07",
    question:
      "今年の新企画「阪大キャンドルNight」で、夜の帰り道を照らすために来場者がデザインできるものは？",
    choices: ["うちわ", "風船", "ランタン", "ペンライト"],
    answer: 2,
    explanation:
      "「阪大キャンドルNight」では、来場者が描いたデザインのランタンでステージ宙前広場やメインストリートをライトアップします（参加無料）！",
  },
  {
    id: "q08",
    question:
      "共通C棟中庭に期間限定で登場し、おみくじや参拝が楽しめるスポットは？",
    choices: ["阪大神社", "まちかね寺", "ワニ博士の祠", "いちょう天満宮"],
    answer: 0,
    explanation:
      "共通C棟中庭には期間限定で「阪大神社」が登場！単位取得や恋愛などの願いを込めて参拝でき、おみくじや絵馬キーホルダーも楽しめます。",
  },
  {
    id: "q09",
    question: "まちかね祭の公式マスコットキャラクター「まちかめ」の相棒はだれ？",
    choices: ["まちわに", "まちうさ", "まちねこ", "まちかに"],
    answer: 3,
    explanation:
      "まちかね祭の公式マスコットはカメの「まちかめ」とカニの「まちかに」です！メインストリートの総合案内所で公式グッズも販売中です。",
  },
  {
    id: "q10",
    question:
      "会場内で困ったときに頼れる、実行委員スタッフが付けている「STAFF」腕章の色は？",
    choices: ["青色", "オレンジ色", "緑色", "紫色"],
    answer: 1,
    explanation:
      "会場内で困ったことがあれば、「STAFF」と書かれたオレンジ色の腕章を付けた実行委員や総合案内所にお気軽にお声がけください！",
  },
];

export const ranks = ["参加賞相当", "秀", "優秀", "超優秀"] as const;

export const PADLET_URL =
  "https://padlet.com/tyuujitu/padlet-s023yz9svk0h9sbxq0vq";

export const CAMPUS_MAP_HIGHLIGHT_PATH = "/campus-map-highlight.jpg";

export const EXCHANGE_MAP_EMBED_URL =
  "https://maps.google.com/maps?q=%E5%A4%A7%E9%98%AA%E5%A4%A7%E5%AD%A6%20%E5%A4%9A%E7%9B%AE%E7%9A%84%E5%80%89%E5%BA%AB&ll=34.8068938,135.4556937&z=18&hl=ja&output=embed";

export const EXCHANGE_MAP_URL =
  "https://www.google.co.jp/maps/place/%E5%A4%A7%E9%98%AA%E5%A4%A7%E5%AD%A6+%E5%A4%9A%E7%9B%AE%E7%9A%84%E5%80%89%E5%BA%AB/@34.8068982,135.4531188,17z/data=!3m1!4b1!4m6!3m5!1s0x6000fbbf3c4ccb89:0x7f8220e6faddec21!8m2!3d34.8068938!4d135.4556937!16s%2Fg%2F11j6f1j11k?entry=ttu";

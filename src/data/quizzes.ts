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
    explanation: "2026年のまちかね祭テーマは「六華七煌」です。",
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
];

export const ranks = ["参加賞相当", "秀", "優秀", "超優秀"] as const;

export const PADLET_URL =
  "https://padlet.com/tyuujitu/padlet-s023yz9svk0h9sbxq0vq";

export const CAMPUS_MAP_HIGHLIGHT_PATH = "/campus-map-highlight.jpg";

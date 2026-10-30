"use client";

import { ChangeEvent, startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EXCHANGE_MAP_EMBED_URL, EXCHANGE_MAP_URL, PADLET_URL, quizzes, ranks, selectQuizIdsByStock } from "@/data/quizzes";

type Screen = "start" | "mission1" | "quiz" | "result" | "mission2" | "upload" | "final" | "soldout";
type SavedState = {
  participationId: string | null;
  quizIds: string[];
  screen: Screen;
  questionIndex: number;
  answers: (number | null)[];
  score: number;
  screenshotVerified: boolean;
};

const INITIAL_STATE: SavedState = {
  participationId: null,
  quizIds: [],
  screen: "start",
  questionIndex: 0,
  answers: [],
  score: 0,
  screenshotVerified: false,
};
const STORAGE_KEY = "machikanefes-participation-v2";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="label">{children}</p>;
}

function ActionButton({ children, onClick, secondary = false, disabled = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className={`action-button${secondary ? " secondary" : ""}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<SavedState>(INITIAL_STATE);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [staffCode, setStaffCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [prizeAvailable, setPrizeAvailable] = useState(true);
  const [checkingPrize, setCheckingPrize] = useState(false);
  const [uploadEnteredAt, setUploadEnteredAt] = useState<number>(0);
  const [missionFailedModal, setMissionFailedModal] = useState(false);

  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (state.screen !== "final") return;
    fetch("/api/prize/status").then((response) => response.json()).then((result: { currentStock: number; isAccepting: boolean }) => {
      startTransition(() => setPrizeAvailable(result.currentStock > 0 && result.isAccepting));
    }).catch(() => setPrizeAvailable(true));
  }, [state.screen]);

  const activeQuizzes = state.quizIds.length
    ? state.quizIds.map((id) => quizzes.find((quiz) => quiz.id === id)).filter((quiz): quiz is (typeof quizzes)[number] => Boolean(quiz))
    : quizzes.slice(0, 3);
  const question = activeQuizzes[state.questionIndex] ?? activeQuizzes[0];
  const rank = ranks[Math.min(state.score, ranks.length - 1)];
  const setScreen = (screen: Screen) => {
    setError("");
    if (screen === "upload") {
      setUploadEnteredAt(Date.now());
    }
    setState((current) => ({ ...current, screen }));
  };

  const start = async () => {
    setCheckingPrize(true);
    let stock3 = 50;
    let stock2 = 50;
    let stock1 = 50;
    try {
      const prizeResponse = await fetch("/api/prize/status", { cache: "no-store" });
      if (prizeResponse.ok) {
        const prizeStatus = await prizeResponse.json() as {
          currentStock: number;
          isAccepting: boolean;
          stock3?: number;
          stock2?: number;
          stock1?: number;
        };
        if (prizeStatus.currentStock <= 0 || !prizeStatus.isAccepting) {
          setState({ ...INITIAL_STATE, screen: "soldout" });
          return;
        }
        stock3 = prizeStatus.stock3 ?? 50;
        stock2 = prizeStatus.stock2 ?? 50;
        stock1 = prizeStatus.stock1 ?? 50;
      }
    } catch {
      // Continue only when the status service is unavailable; the server checks again at redemption.
    } finally {
      setCheckingPrize(false);
    }
    const quizIds = selectQuizIdsByStock(stock3, stock2, stock1);
    setRedeemed(false);
    setStaffCode("");
    setError("");
    setSelected(null);
    setMissionFailedModal(false);
    setState({ ...INITIAL_STATE, quizIds, answers: Array(quizIds.length).fill(null), screen: "mission1" });
    void fetch("/api/participation", { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { participationId: string };
        setState((current) => ({ ...current, participationId: result.participationId }));
      })
      .catch(() => {
        // The quiz remains usable when the database is temporarily unavailable.
      });
  };

  const returnHome = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setRedeemed(false);
    setStaffCode("");
    setError("");
    setSelected(null);
    setState(INITIAL_STATE);
  };

  const chooseAnswer = (choice: number) => {
    if (state.answers[state.questionIndex] !== null) return;
    setSelected(choice);
  };

  const confirmAnswer = () => {
    if (selected === null) return;
    const answers = [...state.answers];
    answers[state.questionIndex] = selected;
    setState((current) => ({ ...current, answers, score: answers.filter((answer, index) => answer === activeQuizzes[index]?.answer).length }));
    setSelected(null);
  };

  const nextQuestion = () => {
    if (state.questionIndex === activeQuizzes.length - 1) setScreen("result");
    else setState((current) => ({ ...current, questionIndex: current.questionIndex + 1 }));
  };

  const reset = () => {
    if (window.confirm("今の参加記録をリセットして、最初から遊びますか？")) returnHome();
  };

  const submitScreenshot = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (uploadEnteredAt > 0 && Date.now() - uploadEnteredAt < 5000) {
      event.target.value = "";
      setUploadEnteredAt(Date.now());
      setMissionFailedModal(true);
      return;
    }

    setError("");
    setSubmitting(true);

    let currentId = state.participationId;

    // participationId が未取得の場合はここで作成を試みる
    if (!currentId) {
      try {
        const response = await fetch("/api/participation", { method: "POST" });
        if (response.ok) {
          const result = await response.json() as { participationId: string };
          currentId = result.participationId;
        }
      } catch (err) {
        console.error("Failed to create participation:", err);
      }
    }

    // スクショ検証APIを呼び出してFirestore側のフラグとスコアを更新
    if (currentId) {
      try {
        const formData = new FormData();
        formData.append("screenshot", file);
        formData.append("participationId", currentId);
        formData.append("score", String(state.score));
        await fetch("/api/screenshot", { method: "POST", body: formData });
      } catch (uploadErr) {
        console.error("Screenshot upload api error:", uploadErr);
      }
    }

    setState((current) => ({
      ...current,
      participationId: currentId ?? current.participationId,
      screenshotVerified: true,
      screen: "final",
    }));

    setSubmitting(false);
  };
  
  const redeemPrize = async () => {
    if (staffCode === "10101") {
      router.push("/manage/staff");
      return;
    }
    if (staffCode !== "7777") {
      setError("スタッフ用パスコードが正しくありません。");
      return;
    }

    setRedeeming(true);
    setError("");

    let currentId = state.participationId;
    if (!currentId) {
      try {
        const response = await fetch("/api/participation", { method: "POST" });
        if (response.ok) {
          const result = await response.json() as { participationId: string };
          currentId = result.participationId;
          setState((current) => ({ ...current, participationId: currentId }));
        }
      } catch (err) {
        console.error("Auto recovery failed:", err);
      }
    }

    if (!currentId) {
      setError("参加記録の取得に失敗しました。電波の良い場所で再度お試しください。");
      setRedeeming(false);
      return;
    }

    try {
      const response = await fetch("/api/prize/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participationId: currentId,
          passcode: staffCode,
          score: state.score,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "引換に失敗しました。");
      setRedeemed(true);
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : "引換に失敗しました。");
    } finally {
      setRedeeming(false);
    }
  };

  return <main className="paper-shell">
    <header className="masthead"><span>まちかね祭 / 2026</span><span>謎解き特別号</span></header>
    {state.screen === "start" && <section className="hero-section"><Label>MISSION 01 / 02</Label><h1>まちかね祭<br /><em>への入り口</em></h1><p className="lead">景品を獲得するために、<br />ミッションを始めよう！</p><div className="rule" /><ActionButton onClick={start} disabled={checkingPrize}>{checkingPrize ? "景品状況を確認中..." : "謎解きをスタート →"}</ActionButton><p className="notice">※景品には数に限りがあります。なくなり次第終了します。</p></section>}
    {state.screen === "soldout" && <section className="content-section soldout-section"><Label>FINAL / SOLD OUT</Label><p className="complete-mark">SOLD OUT</p><h2>ごめんなさい！<br />景品の配布は終了しました</h2><p>まちかね祭の謎解きに参加してくれて、ありがとうございます！</p><p>用意していた景品はすべてなくなりました。せっかく参加してくれたのに、ごめんなさい。</p><p>ぜひ、引き続きまちかね祭を楽しんでいってください！</p><button className="reset-button" onClick={returnHome}>ホームへ戻る</button></section>}
    {state.screen === "mission1" && <section className="content-section"><Label>MISSION 01</Label><h2>3つの問いに<br />挑戦しよう。</h2><p>クイズは全部で3問。正解数に応じて、あなたのランクが決まります。0問正解でも、次のミッションへ進めます。</p><div className="stat-grid"><div><strong>03</strong><span>QUESTIONS</span></div><div><strong>∞</strong><span>TRY AGAIN</span></div></div><ActionButton onClick={() => setScreen("quiz")}>クイズを始める →</ActionButton></section>}
    {state.screen === "quiz" && <section className="content-section"><div className="question-top"><Label>QUESTION {String(state.questionIndex + 1).padStart(2, "0")} / {String(activeQuizzes.length).padStart(2, "0")}</Label><span>{state.questionIndex + 1} / {activeQuizzes.length}</span></div><div className="progress"><i style={{ width: `${((state.questionIndex + 1) / activeQuizzes.length) * 100}%` }} /></div><h2 className="question-title">{question.question}</h2><div className="choices">{question.choices.map((choice, index) => <button key={choice} className={`choice ${selected === index ? "selected" : ""} ${state.answers[state.questionIndex] !== null && index === question.answer ? "correct" : ""}`} onClick={() => chooseAnswer(index)}>{String.fromCharCode(65 + index)} <span>{choice}</span></button>)}</div>{state.answers[state.questionIndex] === null ? <ActionButton onClick={confirmAnswer} disabled={selected === null}>回答を確定する</ActionButton> : <div className="feedback"><strong>{state.answers[state.questionIndex] === question.answer ? "正解！" : "不正解"}</strong><p>{question.explanation}</p><ActionButton onClick={nextQuestion}>{state.questionIndex === activeQuizzes.length - 1 ? "結果を見る →" : "次の問題へ →"}</ActionButton></div>}</section>}
    {state.screen === "result" && <section className="content-section result-section"><Label>MISSION 01 / RESULT</Label><h2>あなたの結果</h2><div className="score"><strong>{state.score}<small> / {activeQuizzes.length}</small></strong><span>正解数</span></div><p className="rank-stamp">{rank}</p><p>ここまで来たあなたは立派な探検者。次は、みんなの声を掲示板に届けよう。</p><ActionButton onClick={() => setScreen("mission2")}>MISSION 02 へ進む →</ActionButton></section>}
    {state.screen === "mission2" && <section className="content-section"><Label>MISSION 02</Label><h2>ひとこと、<br />残していこう。</h2><p>Padletに、まちかね祭の感想やメッセージを投稿してください。</p><ul className="idea-list"><li>まちかね祭で楽しかったこと</li><li>おもしろかった展示や企画</li><li>参加した団体へのメッセージ</li><li>これから来る人へのおすすめ</li></ul><a className="action-button link-button" href={PADLET_URL} target="_blank" rel="noopener noreferrer">Padletを開く ↗</a><p className="notice">投稿した画面のスクリーンショットを撮って、この画面に戻ってきてください。</p><ActionButton onClick={() => setScreen("upload")} secondary>スクショ提出へ進む →</ActionButton></section>}
    {state.screen === "upload" && <section className="content-section"><Label>STEP 02 / SUBMIT</Label><h2>投稿を<br />確認します。</h2><p>Padletに投稿した画面のスクリーンショットを選択してください。</p><label className="file-picker"><span>{submitting ? "確認中..." : "画像を選択する"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={submitScreenshot} disabled={submitting} /></label>{error && <p className="error-message">{error}</p>}<p className="notice">対応形式：JPEG / PNG / WebP　最大10MB</p><ActionButton onClick={() => window.open(PADLET_URL, "_blank", "noopener,noreferrer")} secondary>Padletに戻る ↗</ActionButton></section>}
    {state.screen === "final" && <section className="content-section final-section"><Label>FINAL / COMPLETE</Label><p className="complete-mark">{redeemed ? "THANK YOU!" : !prizeAvailable ? "SOLD OUT" : "COMPLETE!"}</p><h2>{redeemed ? "ありがとうございました。" : !prizeAvailable ? "ごめんなさい！景品の配布は終了しました" : "ミッション達成。"}</h2><p>{redeemed ? "景品の配布が完了しました。ありがとうございました。" : !prizeAvailable ? "まちかね祭の謎解きに参加してくれて、ありがとうございます。用意していた景品はすべてなくなりました。ぜひ、引き続きまちかね祭を楽しんでいってください。" : "投稿の確認が完了しました。景品交換場所で、この画面をスタッフに提示してください。"}</p><div className="summary"><span>正解数</span><strong>{state.score} / {activeQuizzes.length}　{rank}</strong><span>交換場所</span><strong>大阪大学 多目的倉庫</strong></div><div className="map-panel"><iframe className="campus-map-iframe" src={EXCHANGE_MAP_EMBED_URL} title="大阪大学 多目的倉庫 地図" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div><a className="action-button secondary link-button" href={EXCHANGE_MAP_URL} target="_blank" rel="noopener noreferrer">Googleマップで場所・ルートを見る ↗</a>{!redeemed && prizeAvailable && <div className="staff-area"><Label>STAFF ONLY</Label><p>スタッフの方がこの画面でパスコードを入力してください。</p><input className="staff-code" type="password" value={staffCode} onChange={(event) => setStaffCode(event.target.value)} placeholder="スタッフ用パスコード" /><ActionButton onClick={redeemPrize} disabled={redeeming}>{redeeming ? "確認中..." : "景品を配布確定する"}</ActionButton>{error && <p className="error-message">{error}</p>}</div>}<button className="reset-button" onClick={reset}>もう一度最初から遊ぶ</button></section>}
    {missionFailedModal && <div className="confirm-overlay"><div className="confirm-modal"><h2>Mission失敗</h2><p><strong>Mission失敗、再度padletに投稿を行い、スクショを提出してください</strong></p><ActionButton onClick={() => { setMissionFailedModal(false); setScreen("mission2"); }}>最初から始める</ActionButton></div></div>}
    <footer><span>MAチカネ / PUZZLE WALK</span><span>NO. 001</span></footer>
  </main>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Flag, Timer, X } from "lucide-react";
import type { QuizQuestion } from "@/lib/types";
import styles from "../design-lab.module.css";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function ExamPrototype({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120 * 60);
  const question = questions[index];
  const answered = Object.keys(answers).length;

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(() => Math.round((answered / questions.length) * 100), [answered, questions.length]);

  function toggleFlag() {
    setFlags((current) => current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id]);
  }

  if (reviewing) {
    return (
      <div className={styles.examMain}>
        <section className={styles.examHeading}>
          <div><p className={styles.eyebrow}>Practice assessment</p><h1>Review your answers</h1></div>
          <div className={styles.examTimer}><Timer aria-hidden="true" /><span>{formatTime(secondsLeft)}</span></div>
        </section>
        <section className={styles.reviewPanel}>
          <div className={styles.reviewSummary}>
            <div><strong>{answered}</strong><span>answered</span></div>
            <div><strong>{questions.length - answered}</strong><span>remaining</span></div>
            <div><strong>{flags.length}</strong><span>flagged</span></div>
          </div>
          <div className={styles.reviewGrid} aria-label="Question review grid">
            {questions.map((item, questionIndex) => (
              <button
                type="button"
                key={item.id}
                className={answers[item.id] !== undefined ? styles.reviewAnswered : undefined}
                onClick={() => { setIndex(questionIndex); setReviewing(false); }}
                aria-label={`Go to question ${questionIndex + 1}, ${answers[item.id] === undefined ? "unanswered" : "answered"}${flags.includes(item.id) ? ", flagged" : ""}`}
              >
                {answers[item.id] !== undefined ? <Check aria-hidden="true" /> : null}
                <span>{questionIndex + 1}</span>
                {flags.includes(item.id) ? <Flag aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => setReviewing(false)}>Return to questions</button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.examMain}>
      <section className={styles.examHeading}>
        <div>
          <p className={styles.eyebrow}>Practice assessment · answers lock</p>
          <h1>Calm focus for test-day decisions.</h1>
          <p>This practice experience is not the actual FAA knowledge test.</p>
        </div>
        <div className={styles.examTimer}><Timer aria-hidden="true" /><span>{formatTime(secondsLeft)}</span><small>remaining</small></div>
      </section>

      <section className={styles.examStatus} aria-label="Assessment status">
        <div><span>Question</span><strong>{index + 1} of {questions.length}</strong></div>
        <div className={styles.examProgress} aria-label={`${answered} of ${questions.length} answered`} role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div><span>Answered</span><strong>{answered}/{questions.length}</strong></div>
        <button type="button" className={flags.includes(question.id) ? styles.flagActive : styles.flagButton} onClick={toggleFlag}>
          <Flag aria-hidden="true" /> {flags.includes(question.id) ? "Flagged" : "Flag for review"}
        </button>
      </section>

      <section className={styles.questionPanel}>
        <div className={styles.questionNumber}>Question {index + 1}</div>
        <h2 id={`studio-question-${question.id}`}>{question.prompt}</h2>
        <fieldset aria-labelledby={`studio-question-${question.id}`}>
          <legend className={styles.srOnly}>Answer choices</legend>
          <div role="radiogroup" aria-labelledby={`studio-question-${question.id}`} className={styles.answerList}>
            {question.choices.slice(0, 3).map((choice, choiceIndex) => {
              const selected = answers[question.id] === choiceIndex;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  key={choice}
                  className={selected ? styles.answerSelected : styles.answerButton}
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
                >
                  <span>{String.fromCharCode(65 + choiceIndex)}</span>
                  <strong>{choice}</strong>
                  {selected ? <Check aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className={styles.examControls}>
        <button type="button" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>
          <ArrowLeft aria-hidden="true" /> Previous
        </button>
        <button type="button" className={styles.reviewButton} onClick={() => setReviewing(true)}>
          <ClipboardList aria-hidden="true" /> Review answers
        </button>
        <button type="button" disabled={index === questions.length - 1} onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}>
          Next <ArrowRight aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";

interface QuestionItem {
  id: number;
  type: "single" | "multi" | "text";
  title: string;
  options: { id: string; text: string }[];
  required: boolean;
}

interface Answer {
  question_id: number;
  option_ids: string;    // "o1" 或 "o1,o3"
  text_content: string;
}

interface SurveyFormProps {
  questions: QuestionItem[];
  onSubmit: (answers: Answer[]) => Promise<void>;
  submitting: boolean;
}

export default function SurveyForm({
  questions,
  onSubmit,
  submitting,
}: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<number, Answer>>({});

  const setAnswer = (qid: number, patch: Partial<Answer>) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: {
        question_id: qid,
        option_ids: "",
        text_content: "",
        ...prev[qid],
        ...patch,
      },
    }));
  };

  // 处理单选
  const handleSingle = (qid: number, oid: string) => {
    setAnswer(qid, { option_ids: oid });
  };

  // 处理多选
  const handleMulti = (qid: number, oid: string, checked: boolean) => {
    const cur = answers[qid]?.option_ids || "";
    const ids = cur ? cur.split(",").filter(Boolean) : [];
    const next = checked
      ? [...ids, oid]
      : ids.filter((id) => id !== oid);
    setAnswer(qid, { option_ids: next.join(",") });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const list = questions.map((q) => answers[q.id]).filter(Boolean);
    onSubmit(list);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {questions.map((q, idx) => (
        <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-medium text-gray-900 mb-3">
            {idx + 1}. {q.title}
            {q.required && <span className="text-red-400 ml-1">*</span>}
          </h3>

          {/* 单选 */}
          {q.type === "single" &&
            q.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 py-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={opt.id}
                  checked={answers[q.id]?.option_ids === opt.id}
                  onChange={() => handleSingle(q.id, opt.id)}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.text}</span>
              </label>
            ))}

          {/* 多选 */}
          {q.type === "multi" &&
            q.options.map((opt) => {
              const selected = (answers[q.id]?.option_ids || "")
                .split(",")
                .includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      handleMulti(q.id, opt.id, e.target.checked)
                    }
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">{opt.text}</span>
                </label>
              );
            })}

          {/* 简答 */}
          {q.type === "text" && (
            <textarea
              value={answers[q.id]?.text_content || ""}
              onChange={(e) =>
                setAnswer(q.id, { text_content: e.target.value })
              }
              placeholder="请输入您的回答"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer text-lg"
      >
        {submitting ? "提交中..." : "提交问卷"}
      </button>
    </form>
  );
}

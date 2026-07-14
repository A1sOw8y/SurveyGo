"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import QuestionEditor, {
  newQuestion,
  type QuestionData,
} from "@/components/QuestionEditor";

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>([newQuestion()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 未登录不允许创建
  if (typeof window !== "undefined" && !isLoggedIn()) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">请先登录后再创建问卷</p>
        <a href="/login" className="text-blue-600 hover:underline">
          去登录
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("请填写问卷标题");
      return;
    }

    // 过滤掉空标题的题目
    const validQuestions = questions.filter((q) => q.title.trim());
    if (validQuestions.length === 0) {
      setError("请至少添加一道有效题目");
      return;
    }

    // 校验选择题选项不为空
    for (const q of validQuestions) {
      if (q.type !== "text") {
        const validOptions = q.options.filter((o) => o.text.trim());
        if (validOptions.length < 2) {
          setError(`题目「${q.title}」至少需要2个非空选项`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await post<{ id: number }>("/api/surveys", {
        title: title.trim(),
        description: description.trim(),
        questions: validQuestions.map((q, i) => ({
          type: q.type,
          title: q.title.trim(),
          options: q.type !== "text" ? q.options.filter((o) => o.text.trim()) : null,
          sort_order: i,
          required: q.required,
        })),
        status: "draft",
      });

      if (res.code === 201) {
        router.push("/my");
      } else {
        setError(res.message);
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">创建问卷</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* 问卷标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            问卷标题 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：大学生消费习惯调查"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        </div>

        {/* 问卷描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            问卷说明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="选填，简要说明本次调查的目的和注意事项"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        {/* 题目列表 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题目列表
          </label>
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              onChange={(updated) => {
                const next = [...questions];
                next[i] = updated;
                setQuestions(next);
              }}
              onDelete={() => {
                if (questions.length <= 1) return;
                setQuestions(questions.filter((_, idx) => idx !== i));
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => setQuestions([...questions, newQuestion()])}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors cursor-pointer"
          >
            + 添加题目
          </button>
        </div>

        {/* 提交 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "保存中..." : "创建问卷"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/my")}
            className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

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

    const validQuestions = questions.filter((q) => q.title.trim());
    if (validQuestions.length === 0) {
      setError("请至少添加一道有效题目");
      return;
    }

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
    <div className="max-w-2xl mx-auto px-4 py-10">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">创建问卷</h1>
          <p className="text-sm text-gray-500 mt-1">
            设置标题和题目，完成后即可发布分享
          </p>
        </div>

        {/* 主表单卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-100">
                {error}
              </div>
            )}

            {/* 问卷标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                问卷标题 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：大学生消费习惯调查"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow"
                autoFocus
              />
            </div>

            {/* 问卷描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                问卷说明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要说明本次调查的目的和注意事项（选填）"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-shadow"
              />
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-100 pt-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
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
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3.5 text-sm text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                + 添加题目
              </button>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {submitting ? "保存中..." : "创建问卷"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

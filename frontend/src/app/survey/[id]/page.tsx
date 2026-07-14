"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get, post } from "@/lib/api";
import SurveyForm from "@/components/SurveyForm";

interface QuestionItem {
  id: number;
  type: "single" | "multi" | "text";
  title: string;
  options: { id: string; text: string }[];
  required: boolean;
}

interface SurveyData {
  id: number;
  title: string;
  description: string;
  status: string;
  questions: QuestionItem[];
}

interface Answer {
  question_id: number;
  option_ids: string;
  text_content: string;
}

export default function SurveyFillPage() {
  const params = useParams();
  const surveyId = Number(params.id);

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!surveyId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await get<SurveyData>(`/api/surveys/${surveyId}`);
        if (res.code === 200 && res.data) {
          setSurvey(res.data);
        } else {
          setError(res.message || "问卷不存在");
        }
      } catch {
        setError("网络错误，无法加载问卷");
      } finally {
        setLoading(false);
      }
    })();
  }, [surveyId]);

  const handleSubmit = async (answers: Answer[]) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await post(`/api/surveys/${surveyId}/submit`, {
        answers,
      });
      if (res.code === 201) {
        setSubmitted(true);
      } else {
        setError(res.message);
      }
    } catch {
      setError("网络错误，提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <a href="/" className="text-blue-600 hover:underline">
          返回首页
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功</h2>
          <p className="text-gray-500 mb-8">感谢您的参与！您的回答已成功提交。</p>
          <a
            href="/"
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            返回首页
          </a>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
        {/* 问卷头部 — 带渐变底色卡片 */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl border border-blue-100 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 text-xs text-blue-500 font-medium mb-2 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            问卷调查
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {survey!.title}
          </h1>
          {survey!.description && (
            <p className="mt-2 text-gray-500 leading-relaxed">
              {survey!.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            共 {survey!.questions.length} 题
            {survey!.questions.some((q) => q.required) && " · 带 * 为必答题"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6 border border-red-100">
            {error}
          </div>
        )}

        <SurveyForm
          questions={survey!.questions}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
  );
}

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

  // 加载中
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    );
  }

  // 加载失败
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

  // 提交成功
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">提交成功</h2>
        <p className="text-gray-500">感谢您的参与！</p>
        <a href="/" className="inline-block mt-6 text-blue-600 hover:underline">
          返回首页
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 问卷头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{survey!.title}</h1>
        {survey!.description && (
          <p className="mt-2 text-gray-500">{survey!.description}</p>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {/* 表单 */}
      <SurveyForm
        questions={survey!.questions}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}

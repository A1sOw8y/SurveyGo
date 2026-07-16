"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import SurveyCard from "@/components/SurveyCard";

interface SurveyItem {
  id: number;
  title: string;
  description: string;
  status: string;
  question_count: number;
  response_count: number;
  created_at: string;
}

export default function HomePage() {
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await get<{ items: SurveyItem[] }>(
          `/api/surveys?keyword=${encodeURIComponent(keyword)}`
        );
        if (!cancelled && res.code === 200 && res.data) {
          setSurveys(res.data.items);
        }
      } catch {
        if (!cancelled) setSurveys([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [keyword]);

  return (
    <div>
      {/* Hero 区域 */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            SurveyGo 在线问卷
          </h1>
          <p className="mt-3 text-gray-300 max-w-xl mx-auto">
            快速创建问卷，一键分享链接，实时查看统计结果。简单高效的在线调查工具。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/register"
              className="inline-block bg-white text-gray-900 px-5 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              免费注册
            </a>
            <a
              href="/create"
              className="inline-block border border-gray-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              创建问卷
            </a>
          </div>
        </div>
      </section>

      {/* 公开问卷列表 */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">公开问卷</h2>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索问卷..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">加载中...</p>
        ) : surveys.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {keyword ? "没有匹配的问卷" : "暂无公开问卷，去注册创建第一个吧"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((s) => (
              <SurveyCard key={s.id} {...s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

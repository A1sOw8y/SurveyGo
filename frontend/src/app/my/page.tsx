"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { get, put, del } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import StatsPanel from "@/components/StatsPanel";

interface SurveyItem {
  id: number;
  title: string;
  description: string;
  status: "draft" | "published" | "closed";
  share_code: string;
  question_count: number;
  response_count: number;
  created_at: string;
  updated_at: string;
}

interface QuestionStat {
  question_id: number;
  title: string;
  type: "single" | "multi" | "text";
  options?: { id: string; text: string; count: number; percentage: number }[];
  answers?: { id: number; content: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  closed: "已关闭",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  closed: "bg-gray-200 text-gray-600",
};

export default function MyPage() {
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [stats, setStats] = useState<QuestionStat[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loggedIn] = useState(() => isLoggedIn());
  const [refresh, setRefresh] = useState(0);

  const refreshList = () => setRefresh((r) => r + 1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await get<{ items: SurveyItem[] }>("/api/user/surveys");
        if (res.code === 200 && res.data) {
          setSurveys(res.data.items);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  if (!loggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">请先登录</p>
        <Link href="/login" className="text-blue-600 hover:underline">
          去登录
        </Link>
      </div>
    );
  }

  // 切换发布/关闭
  const handleToggleStatus = async (id: number, current: string) => {
    const action = current === "published" ? "close" : "publish";
    const res = await put(`/api/user/surveys/${id}/publish`, { action });
    if (res.code === 200) {
      refreshList();
    }
  };

  // 删除问卷
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这份问卷吗？此操作不可撤销。")) return;
    const res = await del(`/api/surveys/${id}`);
    if (res.code === 200) {
      if (expandedId === id) setExpandedId(null);
      refreshList();
    }
  };

  // 展开/收起统计
  const handleToggleStats = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setStatsLoading(true);
    try {
      const res = await get<{ total_responses: number; stats: QuestionStat[] }>(
        `/api/surveys/${id}/stats`
      );
      if (res.code === 200 && res.data) {
        setStats(res.data.stats);
        setTotalResponses(res.data.total_responses);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  // 复制分享链接
  const handleCopyLink = (shareCode: string, id: number) => {
    const url = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">我的问卷</h1>
        <Link
          href="/create"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + 创建问卷
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">加载中...</p>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">你还没有创建过问卷</p>
          <Link
            href="/create"
            className="text-blue-600 hover:underline font-medium"
          >
            创建第一份问卷
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* 问卷行 */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {s.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{s.question_count} 题</span>
                      <span>{s.response_count} 份答卷</span>
                      <span>
                        更新于 {new Date(s.updated_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 ml-4">
                    {s.status === "published" && (
                      <button
                        onClick={() => handleCopyLink(s.share_code, s.id)}
                        className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer whitespace-nowrap"
                      >
                        {copiedId === s.id ? "已复制 ✓" : "复制链接"}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleStatus(s.id, s.status)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer whitespace-nowrap ${
                        s.status === "published"
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {s.status === "published" ? "关闭" : "发布"}
                    </button>
                    <button
                      onClick={() => handleToggleStats(s.id)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer whitespace-nowrap ${
                        expandedId === s.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {expandedId === s.id ? "收起统计" : "查看统计"}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-red-400 hover:text-red-600 cursor-pointer whitespace-nowrap"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>

              {/* 统计面板（展开时显示） */}
              {expandedId === s.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  {statsLoading ? (
                    <p className="text-gray-400 text-sm">加载统计数据...</p>
                  ) : (
                    <StatsPanel
                      stats={stats}
                      totalResponses={totalResponses}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

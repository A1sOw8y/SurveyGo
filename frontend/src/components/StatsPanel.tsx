"use client";

interface OptionStat {
  id: string;
  text: string;
  count: number;
  percentage: number;
}

interface QuestionStat {
  question_id: number;
  title: string;
  type: "single" | "multi" | "text";
  options?: OptionStat[];
  answers?: { id: number; content: string }[];
}

interface StatsPanelProps {
  stats: QuestionStat[];
  totalResponses: number;
}

export default function StatsPanel({ stats, totalResponses }: StatsPanelProps) {
  if (totalResponses === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        暂无答卷数据
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">共 {totalResponses} 份答卷</p>

      {stats.map((q, idx) => (
        <div key={q.question_id}>
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            {idx + 1}. {q.title}
          </h4>

          {/* 单选/多选：柱状图 */}
          {q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-20 truncate">
                    {opt.text}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(opt.percentage, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">
                    {opt.count} ({opt.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 简答题：列表 */}
          {q.answers && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {q.answers.length === 0 ? (
                <p className="text-xs text-gray-400">暂无回答</p>
              ) : (
                q.answers.map((a) => (
                  <p
                    key={a.id}
                    className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-1.5"
                  >
                    {a.content || "(空)"}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

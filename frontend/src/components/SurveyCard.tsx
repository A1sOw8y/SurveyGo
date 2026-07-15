import Link from "next/link";

interface SurveyCardProps {
  id: number;
  title: string;
  description: string;
  question_count: number;
  response_count: number;
  created_at: string;
}

export default function SurveyCard({
  id,
  title,
  description,
  question_count,
  created_at,
}: SurveyCardProps) {
  const date = new Date(created_at).toLocaleDateString("zh-CN");

  return (
    <Link
      href={`/survey/${id}`}
      className="flex flex-col bg-white rounded-xl border border-gray-200 p-5 h-full min-h-[120px] hover:shadow-md hover:border-blue-300 transition-all"
    >
      <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">
        {description || "暂无描述"}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span>{question_count} 道题</span>
        <span>{date}</span>
      </div>
    </Link>
  );
}

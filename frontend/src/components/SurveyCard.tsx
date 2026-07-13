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
  response_count,
  created_at,
}: SurveyCardProps) {
  const date = new Date(created_at).toLocaleDateString("zh-CN");

  return (
    <Link
      href={`/survey/${id}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span>{question_count} 题</span>
        <span>{response_count} 份答卷</span>
        <span className="ml-auto">{date}</span>
      </div>
    </Link>
  );
}

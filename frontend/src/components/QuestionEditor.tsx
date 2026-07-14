"use client";

interface Option {
  id: string;
  text: string;
}

interface QuestionData {
  id: string;        // 前端临时 ID
  type: "single" | "multi" | "text";
  title: string;
  options: Option[];
  required: boolean;
}

interface QuestionEditorProps {
  question: QuestionData;
  onChange: (q: QuestionData) => void;
  onDelete: () => void;
}

let _optSeq = 0;
function newOptionId(): string {
  _optSeq++;
  return `o${_optSeq}`;
}

export type { QuestionData, Option };

export function newQuestion(): QuestionData {
  return {
    id: `q_${Date.now()}`,
    type: "single",
    title: "",
    options: [
      { id: newOptionId(), text: "" },
      { id: newOptionId(), text: "" },
    ],
    required: true,
  };
}

export default function QuestionEditor({
  question,
  onChange,
  onDelete,
}: QuestionEditorProps) {
  const { type, title, options, required } = question;

  const update = (patch: Partial<QuestionData>) =>
    onChange({ ...question, ...patch });

  const addOption = () => {
    if (options.length >= 10) return;
    update({ options: [...options, { id: newOptionId(), text: "" }] });
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    update({ options: options.filter((_, i) => i !== idx) });
  };

  const setOptionText = (idx: number, text: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], text };
    update({ options: next });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <select
            value={type}
            onChange={(e) => {
              const newType = e.target.value as QuestionData["type"];
              update({
                type: newType,
                options:
                  newType === "text"
                    ? []
                    : options.length >= 2
                    ? options
                    : [
                        { id: newOptionId(), text: "" },
                        { id: newOptionId(), text: "" },
                      ],
              });
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="single">单选题</option>
            <option value="multi">多选题</option>
            <option value="text">简答题</option>
          </select>

          <label className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => update({ required: e.target.checked })}
              className="accent-blue-500"
            />
            必答题
          </label>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-red-400 hover:text-red-600 transition-colors cursor-pointer"
        >
          删除题目
        </button>
      </div>

      {/* 题目标题 */}
      <input
        type="text"
        value={title}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="请输入题目内容"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* 选项编辑（单选/多选） */}
      {(type === "single" || type === "multi") && (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5">
                {String.fromCharCode(65 + idx)}.
              </span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => setOptionText(idx, e.target.value)}
                placeholder={`选项 ${idx + 1}`}
                className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="text-gray-300 hover:text-red-400 text-sm cursor-pointer"
                  title="删除选项"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer mt-1"
            >
              + 添加选项
            </button>
          )}
        </div>
      )}
    </div>
  );
}

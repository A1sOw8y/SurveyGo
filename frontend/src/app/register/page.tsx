"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { post } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("请填写用户名和密码");
      return;
    }

    setSubmitting(true);
    try {
      const res = await post<{ token: string }>("/api/auth/register", {
        username: username.trim(),
        password,
      });

      if (res.code === 201 && res.data) {
        setToken(res.data.token);
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
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">注册 SurveyGo</h1>

      <form onSubmit={handleRegister} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="2-20位字母、数字、下划线或中文"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="至少6位密码"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {submitting ? "注册中..." : "注册"}
        </button>

        <p className="text-center text-sm text-gray-500">
          已有账号？
          <Link href="/login" className="text-blue-600 hover:underline ml-1">
            去登录
          </Link>
        </p>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn, removeToken } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, [pathname]); // 路由变化时重新检查登录态

  const handleLogout = () => {
    removeToken();
    setLoggedIn(false);
    router.push("/");
  };

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-white font-semibold"
        : "text-gray-300 hover:text-white"
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 左侧 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-white tracking-tight">
            SurveyGo
          </Link>
          <Link href="/" className={linkClass("/")}>
            公开问卷
          </Link>
          {loggedIn && (
            <>
              <Link href="/create" className={linkClass("/create")}>
                创建问卷
              </Link>
              <Link href="/my" className={linkClass("/my")}>
                我的问卷
              </Link>
            </>
          )}
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              退出登录
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="text-sm bg-white text-gray-900 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

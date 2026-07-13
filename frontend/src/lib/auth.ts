/**
 * 前端 JWT 存储与读取工具
 * token 存 localStorage，页面刷新后仍保持登录态
 */

const TOKEN_KEY = "surveygo_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** 简单判断是否已登录（不校验 token 是否过期，过期由后端返回 401 处理） */
export function isLoggedIn(): boolean {
  return getToken() !== null;
}

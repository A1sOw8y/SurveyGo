/**
 * API 调用封装
 * 统一处理 base URL、JWT 请求头、错误响应
 */

import { getToken, removeToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  const json: ApiResponse<T> = await res.json();

  // token 过期或无效，清除本地存储
  if (json.code === 401) {
    removeToken();
  }

  return json;
}

// ── 便捷方法 ──

export function get<T = unknown>(endpoint: string) {
  return request<T>(endpoint, { method: "GET" });
}

export function post<T = unknown>(endpoint: string, body?: unknown) {
  return request<T>(endpoint, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function put<T = unknown>(endpoint: string, body?: unknown) {
  return request<T>(endpoint, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function del<T = unknown>(endpoint: string) {
  return request<T>(endpoint, { method: "DELETE" });
}

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}

export function success<T>(data: T, message = 'success'): ApiResponse<T> {
  return { code: 0, message, data }
}

export function fail(message: string, code = 1): ApiResponse<null> {
  return { code, message, data: null }
}

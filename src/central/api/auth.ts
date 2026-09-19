import { apiClient } from './client'

export type AuthType = 'central' | 'tenant'

export interface LoginPayload {
  email: string
  password: string
  type: AuthType
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  avatar?: string | null
  avatar_url?: string | null
  [key: string]: unknown
}

export interface AuthSuccessData {
  access_token: string
  token_type: string
  user: AuthUser
  redirect_url?: string
  permissions?: unknown
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const loginApi = async (payload: LoginPayload): Promise<ApiResponse<AuthSuccessData>> => {
  const { data } = await apiClient.post<string>('/auth/login', payload)
  return JSON.parse(atob(data)) as ApiResponse<AuthSuccessData>
}

export const registerApi = async (payload: RegisterPayload): Promise<ApiResponse<AuthSuccessData>> => {
  const { data } = await apiClient.post<ApiResponse<AuthSuccessData>>('/auth/register', {
    ...payload,
    type: 'central',
  })
  return data
}

export const logoutApi = async (): Promise<ApiResponse<null>> => {
  const { data } = await apiClient.post<ApiResponse<null>>('/central/logout')
  return data
}

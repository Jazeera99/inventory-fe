type User = {
  id: number
  username: string
  full_name: string
  role_id: number
  role: Role
  is_active: boolean
}

type ApiResponse<T> = {
  data: T
  message?: string
}

type PaginatedResponse<T> = {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

type UserPayload = {
  username: string
  full_name: string
  role_id: number
  password?: string
}

type FormError = Record<string, string[] | string>

type Pagination = {
  current_page: number
  from: number
  last_page: number
  links: object[]
  path: string
  per_page: number
  to: number
  total: number
}
type ApiResource<T, U = object> = U & {
  data: T
}
type ApiCollection<T, U = object> = U & {
  data: T[]
  meta?: Pagination
}

type PaginatedResponse<T> = {
  data: T[]
}

type CursorPagination = {
  next_cursor: string | null
  per_page: number
  prev_cursor: string | null
}
type ApiCollectionCursor<T, U = object> = U & {
  data: T[]
  meta: CursorPagination
}

type FormError = {
  [k: string]: string[]
}

declare const __APP_VERSION__: string

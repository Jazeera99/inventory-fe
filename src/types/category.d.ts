type Category = {
  id: number
  category_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type CategoryForm = {
  category_name: string
  description: string
}

// export interface CategoryResponse {
//   data: Category[]
//   meta: {
//     current_page: number
//     last_page: number
//     per_page: number
//     total: number
//   }
// }

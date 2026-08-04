type Customer = {
  id: number
  customer_name: string
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type CustomerFormData = {
  customer_name: string
  phone: string
  address: string
}

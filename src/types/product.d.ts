type Product = {
  sku: string // Primary Key di backend kamu
  product_name: string
  category_id: number
  category?: Category
  brand: string
  type: string | null
  packaging: string | null
  size: string | null
  unit: string | null
  min_stock: number
  is_active: boolean
  pricing?: Pricing
  created_at: string
  updated_at: string
}

type ProductFormData = {
  sku: string
  product_name: string
  category_id: number | null
  brand: string
  type: string | null
  packaging: string | null
  size: string | null
  unit: string | null
  min_stock: number
  purchase_price: number | string
  selling_price: number | string
}

type Pricing = {
  purchase_price: number
  selling_price: number
  margin_amount: number
  margin_percentage: string
  holding_cost_per_day: number
}

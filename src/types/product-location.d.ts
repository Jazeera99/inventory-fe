type ProductLocation = {
  id: number
  product_sku: string
  rack_id: number
  batch_code: string
  qty: number
  expired_at: string
  product?: {
    product_name: string
  }
  rack?: {
    rack_name: string
    location_code: string
  }
}

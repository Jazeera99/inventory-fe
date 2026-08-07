type StockOrderType = 'INBOUND' | 'OUTBOUND' | 'RETURN_IN' | 'RETURN_OUT'
type StockOrderStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED'

type StockOrderItem = {
  id?: number
  stock_order_id?: number
  product_sku: string
  product_name?: string
  qty_ordered: number
  qty_fulfilled: number
  qty_remaining?: number
  unit_price: number
  subtotal?: number
  product?: {
    sku: string
    product_name: string
  }
}

type StockOrder = {
  id: number
  order_no: string
  type: StockOrderType
  status: StockOrderStatus
  order_date: string
  expected_date?: string | null
  parent_id?: number | null
  parent_order_no?: string | null
  cancel_reason?: string | null
  notes?: string | null
  supplier_id?: number | null
  supplier?: Supplier | null
  customer_id?: number | null
  customer?: Customer | null
  items: StockOrderItem[]
  created_at?: string
}

type CreateStockOrderPayload = {
  type: StockOrderType
  supplier_id?: number | null
  customer_id?: number | null
  order_date: string
  expected_date?: string | null
  notes?: string | null
  items: Array<{
    product_sku: string
    qty_ordered: number
    unit_price: number
  }>
}

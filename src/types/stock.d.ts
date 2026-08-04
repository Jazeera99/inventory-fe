type StockTransaction = {
  transaction_no: string
  type: 'IN' | 'OUT' | 'MOVE' | 'ADJUSTMENT'
  date: string
  user_id: number
  user_name?: string
  user?: { id: number; username: string; full_name: string; name: string }
  deleted_by?: number | null
  deleted_by_name?: string | null
  deleted_by_user?: { id: number; username: string; full_name: string } | null
  items?: StockTransactionItem[]
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

// type StockTransaction = {
//   transaction_no: string
//   type: 'IN' | 'OUT' | 'MOVE' | 'ADJUSTMENT'
//   date: string
//   user_id: number
//   user?: { id: number; username: string; full_name: string; name: string }
//   deleted_by?: number | null
//   deleted_by_user?: { id: number; username: string; full_name: string } | null
//   items?: StockTransactionItem[]
//   deleted_at?: string | null
//   created_at: string
//   updated_at: string
// }

type StockTransactionItem = {
  id: number
  product_sku: string
  product?: { product_name: string }
  qty: number
  qty_before?: number
  qty_after?: number
  rack_id: number
  rack?: { rack_name: string }
  expired_at: string | null
  batch_code: string
}

// Untuk Payload Form
type StockTransactionFormData = {
  type: 'IN' | 'OUT' | 'MOVE' | 'ADJUSTMENT'
  date: string
  items: {
    product_sku: string
    qty: number
    rack_id: number | null
    // to_rack_id?: number | null
    target_rack_id?: number | null
    expired_at: string | null
    notes: string | null
    isValid?: boolean
    namaProduk?: string
    type?: 'IN' | 'OUT'
    isEvacuation?: boolean
  }[]
  force_out?: boolean
}

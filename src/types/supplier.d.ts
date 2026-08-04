type Supplier = {
  id: number
  supplier_name: string
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type SupplierFormData = {
  supplier_name: string
  phone: string
  address: string
}

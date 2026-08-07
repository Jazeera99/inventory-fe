// src/utils/axios.js
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

// Inisialisasi axios instance
const instance = axios.create({
  baseURL: 'http://localhost:5173', // Bisa diubah sesuai env
})

// Setup Mock Data (Dummy)
const mock = new MockAdapter(instance, { delayResponse: 500 }) // Delay simulasi loading

// Data Dummy Utama
const dummyOrders = [
  {
    id: 1,
    order_no: 'PO-2026-0001',
    type: 'INBOUND',
    supplier_id: 1,
    customer_id: null,
    supplier: {
      id: 1,
      name: 'PT Supplier Maju',
      email: 'supplier@maju.com',
      phone: '08123456789',
      address: 'Jakarta',
    },
    customer: null,
    order_date: '2026-07-25',
    expected_date: '2026-08-01',
    status: 'DRAFT',
    notes: 'Barang harus sampai sebelum bulan depan',
    items: [
      {
        id: 1,
        product_sku: 'SKU001',
        product: { product_name: 'Kopi Arabica 1kg' },
        qty_ordered: 10,
        qty_fulfilled: 0,
        unit_price: 150000,
      },
      {
        id: 2,
        product_sku: 'SKU002',
        product: { product_name: 'Gula Aren 500gr' },
        qty_ordered: 20,
        qty_fulfilled: 0,
        unit_price: 25000,
      },
    ],
  },
  {
    id: 2,
    order_no: 'SO-2026-0001',
    type: 'OUTBOUND',
    supplier_id: null,
    customer_id: 1,
    supplier: null,
    customer: {
      id: 1,
      name: 'Toko ABC',
      email: 'abc@toko.com',
      phone: '08123456789',
      address: 'Bandung',
    },
    order_date: '2026-07-26',
    expected_date: '2026-07-28',
    status: 'PARTIAL',
    notes: '',
    items: [
      {
        id: 3,
        product_sku: 'SKU003',
        product: { product_name: 'Susu Bubuk 400gr' },
        qty_ordered: 5,
        qty_fulfilled: 3,
        unit_price: 120000,
      },
    ],
  },
]

// --- MOCK ENDPOINTS ---

// 1. Get List Orders (dengan filter)
mock.onGet(/\/api\/stock-orders/).reply((config) => {
  let data = [...dummyOrders]
  // Simulasi filter
  const params = config.params || {}
  if (params.type) data = data.filter((o) => o.type === params.type)
  if (params.status) data = data.filter((o) => o.status === params.status)
  if (params.search) {
    const s = params.search.toLowerCase()
    data = data.filter(
      (o) =>
        o.order_no.toLowerCase().includes(s) ||
        o.items.some((item) => item.product_sku.toLowerCase().includes(s)),
    )
  }

  // Simulasi Pagination
  const page = params.page || 1
  const perPage = 10
  const start = (page - 1) * perPage
  const paginated = data.slice(start, start + perPage)

  return [
    200,
    {
      data: {
        data: paginated,
        current_page: page,
        last_page: Math.ceil(data.length / perPage),
        from: start + 1,
        to: start + paginated.length,
        total: data.length,
      },
    },
  ]
})

// 2. Get Detail Order
mock.onGet(/\/api\/stock-orders\/\d+/).reply((config) => {
  const id = parseInt(config.url?.split('/').pop() || '0')
  const order = dummyOrders.find((o) => o.id === id)
  if (order) return [200, { data: order }]
  return [404, { message: 'Order not found' }]
})

// 3. Create Order
mock.onPost('/api/stock-orders').reply((config) => {
  const newData = JSON.parse(config.data)
  const newOrder = {
    id: Date.now(),
    order_no: `${newData.type === 'INBOUND' ? 'PO' : 'SO'}-${new Date().getFullYear()}-${String(dummyOrders.length + 1).padStart(4, '0')}`,
    ...newData,
    status: 'DRAFT',
    supplier: newData.type === 'INBOUND' ? { id: newData.supplier_id, name: 'New Supplier' } : null,
    customer:
      newData.type === 'OUTBOUND' ? { id: newData.customer_id, name: 'New Customer' } : null,
    items: newData.items.map((item: any, idx: number) => ({
      ...item,
      id: Date.now() + idx,
      qty_fulfilled: 0,
      product: { product_name: `Produk ${item.product_sku}` },
    })),
  }
  dummyOrders.push(newOrder)
  return [201, { data: newOrder }]
})

// 4. Update Order
mock.onPut(/\/api\/stock-orders\/\d+/).reply((config) => {
  const id = parseInt(config.url?.split('/').pop() || '0')
  const index = dummyOrders.findIndex((o) => o.id === id)
  if (index !== -1) {
    const updatedData = JSON.parse(config.data)
    dummyOrders[index] = { ...dummyOrders[index], ...updatedData }
    return [200, { data: dummyOrders[index] }]
  }
  return [404]
})

// 5. Cancel Order
mock.onPost(/\/api\/stock-orders\/\d+\/cancel/).reply((config) => {
  const id = parseInt(config.url?.split('/')[4] || '0')
  const order = dummyOrders.find((o) => o.id === id)
  if (order) {
    order.status = 'CANCELLED'
    return [200, { data: order }]
  }
  return [404]
})

// --- MOCK DATA UNTUK DROPDOWN (Supplier & Produk) ---
mock.onGet('/api/suppliers').reply(200, {
  data: [
    { id: 1, name: 'PT Supplier Maju' },
    { id: 2, name: 'CV Distributor Jaya' },
  ],
})

mock.onGet('/api/customers').reply(200, {
  data: [
    { id: 1, name: 'Toko ABC' },
    { id: 2, name: 'CV Retail Indonesia' },
  ],
})

mock.onGet('/api/products').reply(200, {
  data: [
    { sku: 'SKU001', product_name: 'Kopi Arabica 1kg' },
    { sku: 'SKU002', product_name: 'Gula Aren 500gr' },
    { sku: 'SKU003', product_name: 'Susu Bubuk 400gr' },
    { sku: 'SKU004', product_name: 'Minyak Goreng 2L' },
  ],
})

export default instance

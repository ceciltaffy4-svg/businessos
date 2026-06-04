import { create } from 'zustand'

export interface CartItem {
  product_id: string
  sku: string
  name: string
  unit: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
  stock_quantity: number
}

export interface PosState {
  items: CartItem[]
  customer_id: string | null
  customer_name: string | null
  employee_id: string | null
  notes: string
  searchQuery: string
  paymentMethod: string
  amountTendered: number

  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateDiscount: (productId: string, discount: number) => void
  clearCart: () => void
  setCustomer: (id: string | null, name: string | null) => void
  setEmployee: (id: string | null) => void
  setNotes: (notes: string) => void
  setSearchQuery: (query: string) => void
  setPaymentMethod: (method: string) => void
  setAmountTendered: (amount: number) => void

  itemCount: () => number
  subtotal: () => number
  taxTotal: () => number
  discountTotal: () => number
  grandTotal: () => number
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  customer_id: null,
  customer_name: null,
  employee_id: null,
  notes: '',
  searchQuery: '',
  paymentMethod: 'cash',
  amountTendered: 0,

  addItem: (item) => {
    const existing = get().items.find((i) => i.product_id === item.product_id)
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      })
    } else {
      set({ items: [...get().items, item] })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      )
    })
  },

  updateDiscount: (productId, discount) => {
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, discount } : i
      )
    })
  },

  clearCart: () =>
    set({
      items: [],
      customer_id: null,
      customer_name: null,
      notes: '',
      paymentMethod: 'cash',
      amountTendered: 0
    }),

  setCustomer: (id, name) => set({ customer_id: id, customer_name: name }),
  setEmployee: (id) => set({ employee_id: id }),
  setNotes: (notes) => set({ notes }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setAmountTendered: (amountTendered) => set({ amountTendered }),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
  taxTotal: () => get().items.reduce((sum, i) => sum + i.quantity * i.unit_price * (i.tax_rate / 100), 0),
  discountTotal: () => get().items.reduce((sum, i) => sum + i.discount, 0),
  grandTotal: () => {
    const s = get()
    return s.subtotal() - s.discountTotal() + s.taxTotal()
  }
}))

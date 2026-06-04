import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../lib/api'
import { usePosStore } from '../../stores'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import CheckoutModal from './CheckoutModal'
import ReceiptView from './ReceiptView'
import type { Product } from '../../types'
import type { PosCheckoutResult } from '../../../preload/types'

export default function PosTerminal() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receipt, setReceipt] = useState<PosCheckoutResult | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const cartItems = usePosStore((s) => s.items)
  const itemCount = usePosStore((s) => s.itemCount())
  const subtotal = usePosStore((s) => s.subtotal())
  const taxTotal = usePosStore((s) => s.taxTotal())
  const discountTotal = usePosStore((s) => s.discountTotal())
  const grandTotal = usePosStore((s) => s.grandTotal())
  const addItem = usePosStore((s) => s.addItem)
  const removeItem = usePosStore((s) => s.removeItem)
  const updateQuantity = usePosStore((s) => s.updateQuantity)
  const clearCart = usePosStore((s) => s.clearCart)
  const setSearchQuery = usePosStore((s) => s.setSearchQuery)

  const fetchProducts = useCallback(async (q: string) => {
    setLoading(true)
    const result = await api.pos.searchProducts(q)
    if (result.success) {
      setProducts(result.data as Product[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts('')
  }, [fetchProducts])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search)
      setSearchQuery(search)
    }, 200)
    return () => clearTimeout(timer)
  }, [search, fetchProducts, setSearchQuery])

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus()
  }, [])

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      quantity: 1,
      unit_price: product.selling_price,
      discount: 0,
      tax_rate: product.tax_rate,
      stock_quantity: product.stock_quantity
    })
  }

  const handleBarcodeScan = async (value: string) => {
    if (value.length < 3) return
    const result = await api.pos.lookupProduct(value.trim())
    if (result.success && result.data) {
      handleAddToCart(result.data as Product)
      setSearch('')
    }
  }

  const categories = [...new Set(products.map((p) => p.category))]
  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products

  const handleCheckoutComplete = (result: PosCheckoutResult) => {
    setReceipt(result)
    setCheckoutOpen(false)
    clearCart()
  }

  const handleNewSale = () => {
    setReceipt(null)
    setSearch('')
    setSelectedCategory('')
  }

  if (receipt) {
    return <ReceiptView result={receipt} onNewSale={handleNewSale} />
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left: Product Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBarcodeScan(search)
              }}
              placeholder="Search products or scan barcode..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                !selectedCategory ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-surface-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => {
                const lowStock = product.stock_quantity <= product.min_stock_level
                const outOfStock = product.stock_quantity <= 0
                return (
                  <button
                    key={product.id}
                    onClick={() => !outOfStock && handleAddToCart(product)}
                    disabled={outOfStock}
                    className={`relative text-left p-4 rounded-xl border transition-all ${
                      outOfStock
                        ? 'bg-surface-50 border-surface-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-surface-200 hover:border-brand-400 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    {lowStock && !outOfStock && (
                      <Badge variant="warning">Low</Badge>
                    )}
                    {outOfStock && (
                      <Badge variant="danger">Out</Badge>
                    )}
                    <p className="text-sm font-medium text-surface-900 mt-1 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-surface-500 font-mono mt-0.5">{product.sku}</p>
                    <p className="text-lg font-bold text-brand-700 mt-2">${product.selling_price.toFixed(2)}</p>
                    <p className="text-xs text-surface-400 mt-0.5">Stock: {product.stock_quantity} {product.unit}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-surface-200 shadow-sm">
        <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900">Cart ({itemCount})</h2>
          {cartItems.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-600 hover:text-red-700 font-medium">
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-surface-400 text-sm">
              Cart is empty. Select products to begin.
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.product_id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{item.name}</p>
                  <p className="text-xs text-surface-500 font-mono">{item.sku}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-surface-200 text-surface-600 text-sm flex items-center justify-center hover:bg-surface-300"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock_quantity}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                      className="w-14 text-center text-sm border border-surface-300 rounded py-0.5"
                    />
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-surface-200 text-surface-600 text-sm flex items-center justify-center hover:bg-surface-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-surface-900">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-surface-500">@ ${item.unit_price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="text-surface-400 hover:text-red-500 shrink-0 mt-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-surface-200 p-4 space-y-2">
          <div className="flex justify-between text-sm text-surface-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-surface-600">
            <span>Tax</span>
            <span>${taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-surface-900 pt-2 border-t border-surface-200">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <Button
            className="w-full mt-3"
            size="lg"
            disabled={cartItems.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout — ${grandTotal.toFixed(2)}
          </Button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onComplete={handleCheckoutComplete}
      />
    </div>
  )
}

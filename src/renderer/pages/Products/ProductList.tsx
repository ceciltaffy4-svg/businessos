import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import DataTable, { type Column } from '../../components/ui/DataTable'
import SearchInput from '../../components/ui/SearchInput'
import Pagination from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ProductForm from './ProductForm'
import { CATEGORIES, type ProductFormValues } from './product.schema'
import type { Product } from '../../types'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)

  const pageSize = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await api.products.list({
      search: search || undefined,
      category: category || undefined,
      low_stock: lowStockOnly || undefined,
      page,
      pageSize
    })
    if (result.success) {
      setProducts(result.data as Product[])
      if (result.meta) setTotal(result.meta.total)
    }
    setLoading(false)
  }, [search, category, lowStockOnly, page, pageSize])

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleSave = async (data: ProductFormValues) => {
    if (editing) {
      await api.products.update(editing.id, data)
    } else {
      await api.products.create(data)
    }
    setFormOpen(false)
    setEditing(null)
    await fetch()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await api.products.delete(deleteConfirm.id)
    setDeleteConfirm(null)
    await fetch()
  }

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU',
      render: (p) => <span className="font-mono text-xs font-medium">{p.sku}</span>
    },
    {
      key: 'name',
      header: 'Name',
      render: (p) => (
        <div>
          <span className="font-medium">{p.name}</span>
          {p.stock_quantity <= p.min_stock_level && (
            <Badge variant="danger">Low Stock</Badge>
          )}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => <Badge variant="info">{p.category}</Badge>
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      render: (p) => <span className="font-mono">${p.selling_price.toFixed(2)}</span>,
      className: 'text-right'
    },
    {
      key: 'stock_quantity',
      header: 'Stock',
      render: (p) => (
        <span className={`font-mono font-medium ${p.stock_quantity <= p.min_stock_level ? 'text-red-600' : ''}`}>
          {p.stock_quantity} {p.unit}
        </span>
      ),
      className: 'text-right'
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditing(p); setFormOpen(true) }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirm(p)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Products</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          + Add Product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-64">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search by name, SKU, or barcode..."
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1) }}
            className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          />
          Low stock only
        </label>
      </div>

      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage="No products found. Add your first product to get started."
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Edit Product' : 'Add Product'}
      >
        <ProductForm
          product={editing}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
      >
        <p className="text-surface-600 mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will archive the product.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

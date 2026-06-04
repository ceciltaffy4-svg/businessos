import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { Product } from '../types'

interface UseProductsOptions {
  search?: string
  category?: string
  page?: number
  pageSize?: number
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api.products.list(options)
    if (result.success) {
      setProducts(result.data as Product[])
      if (result.meta) setTotal(result.meta.total)
    } else {
      setError(result.error?.message ?? 'Failed to load products')
    }
    setLoading(false)
  }, [options])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { products, total, loading, error, refetch: fetch }
}

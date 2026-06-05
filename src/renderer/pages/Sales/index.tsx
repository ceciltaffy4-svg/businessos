import { Routes, Route } from 'react-router-dom'
import SaleList from './SaleList'
import SaleDetail from './SaleDetail'

export default function SalesRouter() {
  return (
    <Routes>
      <Route index element={<SaleList />} />
      <Route path=":id" element={<SaleDetail />} />
    </Routes>
  )
}

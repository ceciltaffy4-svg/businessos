import { Routes, Route } from 'react-router-dom'
import CustomerList from './CustomerList'
import CustomerDetail from './CustomerDetail'

export default function CustomersRouter() {
  return (
    <Routes>
      <Route index element={<CustomerList />} />
      <Route path=":id" element={<CustomerDetail />} />
    </Routes>
  )
}

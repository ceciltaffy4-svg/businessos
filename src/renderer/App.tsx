import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProductList from './pages/Products'
import CustomersRouter from './pages/Customers'
import SaleList from './pages/Sales'
import ExpenseList from './pages/Expenses'
import EmployeeList from './pages/Employees'
import PosTerminal from './pages/POS'
import AiAssistant from './pages/AI'
import SettingsPage from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/pos" element={<PosTerminal />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/customers/*" element={<CustomersRouter />} />
              <Route path="/sales" element={<SaleList />} />
              <Route path="/expenses" element={<ExpenseList />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/ai" element={<AiAssistant />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  )
}

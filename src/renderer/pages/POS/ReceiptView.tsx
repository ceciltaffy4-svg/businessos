import { useRef } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import type { PosCheckoutResult } from '../../../preload/types'

interface ReceiptViewProps {
  result: PosCheckoutResult
  onNewSale: () => void
}

export default function ReceiptView({ result, onNewSale }: ReceiptViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handlePrint = async () => {
    const res = await api.pos.getReceiptHtml(result)
    if (res.success && typeof res.data === 'string') {
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(res.data)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 500)
      }
    }
  }

  const date = new Date(result.sale_date).toLocaleString()

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-600">Sale Complete</h2>
          <p className="text-sm text-surface-500 mt-1">Transaction successfully recorded</p>
        </div>

        <div className="bg-surface-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-surface-500">Invoice</span>
            <span className="font-mono font-semibold">{result.invoice_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-500">Date</span>
            <span>{date}</span>
          </div>
          {result.customer_name && (
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Customer</span>
              <span>{result.customer_name}</span>
            </div>
          )}
          <div className="border-t border-surface-200 pt-2">
            {result.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-surface-700 truncate max-w-[200px]">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-mono">${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 pt-2 flex justify-between font-bold text-lg">
            <span>Total Paid</span>
            <span>${result.grand_total.toFixed(2)}</span>
          </div>
          {result.change_due > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Change Due</span>
              <span>${result.change_due.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" className="w-full" onClick={handlePrint}>
            Print Receipt
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={onNewSale}>
            New Sale
          </Button>
        </div>
      </div>
    </div>
  )
}

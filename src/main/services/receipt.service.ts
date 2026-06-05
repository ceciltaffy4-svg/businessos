import { getDatabase } from '../database/connection'
import type { PosCheckoutLineItem } from './pos.service'

export interface PosCheckoutResult {
  sale_id: string
  invoice_number: string
  grand_total: number
  amount_paid: number
  change_due: number
  items: PosCheckoutLineItem[]
  sale_date: string
  customer_name?: string
}

export interface BusinessInfo {
  name: string
  address: string
  phone: string
  email: string
  tax_id: string
}

function getBusinessInfo(): BusinessInfo {
  const db = getDatabase()
  const settings = db
    .prepare("SELECT key, value FROM app_settings WHERE key IN ('business_name', 'business_address', 'business_phone', 'business_email', 'business_tax_id')")
    .all() as Array<{ key: string; value: string }>

  const map: Record<string, string> = {}
  for (const row of settings) {
    map[row.key] = row.value
  }

  return {
    name: map['business_name'] || 'Your Business Name',
    address: map['business_address'] || '123 Main Street, City',
    phone: map['business_phone'] || '+1-555-0000',
    email: map['business_email'] || 'info@business.com',
    tax_id: map['business_tax_id'] || 'TAX-123456'
  }
}

export function generateReceiptHtml(result: PosCheckoutResult): string {
  const biz = getBusinessInfo()
  const date = new Date(result.sale_date).toLocaleString()
  const itemsHtml = result.items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 8px;">${item.name}</td>
        <td style="padding:4px 8px;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 8px;text-align:right;">$${item.unit_price.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right;">$${item.total.toFixed(2)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${result.invoice_number}</title>
  <style>
    @page { margin: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; color: #000; }
    .receipt { max-width: 300px; margin: 0 auto; }
    h1 { text-align: center; font-size: 18px; margin: 0 0 4px; }
    .biz-info { text-align: center; font-size: 11px; margin-bottom: 12px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .invoice-info { font-size: 11px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { border-bottom: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 10px; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    .totals { margin-top: 8px; }
    .totals-row { display: flex; justify-content: space-between; padding: 2px 8px; font-size: 11px; }
    .totals-row.grand { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
    .payment { margin-top: 8px; font-size: 11px; text-align: center; }
    .footer { text-align: center; font-size: 10px; margin-top: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="receipt">
    <h1>${biz.name}</h1>
    <div class="biz-info">
      ${biz.address}<br>
      Phone: ${biz.phone}<br>
      Email: ${biz.email}<br>
      Tax ID: ${biz.tax_id}
    </div>
    <div class="divider"></div>
    <div class="invoice-info">
      <strong>Invoice:</strong> ${result.invoice_number}<br>
      <strong>Date:</strong> ${date}
    </div>
    ${result.customer_name ? `<div class="invoice-info"><strong>Customer:</strong> ${result.customer_name}</div>` : ''}
    <div class="divider"></div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="center">Qty</th>
          <th class="right">Price</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="divider"></div>
    <div class="totals">
      <div class="totals-row grand"><span>Total Paid</span><span>$${result.amount_paid.toFixed(2)}</span></div>
      ${result.change_due > 0 ? `<div class="totals-row"><span>Change</span><span>$${result.change_due.toFixed(2)}</span></div>` : ''}
    </div>
    <div class="payment">
      Payment: Completed
    </div>
    <div class="divider"></div>
    <div class="footer">
      Thank you for your business!<br>
      Items sold are non-returnable.
    </div>
  </div>
</body>
</html>`
}

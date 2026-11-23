import { db } from '../src/lib/db'
async function main() {
  const tables = [
    ['User', db.user], ['Session', db.session], ['MenuItem', db.menuItem],
    ['Invoice', db.invoice], ['InvoiceItem', db.invoiceItem],
    ['Customer', db.customer], ['CustomerOrder', db.customerOrder],
    ['CustomerOrderItem', db.customerOrderItem], ['WalletTransaction', db.walletTransaction],
    ['Supplier', db.supplier], ['Purchase', db.purchase], ['PurchaseItem', db.purchaseItem],
    ['InventoryItem', db.inventoryItem], ['StockMovement', db.stockMovement],
    ['Expense', db.expense], ['Review', db.review], ['Notification', db.notification],
  ] as const
  for (const [name, model] of tables) {
    try {
      const count = await (model as any).count()
      console.log(`${name}: ${count}`)
    } catch { console.log(`${name}: خطأ`) }
  }
}
main().catch(console.error).finally(() => process.exit(0))

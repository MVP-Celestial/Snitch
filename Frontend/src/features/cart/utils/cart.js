export const idOf = value => typeof value === 'string' ? value : value?._id
export function cartLine(item) {
  const product = typeof item.product === 'object' && item.product ? item.product : null
  const reference = item.variant ?? item.variants ?? item.varient
  const variantId = idOf(reference)
  const variant = product?.variants?.find(value => value._id === variantId)
    || (typeof reference === 'object' ? reference : null)
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const rawPrice = item.price?.amount ?? variant?.price?.amount ?? product?.price?.amount
  const amount = Number(rawPrice)
  const priced = rawPrice != null && Number.isFinite(amount) && amount >= 0
  const currency = item.price?.currency || product?.price?.currency || 'INR'
  return { product, variant, variantId, quantity, amount, currency, priced,
    productId: idOf(item.product),
    title: product?.title || 'Product no longer available',
    image: variant?.images?.[0]?.url || product?.images?.[0]?.url,
    attributes: variant?.attributes || {},
  }
}
export function cartTotals(lines) {
  return lines.reduce((totals, line) => {
    if (line.priced && line.product) totals[line.currency] = (totals[line.currency] || 0) + line.amount * line.quantity
    return totals
  }, {})
}
export function money(amount, currency) {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount) }
  catch { return `${currency} ${amount.toFixed(2)}` }
}

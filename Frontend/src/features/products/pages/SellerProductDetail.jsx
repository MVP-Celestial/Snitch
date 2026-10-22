import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Image, LoaderCircle, Package, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useProduct } from '../hooks/useProduct'

const CURRENCIES = ['INR', 'USD', 'GBP', 'JPY']
const inputClass = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'

function VariantStockCard({ variant, onUpdated }) {
  const [stock, setStock] = useState(String(variant.stock ?? 0))
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const attributes = variant.attributes instanceof Map
    ? Object.fromEntries(variant.attributes)
    : variant.attributes || {}
  const images = (variant.images || []).map((image) => image?.url).filter(Boolean)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextStock = Number(stock)
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Enter a non-negative whole number.')
      setStatus('')
      return
    }

    setSaving(true)
    setError('')
    setStatus('')
    try {
      onUpdated(variant._id, nextStock)
      setStatus('Stock updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(attributes).map(([key, value]) => (
              <span key={key} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
                <span className="font-medium">{key}:</span> {String(value)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-950">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: variant.price?.currency || 'INR',
              maximumFractionDigits: 2,
            }).format(variant.price?.amount ?? 0)}
          </p>
        </div>
        <span className="text-xs text-neutral-400">Variant ID: {variant._id}</span>
      </div>

      {images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Variant images">
          {images.map((url, index) => (
            <img key={`${url}-${index}`} src={url} alt={`${Object.values(attributes).join(' ')} variant ${index + 1}`} className="h-16 w-16 rounded-md border border-neutral-200 object-cover" />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4">
        <div className="w-36">
          <label htmlFor={`stock-${variant._id}`} className="mb-1.5 block text-xs font-medium text-neutral-700">Available stock</label>
          <input
            id={`stock-${variant._id}`}
            type="number"
            min="0"
            step="1"
            required
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={saving} className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">
          {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          Save stock
        </button>
        {status && <span role="status" className="text-sm text-emerald-700">{status}</span>}
        {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
      </form>
    </article>
  )
}

export default function SellerProductDetail() {
  const { productId } = useParams()
  const { handleGetSellerProduct } = useProduct()
  const [loadResult, setLoadResult] = useState(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [attributes, setAttributes] = useState([{ key: '', value: '' }])
  const [variantPrice, setVariantPrice] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [stock, setStock] = useState('0')
  const [images, setImages] = useState([])
  const [formError, setFormError] = useState('')
  const [savingVariant, setSavingVariant] = useState(false)
  const [variantNotice, setVariantNotice] = useState('')

  useEffect(() => {
    let active = true
    handleGetSellerProduct()
      .then((products) => {
        if (!active) return
        const data = products.find((sellerProduct) => sellerProduct._id === productId)
        setLoadResult({
          productId,
          requestVersion,
          product: data || null,
          error: data ? '' : 'Product not found in your seller account.',
        })
      })
      .catch((requestError) => {
        if (!active) return
        setLoadResult({
          productId,
          requestVersion,
          product: null,
          error: requestError.response?.status === 401 || requestError.response?.status === 403
            ? 'Please sign in with your seller account to manage this product.'
            : requestError.response?.data?.message || 'We could not load this product. Please try again.',
        })
      })
    return () => { active = false }
  }, [handleGetSellerProduct, productId, requestVersion])

  const refreshProduct = useCallback(() => {
    setRequestVersion((version) => version + 1)
  }, [])

  const onVariantUpdated = useCallback((updatedProduct) => {
    setLoadResult((current) => current && ({
      ...current,
      product: {
        ...current.product,
        variants: current.product.variants.map((variant) => variant._id === updatedProduct.id
          ? { ...variant, stock: updatedProduct.stock }
          : variant),
      },
    }))
  }, [])

  const updateAttribute = (index, field, value) => {
    setAttributes((current) => current.map((attribute, position) =>
      position === index ? { ...attribute, [field]: value } : attribute
    ))
  }

  const submitVariant = async (event) => {
    event.preventDefault()
    if (savingVariant) return

    const variantAttributes = {}
    for (const attribute of attributes) {
      const key = attribute.key.trim()
      const value = attribute.value.trim()
      if (!key || !value) {
        setFormError('Complete each attribute name and value, or remove the empty row.')
        return
      }
      if (Object.keys(variantAttributes).some((existingKey) => existingKey.toLowerCase() === key.toLowerCase())) {
        setFormError('Attribute names must be unique.')
        return
      }
      variantAttributes[key] = value
    }

    const amount = Number(variantPrice)
    const quantity = Number(stock)
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError('Enter a valid non-negative variant price.')
      return
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setFormError('Stock must be a non-negative whole number.')
      return
    }

    setSavingVariant(true)
    setFormError('')
    setVariantNotice('')
    try {
      const variant = {
        _id: `local-${Date.now()}`,
        attributes: variantAttributes,
        price: { amount, currency },
        stock: quantity,
        images: [],
      }
      setLoadResult((current) => current && ({
        ...current,
        product: { ...current.product, variants: [...(current.product.variants || []), variant] },
      }))
      setVariantNotice('Variant added to this page preview. Changes are not saved to the server.')
      setAttributes([{ key: '', value: '' }])
      setVariantPrice('')
      setCurrency('INR')
      setStock('0')
      setImages([])
    } finally {
      setSavingVariant(false)
    }
  }

  const loadMatchesCurrentProduct = loadResult?.productId === productId && loadResult?.requestVersion === requestVersion
  const status = !loadMatchesCurrentProduct ? 'loading' : loadResult.error ? 'error' : 'ready'
  const error = loadMatchesCurrentProduct ? loadResult.error : ''
  const product = status === 'ready' ? loadResult.product : null
  const productImages = (product?.images || []).map((image) => image?.url).filter(Boolean)

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/seller/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950">
          <ArrowLeft size={16} aria-hidden="true" /> Seller dashboard
        </Link>

        {status === 'loading' && (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500" role="status">
            <LoaderCircle size={22} className="mx-auto mb-3 animate-spin" /> Loading product…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert">
            <h1 className="text-xl font-semibold">Product unavailable</h1>
            <p className="mt-2 text-sm text-neutral-600">{error}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" onClick={refreshProduct} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm text-white"><RefreshCw size={16} />Try again</button>
              <Link to="/seller/dashboard" className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm">Dashboard</Link>
            </div>
          </div>
        )}

        {status === 'ready' && product && (
          <>
            <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[.16em] text-neutral-500">SELLER WORKSPACE / PRODUCT</p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{product.description || 'No product description.'}</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                <Package size={18} className="text-neutral-500" />
                <span>{product.variants?.length || 0} variant{product.variants?.length === 1 ? '' : 's'}</span>
              </div>
            </header>

            <div className="mb-8 grid gap-6 sm:grid-cols-[140px_1fr]">
              <div className="flex gap-2 overflow-x-auto sm:flex-col">
                {productImages.length ? productImages.map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt={`${product.title} photo ${index + 1}`} className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200 bg-white object-cover sm:h-32 sm:w-full" />
                )) : <div className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-neutral-300 text-neutral-400 sm:h-32 sm:w-full"><Image size={24} /></div>}
              </div>
              <section aria-labelledby="variants-heading">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div><h2 id="variants-heading" className="text-xl font-semibold">Product variants</h2><p className="mt-1 text-sm text-neutral-500">Set the price and manage inventory for each option.</p></div>
                </div>
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Preview mode: changes on this page are temporary and are not saved to the server.</p>
                {product.variants?.length ? (
                  <div className="space-y-3">
                    {product.variants.map((variant) => (
                      <VariantStockCard key={variant._id} variant={variant} onUpdated={(id, nextStock) => onVariantUpdated({ id, stock: nextStock })} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">There are no variants yet. Create the first one below.</div>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="create-variant-heading">
              <div className="mb-6">
                <h2 id="create-variant-heading" className="text-xl font-semibold">Create a variant</h2>
                <p className="mt-1 text-sm text-neutral-500">Add options like size or color, then set its price and starting stock.</p>
              </div>

              <form onSubmit={submitVariant} aria-busy={savingVariant} className="space-y-6">
                <fieldset className="space-y-3">
                  <legend className="mb-2 text-sm font-medium text-neutral-800">Variant attributes</legend>
                  {attributes.map((attribute, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <label className="sr-only" htmlFor={`attribute-name-${index}`}>Attribute name</label>
                      <input id={`attribute-name-${index}`} value={attribute.key} onChange={(event) => updateAttribute(index, 'key', event.target.value)} placeholder="e.g. Size" className={inputClass} required />
                      <label className="sr-only" htmlFor={`attribute-value-${index}`}>Attribute value</label>
                      <input id={`attribute-value-${index}`} value={attribute.value} onChange={(event) => updateAttribute(index, 'value', event.target.value)} placeholder="e.g. Medium" className={inputClass} required />
                      <button type="button" aria-label="Remove attribute" disabled={attributes.length === 1} onClick={() => setAttributes((current) => current.filter((_, position) => position !== index))} className="grid h-[42px] w-[42px] place-items-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAttributes((current) => [...current, { key: '', value: '' }])} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black"><Plus size={16} />Add attribute</button>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="variant-price" className="mb-1.5 block text-sm font-medium">Price</label>
                    <input id="variant-price" type="number" min="0" step="0.01" value={variantPrice} onChange={(event) => setVariantPrice(event.target.value)} placeholder={String(product.price?.amount ?? '0.00')} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="variant-currency" className="mb-1.5 block text-sm font-medium">Currency</label>
                    <select id="variant-currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className={inputClass}>{CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</select>
                  </div>
                  <div>
                    <label htmlFor="variant-stock" className="mb-1.5 block text-sm font-medium">Starting stock</label>
                    <input id="variant-stock" type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="variant-images" className="mb-1.5 block text-sm font-medium">Variant images <span className="font-normal text-neutral-500">(optional, up to 7)</span></label>
                  <input id="variant-images" type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files || []).slice(0, 7))} className="block w-full rounded-lg border border-neutral-200 bg-white text-sm file:mr-4 file:border-0 file:bg-neutral-100 file:px-4 file:py-2.5 file:text-sm file:font-medium" />
                  {images.length > 0 && <p className="mt-2 text-xs text-neutral-500">{images.length} image{images.length === 1 ? '' : 's'} selected: {images.map((image) => image.name).join(', ')}</p>}
                </div>

                {variantNotice && <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{variantNotice}</p>}
                {formError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
                <button type="submit" disabled={savingVariant} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">
                  {savingVariant ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}
                  {savingVariant ? 'Creating variant…' : 'Create variant'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { ArrowDown, ArrowUpRight, ImageIcon, Package, RefreshCw, Search, X } from 'lucide-react'
import { useProduct } from '../hooks/useProduct'
import './Home.css'

const imagesOf = (product) => (product.images || []).map((image) => image.url).filter(Boolean)
const priceOf = (product) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: product.price?.currency || 'INR', maximumFractionDigits: 2,
}).format(product.price?.amount ?? 0)

function ProductImage({ src, title }) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? (
    <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className="home-image-placeholder"><ImageIcon size={30} strokeWidth={1} aria-hidden="true" /><span>Image unavailable</span></div>
  )
}

function ProductDetails({ product, onClose }) {
  const dialog = useRef(null)
  const [imageIndex, setImageIndex] = useState(0)
  const images = imagesOf(product)

  useEffect(() => {
    if (!dialog.current.open) dialog.current.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="home-dialog" aria-labelledby="home-product-title" onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }}>
      <button type="button" className="home-close" aria-label="Close product details" onClick={() => dialog.current.close()}><X size={20} /></button>
      <div className="home-detail-layout">
        <div className="home-detail-image"><ProductImage key={images[imageIndex] || 'empty'} src={images[imageIndex]} title={product.title} /></div>
        <div className="home-detail-info">
          <p className="home-eyebrow">THE COLLECTION</p>
          <h2 id="home-product-title">{product.title}</h2>
          <p className="home-detail-price">{priceOf(product)} <span>{product.price?.currency || 'INR'}</span></p>
          <h3>About this product</h3>
          <p className="home-description">{product.description || 'No description available.'}</p>
          {images.length > 1 && <div className="home-thumbnails" aria-label="Product images">
            {images.map((url, index) => <button type="button" key={`${url}-${index}`} aria-label={`Show image ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)}>
              <ProductImage src={url} title={`${product.title}, image ${index + 1}`} />
            </button>)}
          </div>}
        </div>
      </div>
    </dialog>
  )
}

export default function Home() {
  const products = useSelector((state) => state.product.products) || []
  const user = useSelector((state) => state.auth.user)
  const { handleGetAllProducts } = useProduct()
  const [status, setStatus] = useState('loading')
  const [requestVersion, setRequestVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [currency, setCurrency] = useState('all')
  const [sort, setSort] = useState('latest')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    handleGetAllProducts(controller.signal).then(() => {
      if (!controller.signal.aborted) setStatus('ready')
    }).catch(() => {
      if (!controller.signal.aborted) setStatus('error')
    })
    return () => controller.abort()
  }, [handleGetAllProducts, requestVersion])

  const currencies = [...new Set(products.map((product) => product.price?.currency || 'INR'))].sort()
  const visibleProducts = products.filter((product) =>
    `${product.title || ''} ${product.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    && (currency === 'all' || (product.price?.currency || 'INR') === currency)
  ).sort((a, b) => sort === 'name'
    ? (a.title || '').localeCompare(b.title || '')
    : (b._id || '').localeCompare(a._id || ''))

  return (
    <div className="shop-home">
      <div className="home-announcement">A little discovery. A new favourite.</div>
      <header className="home-header">
        <Link to="/" className="home-brand" aria-label="Snitch home">snitch<span>.</span></Link>
        <nav aria-label="Main navigation">
          <a href="#collection" className="home-nav-shop">Shop collection</a>
          {user?.role === 'seller' ? <Link to="/seller/dashboard">Seller dashboard<ArrowUpRight size={15} aria-hidden="true" /></Link>
            : !user && <Link to="/login">Sign in<ArrowUpRight size={15} aria-hidden="true" /></Link>}
        </nav>
      </header>
      <main className="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <div><p className="home-eyebrow">THE EVERYDAY, REIMAGINED</p>
            <h1 id="home-title">Find your next<br /><em>favourite.</em></h1>
            <p className="home-hero-description">Fresh finds. Everyday essentials. Explore the collection<br /> and discover something that feels like you.</p>
            <a href="#collection" className="home-shop-link">Explore the collection <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
          <div className="home-hero-note" aria-hidden="true"><span>✳</span><p>GOOD FINDS.<br />GREAT POSSIBILITIES.</p><small>Make room for something new.</small></div>
        </section>
        <section id="collection" className="home-collection" aria-labelledby="home-collection-title" aria-busy={status === 'loading'}>
          <div className="home-collection-heading"><div><p className="home-eyebrow">DISCOVER SOMETHING YOU LOVE</p><h2 id="home-collection-title">The collection<span>{status === 'ready' ? products.length : '…'}</span></h2></div><p>A fresh perspective on the everyday.</p></div>
          <div className="home-toolbar">
            <label className="home-search"><Search size={18} aria-hidden="true" /><input type="search" aria-label="Search products" placeholder="Search for your next find..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <select aria-label="Filter by currency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="all">All currencies</option>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select>
            <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="latest">Latest added</option><option value="name">Name: A to Z</option></select>
          </div>
          {status === 'loading' && <div className="home-grid" role="status" aria-label="Loading products">{Array.from({ length: 8 }, (_, index) => <div key={index} className="home-skeleton"><div /><span /><span /></div>)}</div>}
          {status === 'error' && <div className="home-state" role="alert"><RefreshCw size={30} strokeWidth={1.2} /><h3>We couldn't load the collection.</h3><p>Please try again in a moment.</p><button type="button" onClick={() => { setStatus('loading'); setRequestVersion((value) => value + 1) }}>Try again</button></div>}
          {status === 'ready' && <>
            <p className="home-result-count" role="status">{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}{query.trim() ? ` matching “${query.trim()}”` : ' to discover'}</p>
            {visibleProducts.length ? <div className="home-grid">{visibleProducts.map((product) => (
              <article className="home-card" key={product._id}>
                <button type="button" className="home-card-button" aria-label={`View ${product.title}`} onClick={() => setSelectedProduct(product)}>
                  <div className="home-card-image"><ProductImage src={imagesOf(product)[0]} title={product.title} />
                    {imagesOf(product).length > 1 && <span className="home-image-count">{imagesOf(product).length} photos</span>}
                    <span className="home-quick-view">View details <ArrowUpRight size={16} aria-hidden="true" /></span>
                  </div>
                  <div className="home-card-info"><h3>{product.title}</h3><p className="home-card-description">{product.description || 'Explore this product'}</p><p className="home-price">{priceOf(product)} <span>{product.price?.currency || 'INR'}</span></p></div>
                </button>
              </article>
            ))}</div> : <div className="home-state"><Package size={32} strokeWidth={1.2} /><h3>{products.length ? 'No matching finds just yet.' : 'Something good is on its way.'}</h3><p>{products.length ? 'Try another search or browse the full collection.' : 'Check back soon to discover our products.'}</p>{products.length > 0 && <button type="button" onClick={() => { setQuery(''); setCurrency('all') }}>Clear filters</button>}</div>}
          </>}
        </section>
      </main>
      <footer className="home-footer"><Link to="/" className="home-brand">snitch<span>.</span></Link><p>Find something that feels like you.</p><a href="#collection">Back to collection <ArrowUpRight size={14} aria-hidden="true" /></a></footer>
      {selectedProduct && <ProductDetails key={selectedProduct._id} product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Image, LayoutGrid, List, Package, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles, Store, X } from 'lucide-react'
import { useProduct } from '../hooks/useProduct'
import './Dashboard.css'

const PAGE_SIZE = 9
const money = (product) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: product.price?.currency || 'INR', maximumFractionDigits: 2,
}).format(product.price?.amount ?? 0)
const photoUrls = (product) => (product.images || []).map((image) => image.url).filter(Boolean)

function ProductPhoto({ src, title }) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? (
    <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className="sd-photo-placeholder"><Image size={32} strokeWidth={1.2} /><span>No image available</span></div>
  )
}

function ProductDetails({ product, onClose }) {
  const dialog = useRef(null)
  const [imageIndex, setImageIndex] = useState(0)
  const images = photoUrls(product)

  useEffect(() => {
    const element = dialog.current
    if (!element.open) element.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="sd-dialog" aria-labelledby="product-detail-title" onClose={onClose} onClick={(event) => {
      if (event.target === event.currentTarget) dialog.current.close()
    }}>
      <div className="sd-dialog-content">
        <button className="sd-icon-button sd-dialog-close" aria-label="Close product details" onClick={() => dialog.current.close()}><X size={20} /></button>
        <div className="sd-detail-photo"><ProductPhoto key={images[imageIndex] || 'empty'} src={images[imageIndex]} title={product.title} /></div>
        <div className="sd-detail-info">
          <span className="sd-eyebrow">YOUR COLLECTION</span>
          <h2 id="product-detail-title">{product.title}</h2>
          <p className="sd-detail-price">{money(product)}</p>
          <h3>About this product</h3>
          <p className="sd-detail-description">{product.description || 'No description provided.'}</p>
          {images.length > 1 && <div className="sd-thumbnails" aria-label="Product images">{images.map((url, index) => (
            <button key={`${url}-${index}`} aria-label={`Show image ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)}>
              <ProductPhoto src={url} title={`${product.title}, image ${index + 1}`} />
            </button>
          ))}</div>}
          <p className="sd-product-id">Product ID <span>{product._id}</span></p>
        </div>
      </div>
    </dialog>
  )
}

export default function Dashboard() {
  const { handleGetSellerProduct } = useProduct()
  const sellerProducts = useSelector((state) => state.product.sellerProducts) || []
  const user = useSelector((state) => state.auth.user)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [currency, setCurrency] = useState('all')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    handleGetSellerProduct(controller.signal).then(() => {
      if (!controller.signal.aborted) setStatus('ready')
    }).catch((err) => {
      if (controller.signal.aborted) return
      setError(err.response?.status === 401 || err.response?.status === 403
        ? 'Please sign in with your seller account to view your products.'
        : 'We couldn’t load your products. Please try again.')
      setStatus('error')
    })
    return () => controller.abort()
  }, [handleGetSellerProduct, requestVersion])

  const refresh = () => { setStatus('loading'); setError(''); setRequestVersion((value) => value + 1) }
  const updateFilter = (setter, value) => { setter(value); setPage(1) }
  const resetFilters = () => { setQuery(''); setFilter('all'); setCurrency('all'); setSort('newest'); setPage(1) }
  const currencies = [...new Set(sellerProducts.map((product) => product.price?.currency || 'INR'))].sort()
  const withImages = sellerProducts.filter((product) => photoUrls(product).length > 0).length
  const totals = currencies.map((code) => ({ code, amount: sellerProducts.reduce((sum, product) => sum + ((product.price?.currency || 'INR') === code ? Number(product.price?.amount || 0) : 0), 0) }))
  const filteredProducts = sellerProducts.filter((product) => {
    const matchesSearch = `${product.title || ''} ${product.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    const hasImages = photoUrls(product).length > 0
    return matchesSearch && (currency === 'all' || (product.price?.currency || 'INR') === currency)
      && (filter === 'all' || (filter === 'photos' ? hasImages : !hasImages))
  }).sort((a, b) => {
    if (sort === 'name') return (a.title || '').localeCompare(b.title || '')
    if (sort.startsWith('price')) {
      const byCurrency = (a.price?.currency || 'INR').localeCompare(b.price?.currency || 'INR')
      return byCurrency || (Number(a.price?.amount || 0) - Number(b.price?.amount || 0)) * (sort === 'price-low' ? 1 : -1)
    }
    return (b._id || '').localeCompare(a._id || '')
  })
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const sellerName = user?.fullname || 'Your store'
  const initials = sellerName.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const ready = status === 'ready'

  return (
    <div className="seller-dashboard">
      <aside className="sd-sidebar">
        <Link to="/seller/dashboard" className="sd-brand" aria-label="Snitch seller dashboard">snitch<span>.</span></Link>
        <span className="sd-workspace-label">SELLER WORKSPACE</span>
        <nav aria-label="Seller navigation">
          <a href="#collection" className="sd-nav-link sd-nav-active" aria-current="page"><Package size={18} />My products<span>{ready ? sellerProducts.length : '—'}</span></a>
          <Link to="/seller/create-product" className="sd-nav-link"><Plus size={18} />Add a product</Link>
        </nav>
        <div className="sd-sidebar-bottom">
          <div className="sd-sidebar-note"><Sparkles size={20} /><h3>Make it yours.</h3><p>Your next great product starts with an idea.</p><Link to="/seller/create-product">Create something new <ArrowRight size={15} /></Link></div>
          <div className="sd-account"><span className="sd-avatar">{initials}</span><div><strong>{sellerName}</strong><span>Seller account</span></div><Store size={17} /></div>
        </div>
      </aside>

      <div className="sd-workspace">
        <header className="sd-topbar"><div><Store size={16} /><span>Seller studio</span><span className="sd-topbar-slash">/</span><strong>My products</strong></div><span className="sd-topbar-date">{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span></header>
        <main className="sd-main" id="overview">
          <section className="sd-heading">
            <div><p className="sd-eyebrow"><span /> YOUR STORE, AT A GLANCE</p><h1>A little overview.<br />A lot of possibility<span>.</span></h1><p className="sd-heading-description">Everything you’ve created, all in one place.</p></div>
            <Link to="/seller/create-product" className="sd-button sd-button-dark"><Plus size={18} />Add product<ArrowUpRight size={17} /></Link>
          </section>

          <section className="sd-stats" aria-label="Product statistics">
            <article className="sd-stat"><div className="sd-stat-top"><span>Total products</span><Package size={19} /></div><strong>{ready ? sellerProducts.length.toString().padStart(2, '0') : '—'}</strong><p><span className="sd-stat-dot" />Products in your collection</p><span className="sd-stat-number">01</span></article>
            <article className="sd-stat"><div className="sd-stat-top"><span>With product photos</span><Image size={19} /></div><strong>{ready ? withImages.toString().padStart(2, '0') : '—'}</strong><p><Check size={13} />{ready && sellerProducts.length ? `${Math.round(withImages / sellerProducts.length * 100)}% of your collection` : 'Bring your products to life'}</p><span className="sd-stat-number">02</span></article>
            <article className="sd-stat sd-stat-accent"><div className="sd-stat-top"><span>Total listed value</span><ArrowUpRight size={19} /></div><div className={`sd-stat-values ${totals.length > 1 ? 'sd-stat-values-multiple' : ''}`}>{ready ? (totals.length ? totals.map(({ code, amount }) => <strong key={code}>{money({ price: { currency: code, amount } })}</strong>) : <strong>—</strong>) : <strong>—</strong>}</div><p>Sum of product prices</p><span className="sd-stat-number">03</span></article>
          </section>

          <section className="sd-collection" id="collection" aria-labelledby="collection-heading">
            <div className="sd-collection-heading"><div><span className="sd-eyebrow">CURATED BY YOU</span><h2 id="collection-heading">Your collection<span className="sd-count">{ready ? sellerProducts.length : '—'}</span></h2></div><button className="sd-refresh" onClick={refresh} disabled={status === 'loading'}><RefreshCw size={15} className={status === 'loading' ? 'sd-spinning' : ''} />Refresh</button></div>
            <div className="sd-toolbar">
              <div className="sd-search"><Search size={18} /><input aria-label="Search products" placeholder="Search your products…" value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} />{query && <button aria-label="Clear search" onClick={() => updateFilter(setQuery, '')}><X size={16} /></button>}</div>
              <div className="sd-select-wrap"><SlidersHorizontal size={15} /><select aria-label="Filter by currency" value={currency} onChange={(event) => updateFilter(setCurrency, event.target.value)}><option value="all">All currencies</option>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></div>
              <select className="sd-sort" aria-label="Sort products" value={sort} onChange={(event) => updateFilter(setSort, event.target.value)}><option value="newest">Newest first</option><option value="name">Name: A to Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
              <div className="sd-view-toggle" aria-label="Product view"><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={17} /></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={19} /></button></div>
            </div>
            {sort.startsWith('price') && currency === 'all' && currencies.length > 1 && <p className="sd-sort-note">Prices are sorted within each currency. Select a currency to compare products.</p>}
            <div className="sd-filter-row"><div className="sd-tabs" aria-label="Filter by photos">{[['all', 'All products', sellerProducts.length], ['photos', 'With photos', withImages], ['missing', 'Missing photos', sellerProducts.length - withImages]].map(([value, label, count]) => <button key={value} aria-pressed={filter === value} onClick={() => updateFilter(setFilter, value)}>{label}<span>{ready ? count : '—'}</span></button>)}</div><span className="sd-result-count" role="status">{ready ? `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}` : status === 'loading' ? 'Loading collection…' : 'Collection unavailable'}</span></div>

            {status === 'loading' ? <div className="sd-product-grid" aria-label="Loading products" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div className="sd-skeleton-card" key={index}><div /><span /><span /></div>)}</div> : status === 'error' ? (
              <div className="sd-empty" role="alert"><Package size={35} strokeWidth={1.2} /><h3>Your collection is taking a moment.</h3><p>{error}</p><div className="sd-empty-actions"><button className="sd-button sd-button-dark" onClick={refresh}><RefreshCw size={16} />Try again</button>{/sign in/.test(error) && <Link to="/login" className="sd-button sd-button-light">Sign in<ArrowRight size={16} /></Link>}</div></div>
            ) : !visibleProducts.length ? (
              <div className="sd-empty"><Package size={38} strokeWidth={1.2} /><span className="sd-eyebrow">ROOM FOR SOMETHING GREAT</span><h3>{sellerProducts.length ? 'No products found.' : 'Your collection starts here.'}</h3><p>{sellerProducts.length ? 'Try a different search or clear your filters.' : 'Add your first product and give your store its own point of view.'}</p>{sellerProducts.length ? <button className="sd-button sd-button-dark" onClick={resetFilters}>Clear filters<ArrowRight size={16} /></button> : <Link className="sd-button sd-button-dark" to="/seller/create-product"><Plus size={17} />Create your first product</Link>}</div>
            ) : <>
              <div className={view === 'grid' ? 'sd-product-grid' : 'sd-product-list'}>{visibleProducts.map((product) => {
                const images = photoUrls(product)
                return <button className="sd-product-card" key={product._id} onClick={() => setSelectedProduct(product)} aria-label={`View ${product.title}`}>
                  <div className="sd-product-image"><ProductPhoto key={images[0] || 'empty'} src={images[0]} title={product.title} /><span className="sd-image-badge">{images.length ? <><Image size={12} />{images.length} photo{images.length === 1 ? '' : 's'}</> : 'No photos'}</span><span className="sd-card-arrow"><ArrowUpRight size={19} /></span></div>
                  <div className="sd-product-info"><span className="sd-product-label">THE COLLECTION</span><h3>{product.title}</h3><p>{product.description || 'No description provided.'}</p><div className="sd-product-bottom"><strong>{money(product)}</strong><span>{product.price?.currency || 'INR'}</span></div></div>
                </button>
              })}</div>
              <div className="sd-pagination"><p>Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}</strong> of {filteredProducts.length} products</p><div><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></button><span>Page {currentPage} of {pageCount}</span><button aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></button></div></div>
            </>}
          </section>
          <footer className="sd-footer"><span>A good collection is always growing.</span><Link to="/seller/create-product">What’s next? <ArrowDownRight size={16} /></Link></footer>
        </main>
      </div>
      {selectedProduct && <ProductDetails key={selectedProduct._id} product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  )
}

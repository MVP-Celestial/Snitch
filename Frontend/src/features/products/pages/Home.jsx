import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { ArrowUpRight, ImageIcon, Package, RefreshCw, Search, Sun, Moon } from 'lucide-react'
import GarmentHero from '../components/hero/GarmentHero'
import { useProduct } from '../hooks/useProduct'
import { useNavigate } from 'react-router-dom'
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

export default function Home() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('celestial-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    try { localStorage.setItem('celestial-theme', theme) } catch { /* Storage can be unavailable. */ }
  }, [theme])
  const products = useSelector((state) => state.product.products) || []
  const user = useSelector((state) => state.auth.user)
  const { handleGetAllProducts } = useProduct()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [requestVersion, setRequestVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [currency, setCurrency] = useState('all')
  const [sort, setSort] = useState('latest')

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
    <div className="shop-home" data-theme={theme}>

      <header className="home-header">
        <Link to="/" className="home-brand" aria-label="Celestial Drips home"><img className="celestial-logo" src={`${import.meta.env.BASE_URL}images/celestial-drips.png`} alt="Celestial Drips" /></Link>
        <nav aria-label="Main navigation">
          <button type="button" className="home-theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <a href="#collection" className="home-nav-shop">Shop collection</a>
          {user?.role === 'buyer' && <Link to="/cart">Your bag</Link>}
          {user?.role === 'seller' ? <Link to="/seller/dashboard">Seller dashboard<ArrowUpRight size={15} aria-hidden="true" /></Link>
            : !user && <Link to="/login" className="home-sign-in">Sign in</Link>}
        </nav>
      </header>
      <main className="home-main">
        <GarmentHero lightMode={theme === 'light'} />
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
                <button type="button" className="home-card-button" aria-label={`View ${product.title}`} onClick={() => navigate(`/product/${product._id}`)}>
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
      <footer className="home-footer"><Link to="/" className="home-brand"><img className="celestial-logo" src={`${import.meta.env.BASE_URL}images/celestial-drips.png`} alt="Celestial Drips" /></Link><p>Find something that feels like you.</p><a href="#collection">Back to collection <ArrowUpRight size={14} aria-hidden="true" /></a></footer>
    </div>
  )
}


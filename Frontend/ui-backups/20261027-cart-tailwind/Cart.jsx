import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ImageIcon, LoaderCircle, Moon, Plus, RefreshCw, ShoppingBag, Sun } from 'lucide-react'
import { useCart } from '../hook/useCart'
import { cartLine, cartTotals, money } from '../utils/cart'
import '../../products/pages/Home.css'
import './Cart.css'

function ItemImage({ src, title }) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? <img src={src} alt={title} onError={() => setFailed(true)} />
    : <div className="bag-image-fallback"><ImageIcon size={28} strokeWidth={1} /><span>No image available</span></div>
}

export default function Cart() {
  const items = useSelector(state => state.cart.items) || []
  const { handleGetCart, handleIncrementCartItem } = useCart()
  const [status, setStatus] = useState('loading')
  const [request, setRequest] = useState(0)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null)
  const [notice, setNotice] = useState('')
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('celestial-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    try { localStorage.setItem('celestial-theme', theme) } catch { /* Optional storage. */ }
  }, [theme])
  useEffect(() => {
    const controller = new AbortController()
    handleGetCart(controller.signal).then(() => {
      if (!controller.signal.aborted) setStatus('ready')
    }).catch(error => {
      if (!controller.signal.aborted) { setError(error.response?.data?.message || 'We could not load your bag. Please try again.'); setStatus('error') }
    })
    return () => controller.abort()
  }, [handleGetCart, request])

  const lines = items.filter(Boolean).map(cartLine)
  const count = lines.reduce((total, line) => total + line.quantity, 0)
  const totals = cartTotals(lines)
  const retry = () => { setStatus('loading'); setError(''); setRequest(value => value + 1) }
  const increase = async (line, key) => {
    if (pending !== null) return
    setPending(key); setNotice(''); setError('')
    try { await handleIncrementCartItem(line.productId, line.variantId); setNotice(`${line.title} quantity updated.`) }
    catch (error) { setError(error.response?.data?.message || 'Could not update this item. Please try again.') }
    finally { setPending(null) }
  }
  return <div className="shop-home cart-page" data-theme={theme}>
    <header className="home-header">
      <Link to="/" className="home-brand" aria-label="Celestial Drips home"><img className="celestial-logo" src={`${import.meta.env.BASE_URL}images/celestial-drips.png`} alt="Celestial Drips" /></Link>
      <nav aria-label="Main navigation">
        <button className="home-theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <Link to="/#collection">Shop collection <ArrowUpRight size={15} /></Link>
      </nav>
    </header>
    <main className="bag-main">
      <Link to="/#collection" className="bag-back"><ArrowLeft size={15} /> Back to collection</Link>
      <div className="bag-heading"><div><p className="bag-eyebrow">A LITTLE CLOSER TO YOURS</p><h1>Your bag<span>{status === 'ready' ? String(count).padStart(2, '0') : '—'}</span></h1></div><p>Good finds. Great company.<br />Keep your favourites together.</p></div>
      {status === 'loading' && <div className="bag-loading" role="status" aria-label="Loading your bag"><div className="bag-skeleton" /><div className="bag-skeleton" /><p><LoaderCircle className="bag-spin" size={17} /> Gathering your favourites…</p></div>}
      {status === 'error' && <section className="bag-state" role="alert"><RefreshCw size={34} strokeWidth={1} /><h2>Your bag needs a moment.</h2><p>{error}</p><button type="button" className="bag-primary" onClick={retry}>Try again <RefreshCw size={16} /></button></section>}
      {status === 'ready' && !lines.length && <section className="bag-state"><div className="bag-empty-icon"><ShoppingBag size={40} strokeWidth={1} /></div><p className="bag-eyebrow">ROOM FOR SOMETHING GOOD</p><h2>Your next favourite is waiting.</h2><p>Your bag is empty for now. Explore the collection<br className="bag-desktop-break" /> and find something that feels like you.</p><Link className="bag-primary" to="/#collection">Explore the collection <ArrowUpRight size={17} /></Link></section>}
      {status === 'ready' && lines.length > 0 && <div className="bag-layout">
        <section className="bag-items" aria-label="Items in your bag" aria-busy={pending !== null}>
          <div className="bag-list-heading"><span>YOUR SELECTION</span><span>{count} {count === 1 ? 'piece' : 'pieces'}</span></div>
          {lines.map((line, index) => {
            const key = items[index]?._id || `${line.productId}-${line.variantId}-${index}`
            const atStock = line.variant?.stock != null && line.quantity >= line.variant.stock
            const canIncrease = line.product && line.variantId && !atStock
            return <article className="bag-item" key={key}>
              <div className="bag-item-image"><ItemImage key={line.image || key} src={line.image} title={line.title} /></div>
              <div className="bag-item-info"><p className="bag-eyebrow">CELESTIAL DRIPS</p><h2>{line.product ? <Link to={`/product/${line.productId}`}>{line.title}</Link> : line.title}</h2>
                <div className="bag-attributes">{Object.entries(line.attributes).map(([name, value]) => <span key={name}>{name}: {String(value)}</span>)}</div>
                <p className="bag-unit-price">{line.priced ? `${money(line.amount, line.currency)} each` : 'Price unavailable'}</p>
                <div className="bag-quantity"><span>Qty</span><output aria-label={`Quantity for ${line.title}`}>{line.quantity}</output><button type="button" aria-label={`Increase quantity of ${line.title}`} disabled={!canIncrease || pending !== null} onClick={() => increase(line, key)}>{pending === key ? <LoaderCircle size={15} className="bag-spin" /> : <Plus size={15} />}</button></div>
                {atStock && <p className="bag-item-note">Maximum available quantity</p>}
                {!line.variantId && line.product && <p className="bag-item-note">This item's variant is unavailable. Quantity cannot be changed.</p>}
              </div>
              <p className="bag-line-total">{line.priced && line.product ? money(line.amount * line.quantity, line.currency) : 'Unavailable'}</p>
            </article>
          })}
          {error && <p className="bag-error" role="alert">{error}</p>}<p className="bag-notice" role="status">{notice}</p>
          <Link className="bag-continue" to="/#collection"><ArrowLeft size={16} /> Find a little more</Link>
        </section>
        <aside className="bag-summary" aria-labelledby="bag-summary-title"><p className="bag-eyebrow">THE DETAILS</p><h2 id="bag-summary-title">Bag summary</h2>
          <div className="bag-summary-row"><span>Items</span><span>{count}</span></div>
          {Object.entries(totals).map(([currency, total]) => <div className="bag-summary-row" key={currency}><span>Subtotal {Object.keys(totals).length > 1 ? `(${currency})` : ''}</span><strong>{money(total, currency)}</strong></div>)}
          {lines.some(line => !line.priced || !line.product) && <p className="bag-item-note">Unavailable items are excluded from the subtotal.</p>}
          <div className="bag-summary-row bag-delivery"><span>Delivery & taxes</span><span>Not calculated</span></div>
          <div className="bag-summary-total"><span>Subtotal</span><div>{Object.entries(totals).map(([currency, total]) => <strong key={currency}>{money(total, currency)}</strong>)}</div></div>
          <button type="button" className="bag-primary" disabled aria-describedby="checkout-note">Checkout coming soon <ArrowUpRight size={17} /></button>
          <p id="checkout-note" className="bag-checkout-note">Checkout is not available yet. You can save your selection and add quantities to your bag.</p>
          <div className="bag-summary-foot"><ShoppingBag size={18} strokeWidth={1.3} /><span>A considered collection.<br />Picked by you.</span></div>
        </aside>
      </div>}
      {status === 'ready' && lines.length > 0 && <p className="bag-capability-note">Removing items and reducing quantities will be available in a future update.</p>}
    </main>
    <footer className="bag-footer"><span>CELESTIAL DRIPS</span><p>Find something that feels like you.</p><Link to="/#collection">Back to collection <ArrowUpRight size={14} /></Link></footer>
  </div>
}

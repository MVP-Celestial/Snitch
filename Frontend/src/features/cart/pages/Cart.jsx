import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ImageIcon, LoaderCircle, Moon, Plus, RefreshCw, ShoppingBag, Sun } from 'lucide-react'
import { useCart } from '../hook/useCart'
import { cartLine, cartTotals, money } from '../utils/cart'

function ItemImage({ src, title }) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? <img src={src} alt={title} onError={() => setFailed(true)} />
    : <div className="box-border flex h-full flex-col items-center justify-center gap-[10px] p-2 text-center text-[9px] text-[#766c60]"><ImageIcon size={28} strokeWidth={1} /><span>No image available</span></div>
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
  return <div className="min-h-screen bg-[var(--bag-bg)] text-[var(--bag-ink)] [--bag-bg:#f6f2eb] [--bag-panel:#eee8de] [--bag-ink:#29251f] [--bag-muted:#736b60] [--bag-line:#dcd4c8] [--bag-accent:#955b3d] data-[theme=dark]:[--bag-bg:#181612] data-[theme=dark]:[--bag-panel:#232019] data-[theme=dark]:[--bag-ink:#f3ecdf] data-[theme=dark]:[--bag-muted:#b1a693] data-[theme=dark]:[--bag-line:#3c352b] data-[theme=dark]:[--bag-accent:#d7a27b] [&_a]:no-underline [&_a]:text-inherit [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[var(--bag-accent)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[var(--bag-accent)]" data-theme={theme}>
    <header className="relative flex min-h-[108px] items-center justify-between border-b border-[var(--bag-line)] px-[6%] py-5 max-[720px]:min-h-[90px] max-[720px]:px-[5%] max-[720px]:py-[15px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-[25px] [&_nav]:text-xs max-[720px]:[&_nav]:gap-3 max-[720px]:[&_nav]:text-[10px] [&_nav>a]:inline-flex [&_nav>a]:items-center [&_nav>a]:gap-[9px]">
      <Link to="/" className="block shrink-0" aria-label="Celestial Drips home"><img className="block h-[66px] w-[126px] object-contain max-[720px]:h-14 max-[720px]:w-[105px]" src={`${import.meta.env.BASE_URL}images/celestial-drips.png`} alt="Celestial Drips" /></Link>
      <nav aria-label="Main navigation">
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--bag-line)] bg-transparent px-3 text-inherit hover:bg-[var(--bag-panel)] max-[720px]:px-[10px] max-[720px]:[&_span]:hidden" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <Link to="/#collection">Shop collection <ArrowUpRight size={15} /></Link>
      </nav>
    </header>
    <main className="mx-auto box-border min-h-[calc(100vh-210px)] max-w-[1320px] px-[6%] pt-[34px] pb-20 max-[720px]:px-[5%] max-[720px]:pt-[26px] max-[720px]:pb-[50px]">
      <Link to="/#collection" className="inline-flex items-center gap-[10px] text-xs text-[var(--bag-muted)]!"><ArrowLeft size={15} /> Back to collection</Link>
      <div className="flex items-end justify-between gap-5 pt-12 pb-9 max-[720px]:pt-9 max-[720px]:pb-7 [&_h1]:m-0 [&_h1]:text-[clamp(46px,5vw,70px)] [&_h1]:leading-[1.1] [&_h1]:font-normal [&_h1]:tracking-[-3px] [&_h1_span]:mt-[9px] [&_h1_span]:ml-4 [&_h1_span]:inline-block [&_h1_span]:align-top [&_h1_span]:text-[15px] [&_h1_span]:tracking-normal [&_h1_span]:text-[var(--bag-accent)] [&>p]:mb-[3px] [&>p]:text-xs [&>p]:leading-[1.8] [&>p]:text-[var(--bag-muted)] max-[720px]:[&>p]:hidden"><div><p data-eyebrow className="mb-3 text-[9px] leading-[1.6] tracking-[2px] text-[var(--bag-muted)]">A LITTLE CLOSER TO YOURS</p><h1>Your bag<span>{status === 'ready' ? String(count).padStart(2, '0') : '—'}</span></h1></div><p>Good finds. Great company.<br />Keep your favourites together.</p></div>
      {status === 'loading' && <div className="border-t border-[var(--bag-line)] py-[26px] [&>p]:flex [&>p]:items-center [&>p]:gap-[10px] [&>p]:text-xs [&>p]:text-[var(--bag-muted)]" role="status" aria-label="Loading your bag"><div className="mb-5 h-[170px] max-w-[700px] animate-pulse rounded bg-[var(--bag-panel)] motion-reduce:animate-none" /><div className="mb-5 h-[170px] max-w-[700px] animate-pulse rounded bg-[var(--bag-panel)] motion-reduce:animate-none" /><p><LoaderCircle className="animate-spin motion-reduce:animate-none" size={17} /> Gathering your favourites…</p></div>}
      {status === 'error' && <section className="border-y border-[var(--bag-line)] px-5 pt-[70px] pb-20 text-center max-[720px]:px-3 max-[720px]:py-[55px] [&>svg]:mx-auto [&>svg]:text-[var(--bag-accent)] [&_h2]:my-3 [&_h2]:text-[clamp(26px,3vw,36px)] [&_h2]:font-normal [&_h2]:tracking-[-1px] [&>p:not([data-eyebrow])]:mb-[26px] [&>p:not([data-eyebrow])]:text-[13px] [&>p:not([data-eyebrow])]:leading-[1.9] [&>p:not([data-eyebrow])]:text-[var(--bag-muted)]" role="alert"><RefreshCw size={34} strokeWidth={1} /><h2>Your bag needs a moment.</h2><p>{error}</p><button type="button" className="inline-flex min-h-12 box-border items-center justify-center gap-[25px] rounded-full border-0 bg-[var(--bag-ink)] px-[22px] py-[17px] text-xs text-[var(--bag-bg)]! disabled:cursor-not-allowed disabled:opacity-50" onClick={retry}>Try again <RefreshCw size={16} /></button></section>}
      {status === 'ready' && !lines.length && <section className="border-y border-[var(--bag-line)] px-5 pt-[70px] pb-20 text-center max-[720px]:px-3 max-[720px]:py-[55px] [&>svg]:mx-auto [&>svg]:text-[var(--bag-accent)] [&_h2]:my-3 [&_h2]:text-[clamp(26px,3vw,36px)] [&_h2]:font-normal [&_h2]:tracking-[-1px] [&>p:not([data-eyebrow])]:mb-[26px] [&>p:not([data-eyebrow])]:text-[13px] [&>p:not([data-eyebrow])]:leading-[1.9] [&>p:not([data-eyebrow])]:text-[var(--bag-muted)]"><div className="mx-auto mb-7 grid size-[88px] place-items-center rounded-full border border-[var(--bag-line)] text-[var(--bag-accent)]"><ShoppingBag size={40} strokeWidth={1} /></div><p data-eyebrow className="mb-3 text-[9px] leading-[1.6] tracking-[2px] text-[var(--bag-muted)]">ROOM FOR SOMETHING GOOD</p><h2>Your next favourite is waiting.</h2><p>Your bag is empty for now. Explore the collection<br className="max-[720px]:hidden" /> and find something that feels like you.</p><Link className="inline-flex min-h-12 box-border items-center justify-center gap-[25px] rounded-full border-0 bg-[var(--bag-ink)] px-[22px] py-[17px] text-xs text-[var(--bag-bg)]! disabled:cursor-not-allowed disabled:opacity-50" to="/#collection">Explore the collection <ArrowUpRight size={17} /></Link></section>}
      {status === 'ready' && lines.length > 0 && <div className="grid grid-cols-[minmax(0,1fr)_325px] items-start gap-[54px] max-[1000px]:grid-cols-[minmax(0,1fr)_290px] max-[1000px]:gap-7 max-[720px]:grid-cols-1 max-[720px]:gap-[35px]">
        <section className="min-w-0" aria-label="Items in your bag" aria-busy={pending !== null}>
          <div className="flex justify-between border-y border-[var(--bag-line)] py-[17px] text-[10px] tracking-[1px] text-[var(--bag-muted)]"><span>YOUR SELECTION</span><span>{count} {count === 1 ? 'piece' : 'pieces'}</span></div>
          {lines.map((line, index) => {
            const key = items[index]?._id || `${line.productId}-${line.variantId}-${index}`
            const atStock = line.variant?.stock != null && line.quantity >= line.variant.stock
            const canIncrease = line.product && line.variantId && !atStock
            return <article data-testid="cart-item" className="grid grid-cols-[126px_minmax(0,1fr)_auto] gap-[23px] border-b border-[var(--bag-line)] py-[26px] max-[1000px]:grid-cols-[100px_minmax(0,1fr)] max-[1000px]:gap-[18px]" key={key}>
              <div className="aspect-[4/5] overflow-hidden rounded-[3px] bg-[#e5dfd4] [&_img]:h-full [&_img]:w-full [&_img]:object-contain"><ItemImage key={line.image || key} src={line.image} title={line.title} /></div>
              <div className="min-w-0 py-[5px] [&_h2]:mb-[10px] [&_h2]:text-[19px] [&_h2]:font-medium [&_h2]:tracking-[-.5px] [&_h2]:[overflow-wrap:anywhere] [&_h2_a:hover]:text-[var(--bag-accent)] max-[720px]:[&_h2]:text-lg"><p data-eyebrow className="mb-[9px] text-[8px] leading-[1.6] tracking-[1.5px] text-[var(--bag-muted)]">CELESTIAL DRIPS</p><h2>{line.product ? <Link to={`/product/${line.productId}`}>{line.title}</Link> : line.title}</h2>
                <div className="flex flex-wrap gap-x-[15px] gap-y-[5px] text-[11px] text-[var(--bag-muted)] capitalize">{Object.entries(line.attributes).map(([name, value]) => <span key={name}>{name}: {String(value)}</span>)}</div>
                <p className="mt-[10px] mb-4 text-[11px] text-[var(--bag-muted)]">{line.priced ? `${money(line.amount, line.currency)} each` : 'Price unavailable'}</p>
                <div className="inline-flex h-[34px] items-center gap-[14px] text-[11px] [&>span]:text-[var(--bag-muted)] [&_output]:min-w-[15px] [&_output]:text-center [&_button]:grid [&_button]:size-[34px] [&_button]:place-items-center [&_button]:rounded-full [&_button]:border [&_button]:border-[var(--bag-line)] [&_button]:bg-transparent [&_button]:text-[var(--bag-ink)] [&_button]:transition-colors [&_button:enabled:hover]:bg-[var(--bag-panel)] [&_button:disabled]:opacity-35"><span>Qty</span><output aria-label={`Quantity for ${line.title}`}>{line.quantity}</output><button type="button" aria-label={`Increase quantity of ${line.title}`} disabled={!canIncrease || pending !== null} onClick={() => increase(line, key)}>{pending === key ? <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" /> : <Plus size={15} />}</button></div>
                {atStock && <p className="text-[10px] leading-[1.7] text-[var(--bag-muted)]">Maximum available quantity</p>}
                {!line.variantId && line.product && <p className="text-[10px] leading-[1.7] text-[var(--bag-muted)]">This item's variant is unavailable. Quantity cannot be changed.</p>}
              </div>
              <p className="mt-[29px] text-right text-sm font-medium whitespace-nowrap max-[1000px]:col-start-2 max-[1000px]:m-0 max-[1000px]:text-left">{line.priced && line.product ? money(line.amount * line.quantity, line.currency) : 'Unavailable'}</p>
            </article>
          })}
          {error && <p className="my-3 rounded-[3px] border border-[var(--bag-line)] p-[14px] text-xs text-[var(--bag-accent)]" role="alert">{error}</p>}<p className="my-3 text-xs text-[var(--bag-accent)] empty:hidden" role="status">{notice}</p>
          <Link className="mt-[22px] inline-flex items-center gap-[10px] text-xs" to="/#collection"><ArrowLeft size={16} /> Find a little more</Link>
        </section>
        <aside data-testid="cart-summary" className="sticky top-[25px] rounded border border-[var(--bag-line)] bg-[var(--bag-panel)] p-[29px] max-[1000px]:p-[23px] max-[720px]:static [&_h2]:mb-[30px] [&_h2]:text-[25px] [&_h2]:font-normal [&_h2]:tracking-[-.9px]" aria-labelledby="bag-summary-title"><p data-eyebrow className="mb-3 text-[9px] leading-[1.6] tracking-[2px] text-[var(--bag-muted)]">THE DETAILS</p><h2 id="bag-summary-title">Bag summary</h2>
          <div className="my-[18px] flex justify-between gap-[14px] text-xs [&>span:first-child]:text-[var(--bag-muted)] [&_strong]:font-medium"><span>Items</span><span>{count}</span></div>
          {Object.entries(totals).map(([currency, total]) => <div className="my-[18px] flex justify-between gap-[14px] text-xs [&>span:first-child]:text-[var(--bag-muted)] [&_strong]:font-medium" key={currency}><span>Subtotal {Object.keys(totals).length > 1 ? `(${currency})` : ''}</span><strong>{money(total, currency)}</strong></div>)}
          {lines.some(line => !line.priced || !line.product) && <p className="text-[10px] leading-[1.7] text-[var(--bag-muted)]">Unavailable items are excluded from the subtotal.</p>}
          <div className="my-[18px] flex justify-between gap-[14px] border-b border-[var(--bag-line)] pb-[22px] text-[11px] [&>span:first-child]:text-[var(--bag-muted)]"><span>Delivery & taxes</span><span>Not calculated</span></div>
          <div data-testid="cart-total" className="flex justify-between gap-[14px] pt-[7px] pb-[27px] text-sm [&_strong]:mb-1 [&_strong]:block [&_strong]:text-right [&_strong]:font-medium"><span>Subtotal</span><div>{Object.entries(totals).map(([currency, total]) => <strong key={currency}>{money(total, currency)}</strong>)}</div></div>
          <button type="button" className="inline-flex min-h-12 box-border items-center justify-center gap-3 rounded-full border-0 bg-[var(--bag-ink)] w-full px-3 py-[17px] text-xs text-[var(--bag-bg)]! disabled:cursor-not-allowed disabled:opacity-50" disabled aria-describedby="checkout-note">Checkout coming soon <ArrowUpRight size={17} /></button>
          <p id="checkout-note" className="mt-[10px] text-[10px] leading-[1.7] text-[var(--bag-muted)]">Checkout is not available yet. You can save your selection and add quantities to your bag.</p>
          <div className="mt-[26px] flex items-center gap-3 border-t border-[var(--bag-line)] pt-[23px] text-[10px] leading-[1.7] text-[var(--bag-muted)]"><ShoppingBag size={18} strokeWidth={1.3} /><span>A considered collection.<br />Picked by you.</span></div>
        </aside>
      </div>}
      {status === 'ready' && lines.length > 0 && <p className="mt-9 text-[11px] leading-[1.7] text-[var(--bag-muted)]">Removing items and reducing quantities will be available in a future update.</p>}
    </main>
    <footer className="flex items-center justify-between gap-5 border-t border-[var(--bag-line)] px-[6%] py-7 text-[10px] text-[var(--bag-muted)] [&>span]:tracking-[2px] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 max-[720px]:flex-wrap max-[720px]:px-[5%] max-[720px]:[&_p]:hidden"><span>CELESTIAL DRIPS</span><p>Find something that feels like you.</p><Link to="/#collection">Back to collection <ArrowUpRight size={14} /></Link></footer>
  </div>
}

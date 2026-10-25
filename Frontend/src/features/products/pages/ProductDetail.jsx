import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ImageIcon, Moon, RefreshCw, Sun } from 'lucide-react'
import { useProduct } from '../hooks/useProduct'
import './Home.css'
import { useCart } from '../../cart/hook/useCart.js'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: price?.currency || 'INR',
  maximumFractionDigits: 2,
}).format(price?.amount ?? 0)

function ProductImage({ src, title }) {
  const [failed, setFailed] = useState(false)

  return src && !failed
    ? <img className="h-full w-full object-contain" src={src} alt={title} onError={() => setFailed(true)} />
    : <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[11px] text-[#8e9282]"><ImageIcon size={34} strokeWidth={1} aria-hidden="true" /><span>Image unavailable</span></div>
}

function ProductGallery({ images, title }) {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div>
      <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[5px] bg-[#eeede6] max-[700px]:aspect-square max-[700px]:max-h-[65vh]">
        <ProductImage key={images[selectedImage]} src={images[selectedImage]} title={title} />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-[9px]" aria-label="Product images">
          {images.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={selectedImage === index}
              onClick={() => setSelectedImage(index)}
              className={`h-[78px] w-[66px] cursor-pointer rounded-[3px] border-2 bg-[#eeede6] p-[2px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b4d2e] ${selectedImage === index ? 'border-[#a65333]' : 'border-transparent'}`}
            >
              <img className="h-full w-full object-cover" src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { productId } = useParams()
  const { handleGetProductById } = useProduct()
  const { handleAddItem } = useCart()
  const [result, setResult] = useState(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('celestial-theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('celestial-theme', theme)
    } catch {
      // Storage can be unavailable.
    }
  }, [theme])

  useEffect(() => {
    let active = true

    handleGetProductById(productId)
      .then((data) => {
        if (!active) return
        setResult({
          productId,
          requestVersion,
          product: data || null,
          status: data ? 'ready' : 'error',
        })
      })
      .catch(() => {
        if (active) setResult({ productId, requestVersion, product: null, status: 'error' })
      })

    return () => {
      active = false
    }
  }, [handleGetProductById, productId, requestVersion])

  const status = result?.productId === productId && result?.requestVersion === requestVersion
    ? result.status
    : 'loading'
  const product = status === 'ready' ? result.product : null
  const images = (product?.images || []).map((image) => image?.url).filter(Boolean)
  const variantId = product?.variants?.[0]?._id

  const handleAddToCart = async () => {
    if (!variantId || isAddingToCart) return

    setIsAddingToCart(true)
    setCartMessage('')
    try {
      await handleAddItem({ productId, variantId })
      setCartMessage('Added to cart.')
    } catch (error) {
      setCartMessage(error.response?.data?.message || 'Could not add this product to your cart.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="shop-home min-h-screen" data-theme={theme}>
      <header className="home-header">
        <Link to="/" className="home-brand" aria-label="Celestial Drips home">
          <img className="celestial-logo" src={`${import.meta.env.BASE_URL}images/celestial-drips.png`} alt="Celestial Drips" />
        </Link>
        <nav aria-label="Main navigation">
          <button
            type="button"
            className="home-theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <Link to="/#collection">Shop collection</Link>
        </nav>
      </header>

      <main className="mx-auto min-h-[calc(100vh-190px)] max-w-[1440px] px-[6%] pb-[72px] pt-7 max-[700px]:min-h-[calc(100vh-160px)] max-[700px]:px-[5%] max-[700px]:pb-[50px] max-[700px]:pt-[22px]">
        <Link to="/#collection" className="mb-[30px] inline-flex items-center gap-[9px] text-xs text-[#757967] no-underline hover:text-[#a45030] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b4d2e] max-[700px]:mb-[22px]"><ArrowLeft size={16} aria-hidden="true" /> Back to collection</Link>

        {status === 'loading' && <div className="px-5 py-[90px] text-center text-[#757967]" role="status">Loading product…</div>}
        {status === 'error' && (
          <div className="px-5 py-[90px] text-center text-[#757967]" role="alert">
            <h1 className="mb-[10px] text-[23px] font-medium text-[#292e25]">We couldn't find this product.</h1>
            <p className="text-xs">It may have been removed, or there was a problem loading it.</p>
            <button type="button" className="mt-3 inline-flex items-center gap-2 rounded bg-[#2d3429] px-5 py-3 text-xs text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b4d2e]" onClick={() => setRequestVersion((version) => version + 1)}><RefreshCw size={15} aria-hidden="true" /> Try again</button>
          </div>
        )}
        {status === 'ready' && product && (
          <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)] items-start gap-[clamp(32px,7vw,96px)] max-[700px]:grid-cols-1 max-[700px]:gap-6" aria-labelledby="product-detail-title">
            <ProductGallery key={productId} images={images} title={product.title} />
            <div className="pt-[18px] max-[700px]:pt-1">
              <p className="home-eyebrow">CELESTIAL DRIPS · THE COLLECTION</p>
              <h1 id="product-detail-title" className="m-0 text-[clamp(30px,4vw,46px)] font-medium leading-[1.12] tracking-[-1.5px] [overflow-wrap:anywhere] max-[700px]:text-[32px]">{product.title}</h1>
              <p className="my-5 mb-[26px] text-2xl font-medium">{formatPrice(product.price)} <span className="ml-[5px] text-[11px] font-normal text-[#7c8173]">{product.price?.currency || 'INR'}</span></p>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!variantId || isAddingToCart}
                className="rounded bg-[#2d3429] px-5 py-3 text-xs text-white hover:bg-[#414a3b] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b4d2e]"
              >
                {isAddingToCart ? 'Adding…' : variantId ? 'Add to cart' : 'Unavailable'}
              </button>
              {cartMessage && <p className="mt-2 text-xs text-[#757967]" role="status">{cartMessage}</p>}
              <div className="mb-6 h-px bg-[#dedfd4]" />
              <h2 className="mb-[10px] text-[13px] font-semibold">Product description</h2>
              <p className="m-0 whitespace-pre-wrap text-[13px] leading-[1.9] text-[#757967] [overflow-wrap:anywhere]">{product.description || 'No description is available for this product.'}</p>
              <p className="mt-8 rounded border border-[#dedfd4] p-4 text-[11px] leading-[1.7] text-[#757967] max-[700px]:mt-6">A considered find, ready to make its way into your collection.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="home-footer">
        <Link to="/" className="home-brand"><img className="celestial-logo" src={`${import.meta.env.BASE_URL}images/celestial-drips.png`} alt="Celestial Drips" /></Link>
        <p>Find something that feels like you.</p>
        <Link to="/#collection">Back to collection <ArrowLeft size={14} aria-hidden="true" /></Link>
      </footer>
    </div>
  )
}

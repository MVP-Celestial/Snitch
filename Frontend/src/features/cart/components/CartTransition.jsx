import { useEffect, useRef, useState } from 'react'

const ease = 'cubic-bezier(0.76, 0, 0.24, 1)'

// One transition host stays mounted across routes; the panel covers the route swap.
export default function CartTransition({ router, children }) {
  const page = useRef(null)
  const panel = useRef(null)
  const brand = useRef(null)
  const busy = useRef(false)
  const [active, setActive] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    let mounted = true
    const animations = new Set()
    let unlock = () => {}
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve))
    const animate = (element, keyframes, options) => {
      const animation = element.animate(keyframes, { fill: 'both', easing: ease, ...options })
      animations.add(animation)
      return animation.finished
    }
    const clear = () => {
      animations.forEach(animation => animation.cancel())
      animations.clear()
      if (page.current) page.current.inert = false
      unlock()
    }
    const openBag = async event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname !== '/cart' || window.location.pathname === '/cart') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.current?.animate) return
      event.preventDefault()
      if (busy.current) return
      busy.current = true
      const oldFocus = document.activeElement
      setTheme(link.closest('[data-theme]')?.dataset.theme || 'light')
      setActive(true)
      const html = document.documentElement
      const body = document.body
      const htmlLocked = html.classList.contains('overflow-hidden')
      const bodyLocked = body.classList.contains('overflow-hidden')
      html.classList.add('overflow-hidden')
      body.classList.add('overflow-hidden')
      unlock = () => {
        if (!htmlLocked) html.classList.remove('overflow-hidden')
        if (!bodyLocked) body.classList.remove('overflow-hidden')
      }
      page.current.inert = true
      try {
        await frame()
        if (!mounted) return
        const letters = [...brand.current.querySelectorAll('[data-brand-letter]')]
        const label = letters.map((letter, index) => animate(letter,
          [{ transform: 'translateY(115%) rotate(5deg)', opacity: 0 }, { transform: 'translateY(0) rotate(0deg)', opacity: 1 }],
          { duration: 520, delay: 330 + index * 22 }))
        const cover = animate(panel.current,
          [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
          { duration: 680 })
        const leave = animate(page.current,
          [{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(-65px) scale(.97)', opacity: .75 }],
          { duration: 680 })
        await Promise.all([cover, leave, ...label])
        await animate(brand.current, [{ opacity: 1 }, { opacity: 1 }], { duration: 220 })
        if (!mounted) return
        // Navigation occurs only after the old page is fully covered.
        await router.navigate(url.pathname + url.search + url.hash)
        await frame()
        await frame()
        if (!mounted) return
        window.scrollTo({ top: 0, behavior: 'instant' })
        await Promise.all([
          animate(panel.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 700, delay: 100 }),
          animate(page.current, [{ transform: 'translateY(55px) scale(.97)', opacity: .75 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 800 }),
          animate(brand.current, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-35px)', opacity: 0 }], { duration: 300, delay: 70 }),
        ])
      } catch {
        // Cancellation (including unmount) must never leave navigation or scrolling blocked.
      } finally {
        clear()
        busy.current = false
        if (mounted) {
          setActive(false)
          const heading = page.current?.querySelector('main h1, h1')
          if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) }
          else if (document.contains(oldFocus)) oldFocus?.focus({ preventScroll: true })
        }
      }
    }
    document.addEventListener('click', openBag, true)
    return () => {
      mounted = false
      document.removeEventListener('click', openBag, true)
      clear()
      busy.current = false
    }
  }, [router])

  return <>
    <div ref={page} data-testid="cart-transition-page" className="min-h-screen origin-top will-change-auto" aria-busy={active}>{children}</div>
    <div ref={panel} data-testid="cart-transition-panel" data-theme={theme} hidden={!active}
      role="status" aria-label="Opening your bag" aria-live="polite"
      className="fixed inset-0 z-[1000] transform-[translateY(100%)] overflow-hidden bg-[#a9603e] text-[#fff5e5] data-[theme=dark]:bg-[#82482f] motion-reduce:hidden">
      <div className="flex h-full w-full items-center justify-center px-6">
        <div ref={brand} aria-hidden="true" className="text-center font-serif text-[clamp(38px,7vw,86px)] leading-[.94] font-semibold tracking-[-.055em] select-none">
          {['Celestial', 'Drips'].map(word => <div key={word} className="overflow-hidden py-[.09em]">
            {[...word].map((letter, index) => <span key={`${word}-${index}`} data-brand-letter className="inline-block transform-[translateY(115%)]">{letter}</span>)}
          </div>)}
        </div>
      </div>
    </div>
  </>
}



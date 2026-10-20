import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, RotateCcw, X } from 'lucide-react'
import { clampIndex, dragPosition, releaseIndex } from './rackMotion'
import './GarmentHero.css'

const RackCanvas = lazy(() => import('./RackCanvas'))
const variants = ['Chalk', 'Olive', 'Slate', 'Charcoal', 'Sand', 'Forest', 'Clay']
const swatches = ['#d7d2c4', '#7b8860', '#637c8a', '#41464b', '#b69b76', '#356b50', '#b5755c']
const query = '(prefers-reduced-motion: reduce)'
const subscribe = (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }
class ViewerBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function GarmentHero() {
  const stage = useRef(null), gesture = useRef(null)
  const input = useRef({
    slide: { value: 3, velocity: 0 }, target: 3, dragging: false,
    turn: { value: 0, velocity: 0 }, turnTarget: 0, spinning: false,
    pull: 0, drop: { value: 0, velocity: 0 }, suppressClickUntil: 0,
  })
  const wake = useRef(() => {})
  const [selected, setSelected] = useState(3), [opened, setOpened] = useState(false)
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false)
  const [nearby, setNearby] = useState(false), [active, setActive] = useState(true), [dragging, setDragging] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true)
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => { setReady(false); setFailed(true) }, [])
  useEffect(() => {
    let inView = true
    const update = () => setActive(inView && !document.hidden)
    const observer = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) setNearby(true); update() }, { rootMargin: '80px' })
    observer.observe(stage.current)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])
  const choose = useCallback((i) => {
    const index = clampIndex(i)
    input.current.target = index
    input.current.turnTarget = 0
    setSelected(index)
    wake.current()
  }, [])
  const close = useCallback(() => {
    setOpened(false)
    input.current.turnTarget = 0
    input.current.pull = 0
    wake.current()
  }, [])
  useEffect(() => { const escape = (e) => { if (e.key === 'Escape') close() }; window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape) }, [close])
  const down = (e) => {
    if (!ready || !e.isPrimary || e.button !== 0) return
    gesture.current = {
      id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX,
      time: performance.now(), velocity: 0, selected, opened,
      start: input.current.slide.value, spin: input.current.turn.value,
    }
  }
  const move = (e) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x, dy = e.clientY - g.y
    if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return
    if (!g.started) {
      if (!g.opened && e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { gesture.current = null; return }
      g.vertical = g.opened && Math.abs(dy) > Math.abs(dx)
      g.started = true
      setDragging(true)
    }
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId)
    const now = performance.now()
    const step = e.clientX - g.lastX
    const elapsed = Math.max(8, now - g.time)
    g.velocity = step / elapsed
    const travel = Math.min(stage.current.clientWidth * .32, 280)
    if (g.opened) {
      if (g.vertical) input.current.pull = Math.min(.32, Math.max(0, dy / stage.current.clientHeight * 1.78))
      else {
        input.current.spinning = true
        input.current.turn.value = g.spin + dx * .014
        input.current.turn.velocity = Math.max(-14, Math.min(14, g.velocity * 14))
      }
    }
    else {
      input.current.dragging = true
      input.current.slide.value = dragPosition(g.selected, dx / travel) + (g.start - g.selected) * Math.exp(-Math.abs(dx) / 35)
      input.current.slide.velocity = -g.velocity * 1000 / travel
    }
    g.lastX = e.clientX; g.time = now; wake.current()
  }
  const end = (e, cancelled = false) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    gesture.current = null
    const control = input.current
    if (g.started) {
      control.suppressClickUntil = performance.now() + 350
      const velocity = performance.now() - g.time < 100 ? g.velocity : 0
      if (!g.opened) {
        choose(cancelled ? g.selected : releaseIndex(g.selected, g.selected - control.slide.value, velocity))
        control.slide.velocity = cancelled || !velocity ? 0 : Math.max(-5, Math.min(5, control.slide.velocity))
      } else if (g.vertical) {
        if (!cancelled && control.pull > .15) close()
      } else {
        const projected = control.turn.value + (cancelled ? 0 : control.turn.velocity * .16)
        control.turnTarget = Math.round(projected / Math.PI) * Math.PI
      }
    }
    control.dragging = false; control.spinning = false; control.pull = 0
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    wake.current()
  }
  return <section className="home-hero rack-hero" aria-labelledby="home-title">
    <div className="rack-heading"><p className="rack-eyebrow">THE EVERYDAY, RECONSIDERED</p><h1 id="home-title">Find your next favourite.</h1></div>
    <div ref={stage} className={`rack-stage ${ready ? 'is-ready' : ''} ${dragging ? 'is-dragging' : ''} ${opened ? 'is-open' : ''}`}
      role="group" aria-label="Interactive clothing rack" tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); choose(selected + (e.key === 'ArrowRight' ? 1 : -1)) }
        if (e.key === 'Enter' && ready) setOpened(true)
      }}
      onPointerDown={down} onPointerMove={move} onPointerUp={(e) => end(e)} onPointerCancel={(e) => end(e, true)} onLostPointerCapture={(e) => end(e, true)}>
      <img className="rack-poster" src={`${import.meta.env.BASE_URL}images/hero-rack-preview.png`} width="1600" height="900" alt="Seven T-shirts hanging from a single chrome clothing rail" fetchPriority="high" />
      {nearby && !failed && <ViewerBoundary onFailure={onFailure}><Suspense fallback={null}><RackCanvas selected={selected} opened={opened} reducedMotion={reducedMotion} active={active} input={input} wake={wake} onReady={onReady} onFailure={onFailure} onChoose={(i) => { if (i === selected) setOpened(true); else choose(i) }} /></Suspense></ViewerBoundary>}
    </div>
    <div className="rack-selection">
      <div className="rack-picker" role="group" aria-label="Browse garment colors">
        <button type="button" className="rack-arrow" aria-label="Previous garment" disabled={selected === 0} onClick={() => choose(selected - 1)}><ArrowLeft size={18} /></button>
        <div className="rack-caption" aria-live="polite" aria-atomic="true"><p>The everyday tee <span>— {variants[selected]}</span></p><span className="rack-count">0{selected + 1} / 07</span></div>
        <button type="button" className="rack-arrow" aria-label="Next garment" disabled={selected === 6} onClick={() => choose(selected + 1)}><ArrowRight size={18} /></button>
      </div>
      <div className="rack-swatches" role="group" aria-label="Choose a color">{variants.map((name, i) => <button type="button" key={name} style={{ '--swatch': swatches[i] }} aria-label={name} aria-pressed={selected === i} onClick={() => choose(i)} />)}</div>
      <p className="rack-hint" role="status">{failed ? 'Preview mode · Browse the collection below' : !ready ? 'Preparing the rack…' : opened ? 'Drag to turn · Pull down or press Escape to return' : 'Swipe through the rack · Tap a tee to lift it'}</p>
      <div className="rack-actions">{opened ? <><button type="button" className="rack-text-button" onClick={close}><X size={14} /> Back to rack</button><button type="button" className="rack-text-button" onClick={() => { input.current.turnTarget = Math.round(input.current.turn.value / (Math.PI * 2)) * Math.PI * 2; wake.current() }}><RotateCcw size={14} /> Reset view</button></> : <button type="button" className="rack-text-button" disabled={!ready} onClick={() => setOpened(true)}>Take a closer look <ArrowUpRight size={14} /></button>}</div>
    </div>
    <div className="studio-bottom"><span className="rack-edition">ESSENTIALS / 01</span><a href="#collection" className="home-shop-link">Shop the collection <ArrowUpRight size={17} aria-hidden="true" /></a><a className="studio-scroll" href="#collection">SCROLL TO DISCOVER <ArrowDown size={17} aria-hidden="true" /></a></div>
  </section>
}

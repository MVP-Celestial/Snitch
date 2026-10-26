import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { GARMENTS, GARMENT_COUNT, INITIAL_GARMENT, clampIndex, dragPosition, releaseIndex } from './rackMotion'
import './GarmentHero.css'

const RackCanvas = lazy(() => import('./RackCanvas'))
const variants = GARMENTS.map((garment) => garment.name)
const query = '(prefers-reduced-motion: reduce)'
const subscribe = (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }
class ViewerBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function GarmentHero({ lightMode = false }) {
  const stage = useRef(null), gesture = useRef(null)
  const input = useRef({
    slide: { value: INITIAL_GARMENT, velocity: 0 }, target: INITIAL_GARMENT, dragging: false,
    turn: { value: 0, velocity: 0 }, turnTarget: 0, spinning: false,
    pull: 0, drop: { value: 0, velocity: 0 }, suppressClickUntil: 0,
  })
  const wake = useRef(() => {})
  const [selected, setSelected] = useState(INITIAL_GARMENT), [opened, setOpened] = useState(false)
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
    requestAnimationFrame(() => stage.current?.focus({ preventScroll: true }))
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
  return <section className={`home-hero rack-hero ${opened ? 'is-preview' : ''}`} aria-labelledby={opened ? 'rack-preview-title' : 'home-title'}>
    <div className="room" aria-hidden="true">
      <img className="room-img room-dark" src={`${import.meta.env.BASE_URL}images/hero-room-dark.webp`} width="2400" height="1200" alt="" decoding="async" fetchPriority={lightMode ? 'low' : 'high'} />
      <img className="room-img room-light" src={`${import.meta.env.BASE_URL}images/hero-room-light.webp`} width="2400" height="1200" alt="" decoding="async" fetchPriority={lightMode ? 'high' : 'low'} />
      <div className="room-bulbs"><i /><i /><i /><i /><i /></div>
    </div>
    <div className="rack-heading" aria-hidden={opened}><h1 id="home-title">Find your next favourite.</h1></div>
    <div ref={stage} className={`rack-stage ${ready ? 'is-ready' : ''} ${dragging ? 'is-dragging' : ''} ${opened ? 'is-open' : ''}`}
      role="group" aria-label={opened ? 'Shirt preview. Drag to rotate. Press Escape to return.' : 'Clothing rack. Swipe or use arrow keys to browse. Click a shirt or press Enter to preview.'} tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); choose(selected + (e.key === 'ArrowRight' ? 1 : -1)) }
        if (e.key === 'Enter' && ready) setOpened(true)
      }}
      onPointerDown={down} onPointerMove={move} onPointerUp={(e) => end(e)} onPointerCancel={(e) => end(e, true)} onLostPointerCapture={(e) => end(e, true)}>
      <img className="rack-poster" src={`${import.meta.env.BASE_URL}images/hero-rack-preview.png`} width="1600" height="900" alt="T-shirts hanging from a single chrome clothing rail" fetchPriority="high" />
      {nearby && !failed && <ViewerBoundary onFailure={onFailure}><Suspense fallback={null}><RackCanvas lightMode={lightMode} selected={selected} opened={opened} reducedMotion={reducedMotion} active={active} input={input} wake={wake} onReady={onReady} onFailure={onFailure} onChoose={(i) => { choose(i); setOpened(true) }} /></Suspense></ViewerBoundary>}
    </div>
    <div className="rack-selection">
      <div className="rack-picker" role="group" aria-label="Browse garment colors">
        <button type="button" className="rack-arrow" aria-label="Previous garment" disabled={selected === 0} onClick={() => choose(selected - 1)}><ArrowLeft size={18} /></button>
        <button type="button" className="rack-arrow" aria-label="Next garment" disabled={selected === GARMENT_COUNT - 1} onClick={() => choose(selected + 1)}><ArrowRight size={18} /></button>
      </div>
    </div>
    <p className="rack-status" role="status">{failed ? '3D preview unavailable. Browse the collection below.' : !ready ? 'Preparing the rack.' : `The everyday tee, ${variants[selected]}. ${opened ? 'Preview open.' : 'Press Enter on the rack to preview.'}`}</p>
    <div className="rack-preview-info" aria-hidden={!opened} aria-live="polite">
      <h2 id="rack-preview-title" key={selected}>The everyday tee</h2>
      <p>{variants[selected]}</p>
    </div>
    {opened && <button type="button" className="rack-preview-close" onClick={close} aria-label="Close shirt preview"><X size={16} /> Close</button>}
  </section>
}

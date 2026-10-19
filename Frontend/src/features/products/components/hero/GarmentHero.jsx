import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { garments, REVOLVE_INTERVAL } from './garment'
import './GarmentHero.css'

const GarmentCanvas = lazy(() => import('./GarmentCanvas'))
const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotion = (callback) => {
  const media = window.matchMedia(motionQuery)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
class ViewerBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() {
    return this.state.failed ? <p className="garment-status" role="status">3D unavailable. Showing the concept preview.</p> : this.props.children
  }
}

export default function GarmentHero() {
  const stage = useRef(null)
  const [nearby, setNearby] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [focused, setFocused] = useState(false)
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => setReady(false), [])
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true)
  // Only enter 3D mode when every carousel slot has its own configured GLB.
  const hasModels = garments.every((item) => Boolean(item.modelUrl))
  const active = visible && pageVisible
  const moving = active && !paused && !reducedMotion && !interacting && !focused

  useEffect(() => {
    const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNearby(true) }, { rootMargin: '200px' })
    const activity = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    preload.observe(stage.current)
    activity.observe(stage.current)
    const onVisibility = () => setPageVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    const endInteraction = () => setInteracting(false)
    window.addEventListener('pointerup', endInteraction)
    window.addEventListener('pointercancel', endInteraction)
    return () => {
      preload.disconnect(); activity.disconnect(); document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointerup', endInteraction)
      window.removeEventListener('pointercancel', endInteraction)
    }
  }, [])
  useEffect(() => {
    if (!moving || garments.length < 2) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % garments.length), REVOLVE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [moving, index])

  return (
    <section className="home-hero" aria-labelledby="home-title" aria-roledescription="carousel"
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
      <button type="button" className="studio-motion-toggle" aria-pressed={paused} disabled={reducedMotion} onClick={() => setPaused((value) => !value)}>{paused ? 'Resume hero animation' : 'Pause hero animation'}</button>
      <h1 id="home-title" className="studio-title"><span>Find your next</span><span>favourite.</span></h1>
      <div ref={stage} className={`garment-stage ${ready ? 'is-ready' : ''} ${moving ? 'is-moving' : ''}`}
        onPointerDown={() => setInteracting(true)} onPointerUp={() => setInteracting(false)} onPointerCancel={() => setInteracting(false)} onLostPointerCapture={() => setInteracting(false)}>
        <div className="garment-ground" aria-hidden="true" />
        <div className="garment-posters" role="img" aria-label="Oversized olive T-shirt concept preview">
          {garments.map((item, itemIndex) => {
            const slot = (itemIndex - index + garments.length) % garments.length
            return <div key={item.id} className={`garment-preview slot-${slot}`}><img src={item.posterUrl} width="1254" height="1254" alt="" fetchPriority={itemIndex === 0 ? 'high' : 'auto'} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} /></div>
          })}
        </div>
        {hasModels && nearby && <ViewerBoundary onFailure={onFailure}><Suspense fallback={<p className="garment-status" role="status">Preparing the 3D studio...</p>}>
          <GarmentCanvas garments={garments} selected={index} active={active} moving={moving} reducedMotion={reducedMotion} resetKey={0} onReady={onReady} />
        </Suspense></ViewerBoundary>}
      </div>
      <div className="studio-bottom">
        <div className="studio-intro"><a href="#collection" className="home-shop-link">Shop the collection <ArrowUpRight size={17} aria-hidden="true" /></a></div>
        <a className="studio-scroll" href="#collection">SCROLL TO DISCOVER <ArrowDown size={17} aria-hidden="true" /></a>
      </div>
    </section>
  )
}

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import { Box3, MathUtils, Vector3 } from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

function Garment({ url, moving, reducedMotion, selected, itemIndex, count, resetKey, onReady }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => clone(scene), [scene])
  const scale = useMemo(() => {
    const size = new Box3().setFromObject(model).getSize(new Vector3())
    return 2.8 / Math.max(size.x, size.y, size.z, 0.001)
  }, [model])
  const group = useRef(null)
  const orbit = useRef(null)
  const { gl, invalidate } = useThree()
  const target = useRef({ x: 0, y: 0, drag: 0, pointer: null, lastX: 0 })
  const phase = useRef(0)
  const entrance = useRef(0)
  const orbitAngle = useRef(itemIndex * Math.PI * 2 / count)
  const isSelected = selected === itemIndex

  useEffect(() => { onReady() }, [onReady])
  useEffect(() => { invalidate() }, [selected, moving, invalidate])
  useEffect(() => {
    if (!isSelected) return
    const element = gl.domElement
    const input = target.current
    const down = (event) => {
      if (!event.isPrimary || event.button !== 0) return
      input.pointer = event.pointerId
      input.lastX = event.clientX
      element.setPointerCapture(event.pointerId)
    }
    const move = (event) => {
      const bounds = element.getBoundingClientRect()
      if (input.pointer === event.pointerId) {
        input.drag += (event.clientX - input.lastX) * 0.009
        input.lastX = event.clientX
      } else if (event.pointerType === 'mouse' && !reducedMotion) {
        input.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.22
        input.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.12
      }
      invalidate()
    }
    const up = (event) => {
      input.pointer = null
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    }
    const leave = () => { input.x = 0; input.y = 0; invalidate() }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    element.addEventListener('pointerleave', leave)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
      element.removeEventListener('pointerleave', leave)
    }
  }, [gl, invalidate, reducedMotion, isSelected])

  useEffect(() => { target.current.drag = 0; target.current.x = 0; target.current.y = 0; phase.current = 0; invalidate() }, [selected, resetKey, invalidate])
  useFrame((_, delta) => {
    if (!group.current) return
    const dt = Math.min(delta, 0.05)
    if (moving) phase.current += dt * Math.PI * 2 / 9
    entrance.current = reducedMotion ? 1 : Math.min(1, entrance.current + dt / 1.1)
    const enter = 1 - (1 - entrance.current) ** 3
    const desiredAngle = (itemIndex - selected) * Math.PI * 2 / count
    const difference = MathUtils.euclideanModulo(desiredAngle - orbitAngle.current + Math.PI, Math.PI * 2) - Math.PI
    orbitAngle.current = reducedMotion ? desiredAngle : orbitAngle.current + difference * (1 - Math.exp(-5 * dt))
    const angle = orbitAngle.current
    orbit.current.position.set(Math.sin(angle) * 3.2, -0.8 * (1 - enter), (Math.cos(angle) - 1) * 2.1)
    orbit.current.scale.setScalar((0.65 + enter * 0.35) * (0.78 + 0.22 * Math.max(0, Math.cos(angle))))
    const input = target.current
    const yaw = phase.current + input.drag + input.x - 0.18 + (1 - enter) * -1.3
    const pitch = -input.y
    group.current.rotation.y = reducedMotion ? yaw : MathUtils.damp(group.current.rotation.y, yaw, 9, dt)
    group.current.rotation.x = reducedMotion ? pitch : MathUtils.damp(group.current.rotation.x, pitch, 9, dt)
    group.current.position.y = moving ? Math.sin(phase.current * 0.8) * 0.045 : 0
    if (!reducedMotion && (entrance.current < 1 || Math.abs(difference) > 0.001 || Math.abs(group.current.rotation.y - yaw) > 0.001 || Math.abs(group.current.rotation.x - pitch) > 0.001)) invalidate()
  })
  return <group ref={orbit}><group ref={group}><Center><primitive object={model} scale={scale} /></Center></group></group>
}

function ContextGuard() {
  const { gl } = useThree()
  const [lost, setLost] = useState(false)
  useEffect(() => {
    const onLost = (event) => { event.preventDefault(); setLost(true) }
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', onLost)
    return () => canvas.removeEventListener('webglcontextlost', onLost)
  }, [gl])
  if (lost) throw new Error('Garment WebGL context lost')
  return null
}

export default function GarmentCanvas({ active, moving, garments, ...props }) {
  return <div className="garment-canvas" aria-hidden="true">
    <Canvas camera={{ position: [0, 0, 6.8], fov: 38 }} dpr={[1, 1.5]} frameloop={!active ? 'never' : moving ? 'always' : 'demand'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={<p className="garment-status">Your browser cannot display 3D. Showing the studio preview.</p>}>
      <ContextGuard />
      <ambientLight intensity={1.4} />
      <hemisphereLight args={['#fff5e3', '#62654e', 1.8]} />
      <directionalLight position={[3, 4, 5]} intensity={3} color="#fff1dc" />
      <directionalLight position={[-3, 2, -3]} intensity={2} color="#fff8ed" />
      <Suspense fallback={null}>{garments.map((item, itemIndex) => <Garment key={item.id} {...props} url={item.modelUrl} itemIndex={itemIndex} count={garments.length} moving={moving} />)}</Suspense>
    </Canvas>
  </div>
}

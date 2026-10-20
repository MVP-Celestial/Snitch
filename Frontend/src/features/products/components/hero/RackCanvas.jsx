import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MathUtils, PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GARMENT_COUNT, smooth, spring, stackPose } from './rackMotion'

const modelUrl = `${import.meta.env.BASE_URL}models/hero-rack.glb`
const TAU = Math.PI * 2

function StudioEnvironment() {
  const { gl, scene, invalidate } = useThree()
  useEffect(() => {
    const generator = new PMREMGenerator(gl), room = new RoomEnvironment()
    const environment = generator.fromScene(room, .04)
    scene.environment = environment.texture
    scene.environmentIntensity = .45
    invalidate()
    return () => { scene.environment = null; environment.dispose(); room.dispose(); generator.dispose() }
  }, [gl, scene, invalidate])
  return null
}

function Rack({ selected, opened, reducedMotion, active, input, wake, onReady, onChoose }) {
  const { scene: source } = useGLTF(modelUrl)
  const { size, camera, invalidate } = useThree()
  const refs = useRef([])
  const motion = useRef(Array.from({ length: GARMENT_COUNT }, () => ({
    reveal: { value: 0, velocity: 0 },
    swing: { value: 0, velocity: 0 },
    cloth: { value: 0, velocity: 0 },
    previousX: 0,
    initialized: false,
  })))
  const models = useMemo(() => {
    const rail = source.getObjectByName('Rail_Top').clone()
    rail.material = rail.material.clone()
    const garments = Array.from({ length: GARMENT_COUNT }, (_, i) => {
      const garment = source.getObjectByName(`Garment_${String(i + 1).padStart(2, '0')}`).clone(true)
      garment.position.set(0, 0, 0)
      garment.rotation.set(0, Math.PI / 2, 0)
      const flex = { value: 0 }
      garment.traverse((child) => {
        if (!child.isMesh) return
        child.material = child.material.clone()
        if (child.name.startsWith('Shirt')) {
          // Keep the shoulders on the hanger while the hem trails its motion.
          child.material.onBeforeCompile = (shader) => {
            shader.uniforms.rackFlex = flex
            shader.vertexShader = `uniform float rackFlex;\n${shader.vertexShader}`.replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>
              float hem = smoothstep(0.20, 1.18, -position.y);
              transformed.z += rackFlex * hem * hem;
              transformed.x += sin(position.y * 7.0) * rackFlex * hem * 0.18;`,
            )
          }
          child.material.customProgramCacheKey = () => 'rack-cloth-lag-v1'
        }
      })
      return { garment, flex }
    })
    return { rail, garments }
  }, [source])

  useEffect(() => {
    camera.zoom = size.height / 1.78
    camera.position.set(0, -.53, 6)
    camera.rotation.set(0, 0, 0)
    camera.updateProjectionMatrix()
    wake.current = invalidate
    invalidate()
    onReady()
    return () => { wake.current = () => {} }
  }, [camera, size.width, size.height, invalidate, onReady, wake])
  useEffect(() => { if (active) invalidate() }, [selected, opened, reducedMotion, active, invalidate])

  useFrame((_, delta) => {
    const dt = Math.min(delta, .04)
    const control = input.current
    const worldWidth = size.width / Math.max(1, size.height) * 1.78
    let settling = false
    const advance = (state, target, stiffness, damping) => {
      if (reducedMotion) { state.value = target; state.velocity = 0 }
      else if (spring(state, target, dt, stiffness, damping)) settling = true
    }
    if (!control.dragging) advance(control.slide, control.target, 210, 25)
    if (!control.spinning) advance(control.turn, control.turnTarget, 65, 12)
    advance(control.drop, control.pull, 170, 23)
    motion.current.forEach((m, i) => advance(m.reveal, opened && i === selected ? 1 : 0, 90, 19))
    const reveal = Math.max(...motion.current.map((m) => m.reveal.value))
    models.garments.forEach(({ garment, flex }, i) => {
      const group = refs.current[i]
      if (!group) return
      const m = motion.current[i]
      const p = MathUtils.clamp(m.reveal.value, 0, 1)
      const distance = i - control.slide.value
      const pose = stackPose(distance)
      const away = smooth(.1, .8, reveal) * (1 - p)
      const side = Math.sign(distance || i - selected)
      const x = pose.x * (1 - p) + side * away * (worldWidth * .55 + .5)
      const speed = m.initialized ? (x - m.previousX) / Math.max(dt, .001) : 0
      m.previousX = x
      m.initialized = true
      advance(m.swing, MathUtils.clamp(-speed * .10, -.19, .19), 110, 11)
      advance(m.cloth, m.swing.value * .7 + MathUtils.clamp(control.turn.velocity * .006 * p, -.06, .06), 75, 10)
      flex.value = m.cloth.value
      const lift = smooth(0, .28, p)
      const forward = smooth(.2, 1, p)
      group.position.set(x, .22 * lift - control.drop.value * p, pose.z * (1 - p) + forward * .8)
      group.rotation.set(
        -.07 * Math.sin(p * Math.PI),
        pose.turn * (1 - p) + (reducedMotion ? 0 : TAU * smooth(.12, 1, p)) + control.turn.value * p,
        m.swing.value + Math.sin(p * Math.PI) * .045,
      )
      group.scale.setScalar(1 + forward * .24)
      garment.visible = away < .999 || Math.abs(x) < worldWidth / 2 + .6
    })
    // Overscan a full viewport at either end so the original rail caps never appear.
    models.rail.scale.x = Math.max(4, worldWidth * 3 / 5.3)
    models.rail.scale.y = models.rail.scale.z = .55
    if (settling && active) invalidate()
  })

  return <group dispose={null}>
    <primitive object={models.rail} />
    {models.garments.map(({ garment }, i) => <group key={garment.name}
      ref={(node) => { refs.current[i] = node }}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta < 7 && performance.now() > input.current.suppressClickUntil) onChoose(i)
      }}><primitive object={garment} /></group>)}
  </group>
}

function ContextGuard() {
  const { gl } = useThree(), [lost, setLost] = useState(false)
  useEffect(() => {
    const lose = (e) => { e.preventDefault(); setLost(true) }
    gl.domElement.addEventListener('webglcontextlost', lose)
    return () => gl.domElement.removeEventListener('webglcontextlost', lose)
  }, [gl])
  if (lost) throw new Error('Rack WebGL context lost')
  return null
}

export default function RackCanvas(props) {
  return <div className="rack-canvas" aria-hidden="true">
    <Canvas orthographic camera={{ position: [0, -.53, 6], zoom: 220, near: .1, far: 30 }}
      dpr={[1, 1.75]} frameloop={props.active ? 'demand' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      fallback={<span>Your browser cannot display the 3D rack.</span>}>
      <ContextGuard />
      <ambientLight intensity={.2} />
      <hemisphereLight args={['#fff5e8', '#303238', .55]} />
      <directionalLight position={[-3, 4, 5]} intensity={1.6} color="#fff6e9" />
      <directionalLight position={[3, 1, 3]} intensity={.5} color="#dce5f1" />
      <Suspense fallback={null}><StudioEnvironment /><Rack {...props} /></Suspense>
    </Canvas>
  </div>
}

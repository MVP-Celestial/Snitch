import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { HalfFloatType, MathUtils, MeshPhysicalMaterial, PMREMGenerator, Vector4, WebGLRenderTarget } from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { GARMENTS, GARMENT_COUNT, smooth, spring, stackPose } from './rackMotion'

const modelUrl = `${import.meta.env.BASE_URL}models/hero-rack.glb`
const TAU = Math.PI * 2

function StudioEnvironment({ lightMode }) {
  const { gl, scene, invalidate } = useThree()
  useEffect(() => {
    const generator = new PMREMGenerator(gl), room = new RoomEnvironment()
    const environment = generator.fromScene(room, .04)
    scene.environment = environment.texture
    scene.environmentIntensity = lightMode ? .38 : .24
    invalidate()
    return () => { scene.environment = null; environment.dispose(); room.dispose(); generator.dispose() }
  }, [gl, scene, invalidate, lightMode])
  return null
}

function RackFocus({ input, reducedMotion, lightMode }) {
  const { gl, scene, camera, size, invalidate } = useThree()
  const effect = useRef(null)
  useEffect(() => {
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 2 })
    const composer = new EffectComposer(gl, target)
    const render = new RenderPass(scene, camera)
    const bokeh = new BokehPass(scene, camera, { focus: 6, aperture: .035, maxblur: .018 })
    bokeh.materialBokeh.defines.PERSPECTIVE_CAMERA = 0
    bokeh.materialBokeh.fragmentShader = bokeh.materialBokeh.fragmentShader.replace(
      'vec2 dofblur =',
      `if (abs(factor) < 0.28 || viewZ < -farClip * 0.99) {
        gl_FragColor = texture2D(tColor, vUv);
        return;
      }
      factor = sign(factor) * max(abs(factor) - 0.28, 0.0);
      vec2 dofblur =`,
    )
    const output = new OutputPass()
    composer.addPass(render)
    composer.addPass(bokeh)
    composer.addPass(output)
    effect.current = { composer, bokeh }
    invalidate()
    return () => {
      effect.current = null
      render.dispose(); bokeh.dispose(); output.dispose(); composer.dispose()
    }
  }, [gl, scene, camera, invalidate])
  useEffect(() => {
    effect.current?.composer.setSize(size.width, size.height)
    invalidate()
  }, [size.width, size.height, invalidate])
  useFrame(() => {
    const amount = input.current.focus || 0
    const previousMask = camera.layers.mask
    if (!effect.current || reducedMotion || lightMode || amount < .001) {
      camera.layers.enableAll()
      gl.setRenderTarget(null)
      gl.render(scene, camera)
      camera.layers.mask = previousMask
      return
    }
    // Composite the selected garment after defocusing the rack, so its silhouette
    // and fabric remain sharp throughout the turn, including edge-on poses.
    camera.layers.set(0)
    effect.current.bokeh.uniforms.focus.value = 6 - smooth(.1, 1, amount) * 1.35
    effect.current.bokeh.uniforms.aperture.value = .035 * smooth(.05, .7, amount)
    effect.current.composer.render()
    const autoClear = gl.autoClear
    gl.autoClear = false
    gl.clearDepth()
    camera.layers.set(1)
    gl.render(scene, camera)
    gl.autoClear = autoClear
    camera.layers.mask = previousMask
  }, 1)
  return null
}

function Rack({ lightMode, selected, opened, reducedMotion, active, input, wake, onReady, onChoose }) {
  const { scene: source } = useGLTF(modelUrl)
  const { size, camera, gl, invalidate } = useThree()
  const refs = useRef([])
  const led = useRef(null)
  const floor = useRef(null)
  const floorUniforms = useMemo(() => ({
    opacity: { value: 1 },
    lightMode: { value: 0 },
    shadows: { value: Array.from({ length: GARMENT_COUNT }, () => new Vector4()) },
  }), [])
  const railLights = useRef([])
  const motion = useRef(Array.from({ length: GARMENT_COUNT }, () => ({
    reveal: { value: 0, velocity: 0 },
    swing: { value: 0, velocity: 0 },
    cloth: { value: 0, velocity: 0 },
    pitch: { value: 0, velocity: 0 },
    previousX: 0,
    initialized: false,
  })))
  const models = useMemo(() => {
    const rail = source.getObjectByName('Rail_Top').clone()
    rail.material = rail.material.clone()
    rail.material.transparent = true
    const railViewport = { value: 1 }
    const ledUniforms = { viewportWidth: railViewport, opacity: { value: 1 } }
    rail.material.onBeforeCompile = (shader) => {
      shader.uniforms.rackViewportWidth = railViewport
      shader.fragmentShader = `uniform float rackViewportWidth;\n${shader.fragmentShader}`.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        float railScreenX = gl_FragCoord.x / rackViewportWidth;
        float railEdge = min(railScreenX, 1.0 - railScreenX);
        gl_FragColor.a *= smoothstep(0.015, 0.24, railEdge);`,
      )
    }
    rail.material.customProgramCacheKey = () => 'rack-screen-edge-fade-v1'
    const smoothedGeometry = new Map()
    const garments = GARMENTS.map((variant, i) => {
      const garment = source.getObjectByName(`Garment_${String(variant.source + 1).padStart(2, '0')}`).clone(true)
      garment.name = `RackGarment_${i}`
      garment.position.set(0, 0, 0)
      garment.rotation.set(0, Math.PI / 2, 0)
      const flex = { value: 0 }
      garment.traverse((child) => {
        if (!child.isMesh) return
        child.material = child.material.clone()
        child.material.transparent = true
        if (child.name.startsWith('Shirt')) {
          if (!smoothedGeometry.has(child.geometry)) {
            const geometry = child.geometry.clone()
            geometry.deleteAttribute('normal')
            const welded = mergeVertices(geometry, .00001)
            welded.computeVertexNormals()
            geometry.dispose()
            smoothedGeometry.set(child.geometry, welded)
          }
          child.geometry = smoothedGeometry.get(child.geometry)
          const base = child.material
          child.material = new MeshPhysicalMaterial({
            color: base.color, side: base.side, transparent: true,
            roughness: .84, metalness: 0, sheen: .32,
            sheenColor: '#c9bca9', sheenRoughness: .85,
          })
          base.dispose()
          child.castShadow = true
          child.receiveShadow = true
          if (variant.color) child.material.color.set(variant.color)
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
    return { rail, garments, railViewport, ledUniforms }
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
  useEffect(() => { if (active) invalidate() }, [selected, opened, reducedMotion, active, lightMode, invalidate])

  useFrame((_, delta) => {
    const dt = Math.min(delta, .04)
    const control = input.current
    let settling = false
    const advance = (state, target, stiffness, damping) => {
      if (reducedMotion) { state.value = target; state.velocity = 0 }
      else if (spring(state, target, dt, stiffness, damping)) settling = true
    }
    if (!control.dragging) advance(control.slide, control.target, 150, 24)
    if (!control.spinning) advance(control.turn, control.turnTarget, 65, 12)
    advance(control.drop, control.pull, 170, 23)
    motion.current.forEach((m, i) => advance(m.reveal, opened && i === selected ? 1 : 0, 52, 14))
    const reveal = Math.max(...motion.current.map((m) => m.reveal.value))
    control.focus = reveal
    const framing = smooth(.12, 1, reveal)
    const previewHeight = Math.max(2.2, size.height / Math.max(1, size.width) * 1.9)
    const rackHeight = size.width < 700 ? 1.92 : 1.83
    const viewHeight = rackHeight + framing * (previewHeight - rackHeight)
    camera.zoom = size.height / viewHeight
    camera.position.y = -.70 + framing * .27
    camera.updateProjectionMatrix()
    const worldWidth = size.width / Math.max(1, size.height) * viewHeight
    models.garments.forEach(({ garment, flex }, i) => {
      const group = refs.current[i]
      if (!group) return
      const m = motion.current[i]
      const p = MathUtils.clamp(m.reveal.value, 0, 1)
      const distance = i - control.slide.value
      const pose = stackPose(distance)
      const away = smooth(.1, .8, reveal) * (1 - p)
      const side = Math.sign(distance || i - selected)
      const edge = side * (worldWidth / 2 + .03 + .17 * Math.max(0, Math.abs(distance) - 1))
      const x = MathUtils.lerp(pose.x, edge, away) * (1 - p)
      const speed = m.initialized ? (x - m.previousX) / Math.max(dt, .001) : 0
      m.previousX = x
      m.initialized = true
      advance(m.swing, MathUtils.clamp(-speed * .10, -.19, .19), 90, 15)
      advance(m.pitch, MathUtils.clamp(-m.reveal.velocity * .075 + control.drop.velocity * .06, -.15, .15), 70, 10)
      advance(m.cloth, m.swing.value * .7 + m.pitch.value * .35 + MathUtils.clamp(control.turn.velocity * .009 * p, -.09, .09), 60, 13)
      flex.value = m.cloth.value
      const lift = smooth(0, .28, p)
      const forward = smooth(.2, 1, p)
      group.position.set(x, .18 * lift + .35 * forward - control.drop.value * p, pose.z * (1 - p) + forward * 1.35)
      group.rotation.set(
        m.pitch.value,
        pose.turn * (1 - p) + (reducedMotion ? 0 : TAU * smooth(.12, 1, p)) + control.turn.value * p,
        m.swing.value + Math.sin(p * Math.PI) * .045,
      )
      group.scale.setScalar(1 + forward * .65)
      // Project each moving hem onto the floor; side-on garments cast narrower shadows.
      if (floor.current) {
        floor.current.material.uniforms.shadows.value[i].set(
          x + m.swing.value * 1.05,
          .12 + .22 * Math.abs(Math.cos(pose.turn)),
          pose.z * .12,
          (1 - away) * (1 - p),
        )
      }
      garment.traverse((child) => {
        if (!child.isMesh) return
        child.layers.set(p > .001 ? 1 : 0)
        child.material.opacity = 1 - smooth(.08, .8, reveal) * (1 - p)
      })
      garment.visible = away < .999 || Math.abs(x) < worldWidth / 2 + .6
    })
    // Overscan a full viewport at either end so the original rail caps never appear.
    models.rail.scale.x = Math.max(4, worldWidth * 3 / 5.3)
    models.rail.scale.y = models.rail.scale.z = .55
    models.railViewport.value = size.width * gl.getPixelRatio()
    models.rail.material.opacity = 1 - smooth(.05, .7, reveal)
    const lightOpacity = models.rail.material.opacity * (lightMode ? 0 : 1)
    if (floor.current) floor.current.material.uniforms.lightMode.value = lightMode ? 1 : 0
    if (floor.current) floor.current.material.uniforms.opacity.value = 1 - smooth(.02, .65, reveal)
    models.ledUniforms.opacity.value = lightOpacity
    if (led.current) {
      led.current.material.uniforms.viewportWidth.value = size.width * gl.getPixelRatio()
      led.current.material.uniforms.opacity.value = lightOpacity
      led.current.position.copy(models.rail.position)
      led.current.position.y -= .014
      led.current.position.z += .025
      led.current.scale.x = worldWidth * 1.1
    }
    railLights.current.forEach((light) => { if (light) light.intensity = .22 * lightOpacity })
    if (settling && active) invalidate()
  })

  return <group dispose={null}>
    {/* A softly lit floor with animated, feathered garment shadows in one draw call. */}
    <mesh ref={floor} position={[0, -1.33, -.4]} raycast={() => null}>
      <planeGeometry args={[8, .60]} />
      <shaderMaterial transparent depthWrite={false} toneMapped={false} uniforms={floorUniforms}
        vertexShader={`varying vec2 floorPoint;
          void main() {
            floorPoint = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`}
        fragmentShader={`uniform float opacity;
          uniform float lightMode;
          uniform vec4 shadows[${GARMENT_COUNT}];
          varying vec2 floorPoint;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
                       mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
          }
          void main() {
            vec2 p = floorPoint;
            // Low-key floor exposure with a restrained rear highlight and directional shadows.
            float rear = exp(-pow(abs(p.x) / 1.55, 2.0) - pow((p.y - .025) / .075, 2.0));
            float hotspot = exp(-pow((p.x + .08) / .85, 2.0) - pow((p.y - .012) / .065, 2.0));
            float bounce = exp(-pow(p.x / 1.90, 2.0) - pow((p.y + .115) / .135, 2.0));
            float shade = 0.0;
            for (int i = 0; i < ${GARMENT_COUNT}; i++) {
              vec4 s = shadows[i];
              float depth = s.z - p.y;
              float spread = max(0.0, depth);
              // Shadows stretch toward the viewer and splay away from the overhead light.
              float axis = s.x + spread * (s.x * 1.6 - .45);
              float width = max(.025, s.y * (.52 + spread * 1.6));
              float dx = (p.x - axis) / width;
              float hem = .002 * sin(dx * 6.0 + float(i) * 2.1)
                        + .001 * sin(dx * 12.0 + float(i));
              float contact = exp(-pow(abs(dx), 4.0) * 1.8
                                  - pow((p.y - s.z - hem) / .026, 2.0));
              float projectedShadow = (1.0 - smoothstep(.45, 1.45, abs(dx)))
                         * smoothstep(-.02, .025, depth)
                         * exp(-spread * 7.0);
              float soft = exp(-dx * dx * .75 - pow((depth - .025) / .075, 2.0));
              float occlusion = min(.96, contact * .48 + projectedShadow * .60 + soft * .16) * s.w;
              shade = 1.0 - (1.0 - shade) * (1.0 - occlusion);
            }
            float stone = noise(p * vec2(12., 110.)) * .55 + noise(p * vec2(38., 240.)) * .45;
            float grain = hash(gl_FragCoord.xy);
            vec3 illumination = vec3(.29, .235, .18) * rear
                              + vec3(.14, .112, .084) * hotspot
                              + vec3(.085, .074, .062) * bounce;
            illumination *= (1.0 - min(.98, shade)) * (.88 + stone * .18);
            illumination += (grain - .5) * .004 * bounce;
            float edge = 1.0 - smoothstep(.19, .30, abs(p.y));
            if (lightMode > .5) {
              gl_FragColor = vec4(vec3(.36, .29, .23), (shade * .27 + bounce * .045) * edge * opacity);
            } else {
              gl_FragColor = vec4(max(illumination, vec3(0.0)), edge * opacity);
            }
          }`} />
    </mesh>
    <primitive object={models.rail} />
    {/* A luminous diffuser plus a soft optical halo, without a full-screen bloom pass. */}
    <mesh ref={led} raycast={() => null}>
      <planeGeometry args={[1, .24]} />
      <shaderMaterial transparent depthWrite={false} toneMapped={false}
        uniforms={models.ledUniforms}
        vertexShader={`varying vec2 ledUv;
          void main() {
            ledUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`}
        fragmentShader={`uniform float viewportWidth;
          uniform float opacity;
          varying vec2 ledUv;
          void main() {
            float y = abs(ledUv.y - 0.5);
            float core = 1.0 - smoothstep(0.005, 0.017, y);
            float halo = exp(-y * 18.0) * 0.35;
            float screenX = gl_FragCoord.x / viewportWidth;
            float edge = smoothstep(0.015, 0.24, min(screenX, 1.0 - screenX));
            vec3 tint = mix(vec3(0.78, 0.38, 0.12), vec3(1.0, 0.89, 0.68), core);
            gl_FragColor = vec4(tint, max(core, halo) * edge * opacity);
          }`} />
    </mesh>
    {[-1.1, 0, 1.1].map((x, i) => <pointLight key={x}
      ref={(light) => { railLights.current[i] = light }}
      position={[x, models.rail.position.y - .08, .3]}
      color="#ffd6a0" intensity={.22} distance={2.4} decay={2} />)}
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
    <Canvas shadows orthographic camera={{ position: [0, -.53, 6], zoom: 220, near: .1, far: 30 }}
      dpr={[1, 1.75]} frameloop={props.active ? 'demand' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      fallback={<span>Your browser cannot display the 3D rack.</span>}>
      <ContextGuard />
      <RackFocus input={props.input} reducedMotion={props.reducedMotion} lightMode={props.lightMode} />
      <ambientLight layers-mask={3} intensity={props.lightMode ? .15 : .035} />
      <hemisphereLight layers-mask={3} args={['#fff5e8', '#b8a58d', props.lightMode ? .4 : .20]} />
      <directionalLight layers-mask={3} position={[-2, 3, 1.5]} intensity={props.lightMode ? 3 : 2.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-.0003} shadow-normalBias={.025} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={2} shadow-camera-bottom={-3} shadow-camera-near={.1} shadow-camera-far={12} shadow-radius={3} color="#fff6e9" />
      <directionalLight layers-mask={3} position={[3, 1, 2]} intensity={props.lightMode ? .8 : .35} color="#dce5f1" />
      <directionalLight layers-mask={3} position={[1, 2, -2]} intensity={props.lightMode ? .8 : 2.1} color="#ffe2b8" />
      <Suspense fallback={null}><StudioEnvironment lightMode={props.lightMode} /><Rack {...props} /></Suspense>
    </Canvas>
  </div>
}

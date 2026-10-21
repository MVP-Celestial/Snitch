import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { smooth } from './rackMotion'

// A real, slightly raked studio floor: the same world surface receives the
// plant/garment shadow maps and the reflected scene, including moving shirts.
export default function StudioFloor({ input }) {
  const { gl, scene, camera, size, invalidate } = useThree()
  const floor = useRef(null), floorLight = useRef(null)
  const resources = useMemo(() => {
    const reflection = new THREE.WebGLRenderTarget(768, 384, { type: THREE.HalfFloatType })
    const scratch = reflection.clone()
    const blurred = reflection.clone()
    const mirrorCamera = new THREE.OrthographicCamera()
    const normal = new THREE.Vector3(0, Math.cos(.18), Math.sin(.18))
    const point = new THREE.Vector3(0, -1.34, 0)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point)
    const matrix = new THREE.Matrix4()
    const uniforms = { floorReflection: { value: blurred.texture }, floorMatrix: { value: matrix }, floorOpacity: { value: 1 }, plantEdge: { value: 2 } }
    const data = new Uint8Array(128 * 128 * 4)
    let seed = 93
    for (let i = 0; i < data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const value = 115 + (seed >>> 26)
      data[i] = data[i + 1] = data[i + 2] = value
      data[i + 3] = 255
    }
    const grain = new THREE.DataTexture(data, 128, 128, THREE.RGBAFormat)
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.repeat.set(26, 20)
    grain.magFilter = grain.minFilter = THREE.LinearFilter
    grain.needsUpdate = true
    const material = new THREE.MeshStandardMaterial({
      color: '#171512', roughness: .74, metalness: .08, transparent: true,
      bumpMap: grain, bumpScale: .002, depthWrite: false,
    })
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = 'varying vec3 floorWorld; varying vec4 floorUv; uniform mat4 floorMatrix;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        floorWorld = (modelMatrix * vec4(transformed,1.)).xyz;
        floorUv = floorMatrix * vec4(floorWorld,1.);`)
      shader.fragmentShader = 'varying vec3 floorWorld; varying vec4 floorUv; uniform sampler2D floorReflection; uniform float floorOpacity; uniform float plantEdge;\n' + shader.fragmentShader
      // Increase the soft-shadow sample count only on the floor material.
      const shadows = THREE.ShaderChunk.shadowmap_pars_fragment.replace('float radius = shadowRadius * texelSize.x;', 'float radius = max(shadowRadius, 8.) * texelSize.x * (1.5 + 2. * smoothstep(-.1, .9, floorWorld.z));').replace(
        /shadow = \([\s\S]*?\) \* 0\.2;/,
        `shadow = 0.;
         for (int sampleIndex = 0; sampleIndex < 24; sampleIndex++) {
           shadow += texture(shadowMap, vec3(shadowCoord.xy + vogelDiskSample(sampleIndex, 24, phi) * radius, shadowCoord.z));
         }
         shadow /= 24.;`,
      )
      shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', shadows + '\n#include <shadowmask_pars_fragment>')
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        vec2 reflectedUv = floorUv.xy / floorUv.w;
        vec3 reflected = texture2D(floorReflection, reflectedUv).rgb;
        float foreground = 1. - smoothstep(.15, 1.65, floorWorld.z);
        float reflectionStrength = .10 * foreground;
        float edgeDistance = abs(floorWorld.x) - plantEdge;
        float sidePool = exp(-pow(edgeDistance / .67, 2.));
        float centerPool = .58 * exp(-pow(floorWorld.x / 1.25, 2.));
        float wash = (.13 + .55 * max(sidePool, centerPool)) * (.38 + .62 * exp(-pow((floorWorld.z - .05) / .72, 2.)));
        float footContact = exp(-pow(edgeDistance / .098, 4.) - pow((floorWorld.z - .04) / .11, 2.));
        float shadow = getShadowMask();
        outgoingLight *= wash * mix(.24, 1., shadow) * (1. - footContact * .96);
        outgoingLight += reflected * reflectionStrength;
        // A broad wash with a gentle falloff, rather than separate bright disks.
        float backFade = smoothstep(-1.5, -.3, floorWorld.z);
        float frontFade = 1. - smoothstep(.65, 1.9, floorWorld.z);
        float sideFade = 1. - smoothstep(3.4, 5.5, abs(floorWorld.x));
        diffuseColor.a *= backFade * frontFade * sideFade * floorOpacity;
        #include <opaque_fragment>`)
    }
    const blurMaterial = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { image: { value: reflection.texture }, direction: { value: new THREE.Vector2() } },
      vertexShader: 'varying vec2 uvOut; void main(){uvOut=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform sampler2D image; uniform vec2 direction; varying vec2 uvOut;
        void main(){
          vec4 c=texture2D(image,uvOut)*.227027;
          c+=(texture2D(image,uvOut+direction*1.384615)+texture2D(image,uvOut-direction*1.384615))*.316216;
          c+=(texture2D(image,uvOut+direction*3.230769)+texture2D(image,uvOut-direction*3.230769))*.070270;
          gl_FragColor=c;
        }`,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMaterial)
    const blurScene = new THREE.Scene()
    blurScene.add(quad)
    return { reflection, scratch, blurred, mirrorCamera, normal, point, plane, matrix, uniforms, material, grain, blurMaterial, blurScene, quad,
      position: new THREE.Vector3(), direction: new THREE.Vector3(), up: new THREE.Vector3(), target: new THREE.Vector3(), blurCamera: new THREE.Camera() }
  }, [])
  useEffect(() => {
    const height = Math.max(128, Math.round(768 * size.height / size.width))
    for (const target of [resources.reflection, resources.scratch, resources.blurred]) target.setSize(768, height)
    invalidate()
  }, [size.width, size.height, resources, invalidate])
  useEffect(() => () => {
    for (const target of [resources.reflection, resources.scratch, resources.blurred]) target.dispose()
    resources.material.dispose(); resources.grain.dispose(); resources.blurMaterial.dispose(); resources.quad.geometry.dispose()
  }, [resources])
  useFrame(() => {
    const r = resources, mesh = floor.current
    if (!mesh) return
    const opacity = 1 - smooth(.02, .65, input.current.focus || 0)
    mesh.visible = opacity > .001
    r.uniforms.floorOpacity.value = opacity
    if (floorLight.current) floorLight.current.intensity = .85 * opacity
    r.uniforms.plantEdge.value = size.width / camera.zoom * .5 - (size.width < 1000 ? .29 : .38)
    if (!mesh.visible) return
    camera.updateMatrixWorld()
    r.mirrorCamera.copy(camera, false)
    r.position.copy(camera.position).addScaledVector(r.normal, -2 * r.plane.distanceToPoint(camera.position))
    camera.getWorldDirection(r.direction).reflect(r.normal)
    r.up.set(0, 1, 0).applyQuaternion(camera.quaternion).reflect(r.normal)
    r.mirrorCamera.position.copy(r.position)
    r.mirrorCamera.up.copy(r.up)
    r.mirrorCamera.lookAt(r.target.copy(r.position).add(r.direction))
    r.mirrorCamera.layers.set(0)
    r.mirrorCamera.updateMatrixWorld()
    r.matrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1)
      .multiply(r.mirrorCamera.projectionMatrix).multiply(r.mirrorCamera.matrixWorldInverse)
    const oldTarget = gl.getRenderTarget(), oldClipping = gl.clippingPlanes, oldAutoUpdate = gl.shadowMap.autoUpdate
    mesh.visible = false
    gl.clippingPlanes = [r.plane]
    gl.shadowMap.autoUpdate = false
    gl.setRenderTarget(r.reflection)
    gl.clear()
    gl.render(scene, r.mirrorCamera)
    gl.clippingPlanes = oldClipping
    r.blurMaterial.uniforms.image.value = r.reflection.texture
    r.blurMaterial.uniforms.direction.value.set(2.5 / r.reflection.width, 0)
    gl.setRenderTarget(r.scratch)
    gl.render(r.blurScene, r.blurCamera)
    r.blurMaterial.uniforms.image.value = r.scratch.texture
    r.blurMaterial.uniforms.direction.value.set(0, 3 / r.reflection.height)
    gl.setRenderTarget(r.blurred)
    gl.render(r.blurScene, r.blurCamera)
    gl.setRenderTarget(oldTarget)
    gl.shadowMap.autoUpdate = oldAutoUpdate
    mesh.visible = true
  })
  return <group>
    <mesh ref={floor} position={[0, -1.34, 0]} rotation={[-Math.PI / 2 + .18, 0, 0]}
      receiveShadow layers-mask={4} raycast={() => null} material={resources.material}>
      <planeGeometry args={[16, 12]} />
    </mesh>
    <ambientLight layers-mask={4} intensity={.035} />
    <directionalLight ref={floorLight} layers-mask={4} position={[-1.5, 3.5, -2.4]} intensity={.85} color="#f8ddbc" castShadow
      shadow-mapSize={[2048, 2048]} shadow-bias={-.0001} shadow-normalBias={.008}
      shadow-camera-left={-4.5} shadow-camera-right={4.5} shadow-camera-top={3} shadow-camera-bottom={-3}
      shadow-camera-near={.1} shadow-camera-far={14} shadow-radius={9} />
  </group>
}


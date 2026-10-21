import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { smooth } from './rackMotion'

const url = `${import.meta.env.BASE_URL}models/celestial-plant.glb`
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`

// Shared geometry, with separate daylight and studio materials.
export default function RackPlants({ input, lightMode }) {
  const { scene } = useGLTF(url)
  const { size, camera } = useThree()
  const roots = useRef([]), pools = useRef([])
  const models = useMemo(() => [-1, 1].map(() => {
    const plant = scene.clone(true)
    plant.traverse(mesh => {
      if (!mesh.isMesh) return
      const original = mesh.material
      const leaf = original.name.startsWith('Leaf')
      mesh.material = new THREE.MeshPhysicalMaterial({
        name: original.name, color: original.color.clone().multiplyScalar(lightMode ? 1 : leaf ? .57 : .64),
        roughness: leaf ? .44 : .53, metalness: 0, specularIntensity: leaf ? .6 : 1,
        clearcoat: leaf ? .28 : .13, clearcoatRoughness: .44,
        side: THREE.DoubleSide, transparent: true,
        envMapIntensity: lightMode ? .65 : .32,
      })
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.raycast = () => null
    })
    return plant
  }), [scene, lightMode])
  useEffect(() => () => models.forEach(plant => plant.traverse(mesh => {
    if (mesh.isMesh) mesh.material.dispose()
  })), [models])

  useFrame(() => {
    const opacity = 1 - smooth(.02, .65, input.current.focus || 0)
    const width = size.width / camera.zoom
    models.forEach((plant, i) => {
      const side = i === 0 ? -1 : 1, root = roots.current[i]
      if (!root) return
      root.visible = size.width >= 700 && opacity > .001
      const scale = size.width < 1000 ? .46 : .70
      const x = side * (width * .5 - (size.width < 1000 ? .29 : .38))
      root.position.set(x, -1.34, .04)
      plant.scale.setScalar(scale)
      plant.rotation.y = i === 0 ? -.35 : 1.2
      plant.traverse(mesh => { if (mesh.isMesh) mesh.material.opacity = opacity })
      const pool = pools.current[i]
      if (pool) {
        pool.visible = lightMode
        pool.material.uniforms.opacity.value = opacity
        pool.material.uniforms.day.value = lightMode ? 1 : 0
      }
    })
  })
  return <group>{models.map((plant, i) => <group key={i} ref={node => { roots.current[i] = node }}>
    <mesh position={[0, -.08, -.15]} ref={node => { pools.current[i] = node }} raycast={() => null}>
      <planeGeometry args={[2.5, .62]} />
      <shaderMaterial transparent depthWrite={false} toneMapped={false}
        uniforms={{ opacity: {value: 1}, day: {value: lightMode ? 1 : 0} }}
        vertexShader={vertex} fragmentShader={`uniform float opacity; uniform float day; varying vec2 vUv;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float noise(vec2 p){
            vec2 i=floor(p), f=fract(p);f=f*f*(3.-2.*f);
            return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
          }
          void main(){
            // World-sized floor footprint. The pot touches p.y = .08.
            vec2 p=(vUv-.5)*vec2(2.5,.62);
            float edge=(1.-smoothstep(.84,1.25,abs(p.x)))*(1.-smoothstep(.22,.31,abs(p.y)));
            float rear=exp(-pow(p.x/.66,2.)-pow((p.y-.09)/.065,2.));
            float bounce=exp(-pow((p.x-.13)/.68,2.)-pow((p.y+.035)/.19,2.));
            float contact=exp(-pow(p.x/.105,4.)-pow((p.y-.072)/.013,2.));
            float base=exp(-pow((p.x+.07)/.23,2.)-pow((p.y-.047)/.035,2.));
            float foliage=0.;
            // Tapered leaf shadows spread away from the overhead light;
            // wider penumbrae in the foreground keep them from looking printed.
            for(int i=0;i<22;i++){
              float id=float(i);
              float r=hash(vec2(id,9.));
              vec2 tip=vec2((r-.5)*1.75,-.045-hash(vec2(id,3.))*.23);
              vec2 origin=vec2((hash(vec2(id,5.))-.5)*.11,.065);
              vec2 axis=tip-origin;
              float t=clamp(dot(p-origin,axis)/dot(axis,axis),0.,1.);
              float distanceToAxis=length(p-(origin+t*axis));
              float w=mix(.003,.018,t)+.012*sin(t*3.14159);
              float leaf=exp(-pow(distanceToAxis/w,2.))*sin(t*3.14159);
              foliage=1.-(1.-foliage)*(1.-leaf*.56);
            }
            float stone=noise(p*vec2(25.,95.))*.65+noise(p*vec2(80.,210.))*.35;
            float shade=1.-(1.-contact*.98)*(1.-base*.73)*(1.-foliage*.90);
            vec3 light=(vec3(.30,.255,.205)*rear+vec3(.16,.143,.12)*bounce)*(1.-shade);
            light*=.74+stone*.38;
            if(day>.5) gl_FragColor=vec4(.20,.16,.10,(contact*.26+base*.12+foliage*.055)*edge*opacity);
            else gl_FragColor=vec4(light,edge*opacity);
          }`} />
    </mesh>
    <primitive object={plant} />
  </group>)}</group>
}




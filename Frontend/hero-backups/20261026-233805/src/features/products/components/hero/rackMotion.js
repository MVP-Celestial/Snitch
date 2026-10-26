export const GARMENTS = [
  { name: 'Navy', source: 3, color: '#364b66' },
  { name: 'Burgundy', source: 3, color: '#663f4e' },
  { name: 'Chalk', source: 0 },
  { name: 'Olive', source: 1 },
  { name: 'Slate', source: 2 },
  { name: 'Charcoal', source: 3 },
  { name: 'Sand', source: 4 },
  { name: 'Forest', source: 5 },
  { name: 'Clay', source: 6 },
  { name: 'Ash', source: 0, color: '#a6a8a4' },
  { name: 'Espresso', source: 3, color: '#574238' },
]
export const GARMENT_COUNT = GARMENTS.length
export const INITIAL_GARMENT = Math.floor(GARMENT_COUNT / 2)
export const clampIndex = (index) => Math.max(0, Math.min(GARMENT_COUNT - 1, index))
export const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Each swipe advances at most one hanger; excess distance is elastic.
export function dragPosition(start, distance) {
  const direction = Math.sign(distance)
  const limit = direction > 0 ? Math.min(1, start) : Math.min(1, GARMENT_COUNT - 1 - start)
  const magnitude = Math.abs(distance)
  const travel = magnitude <= limit ? magnitude : limit + .16 * (1 - Math.exp(-(magnitude - limit) * 2))
  return start - direction * travel
}

export function releaseIndex(start, displacement, velocity) {
  const travel = Math.abs(displacement) > .22 ? displacement : Math.abs(velocity) > .45 ? velocity : 0
  return clampIndex(start - Math.sign(travel))
}

// Exact damped-spring integration: consistent at 30, 60 and 120 Hz.
// Capping long pauses prevents a tab resume from jumping the whole animation.
export function spring(state, target, delta, stiffness = 190, damping = 24) {
  const dt = Math.max(0, Math.min(delta, .05))
  const offset = state.value - target
  const halfDamping = damping / 2
  const discriminant = stiffness - halfDamping * halfDamping
  const decay = Math.exp(-halfDamping * dt)
  let nextOffset, nextVelocity
  if (Math.abs(discriminant) < .000001) {
    const b = state.velocity + halfDamping * offset
    nextOffset = decay * (offset + b * dt)
    nextVelocity = decay * (state.velocity - halfDamping * b * dt)
  } else {
    const frequency = Math.sqrt(Math.abs(discriminant))
    const phase = frequency * dt
    const c = discriminant > 0 ? Math.cos(phase) : Math.cosh(phase)
    const s = (discriminant > 0 ? Math.sin(phase) : Math.sinh(phase)) / frequency
    nextOffset = decay * (offset * c + (state.velocity + halfDamping * offset) * s)
    nextVelocity = decay * (state.velocity * c - (halfDamping * state.velocity + stiffness * offset) * s)
  }
  state.value = target + nextOffset
  state.velocity = nextVelocity
  if (Math.abs(state.value - target) < .0001 && Math.abs(state.velocity) < .001) {
    state.value = target
    state.velocity = 0
  }
  return state.value !== target || state.velocity !== 0
}

export function stackPose(distance) {
  return {
    x: .17 * distance + .35 * Math.tanh(distance * 2.8),
    turn: Math.sign(distance) * 1.27 * smooth(0, .88, Math.abs(distance)),
    z: -.035 * Math.min(Math.abs(distance), 4),
  }
}

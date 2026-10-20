export const GARMENT_COUNT = 7
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

// Substeps keep the spring stable after dropped frames.
export function spring(state, target, delta, stiffness = 190, damping = 24) {
  const steps = Math.max(1, Math.ceil(Math.min(delta, .05) / (1 / 120)))
  const dt = Math.min(delta, .05) / steps
  for (let i = 0; i < steps; i++) {
    state.velocity += ((target - state.value) * stiffness - state.velocity * damping) * dt
    state.value += state.velocity * dt
  }
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

// Add only licensed local GLBs. Null URLs deliberately avoid fictitious model requests.
const posterUrl = `${import.meta.env.BASE_URL}images/hero-garment.png`
export const garments = [
  { id: 'study-01', name: 'The oversized essential', modelUrl: null, posterUrl },
  { id: 'study-02', name: 'The everyday silhouette', modelUrl: null, posterUrl },
  { id: 'study-03', name: 'The relaxed uniform', modelUrl: null, posterUrl },
]
export const REVOLVE_INTERVAL = 9000

import type { NearbyLandmarkRow } from '../lib/database.types'

const categoryIcons: Record<string, string> = {
  bank: '▣',
  supermarket: '▦',
  apartment: '⌂',
  road: '↗',
  school: '✎',
  hospital: '✚',
  park: '♧',
  transit: '⇄',
  metro: '⇄',
}

export function LandmarkList({ landmarks }: { landmarks: NearbyLandmarkRow[] }) {
  if (!landmarks.length) return null
  return <ul className="landmark-list">{landmarks.map((landmark) => {
    const category = landmark.category?.toLowerCase() || ''
    const icon = categoryIcons[category] || '⌖'
    return <li key={landmark.id}><span className="landmark-icon" aria-hidden="true">{icon}</span><span className="landmark-name-wrap"><strong>{landmark.name}</strong>{landmark.category && <span className="landmark-category">{landmark.category}</span>}</span>{landmark.distance_text && <span className="landmark-distance">{landmark.distance_text}</span>}</li>
  })}</ul>
}

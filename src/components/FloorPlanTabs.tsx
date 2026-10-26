import { useState, type KeyboardEvent } from 'react'
import type { Json, ProjectImageRow, UnitTypeRow } from '../lib/database.types'
import { Lightbox } from './Lightbox'

type FloorPlanTabsProps = {
  images: ProjectImageRow[]
  units: UnitTypeRow[]
  brochureUrl: string | null
}

type PlanImage = { src: string; alt: string }

function readRooms(value: Json): { name: string; size: string }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((room) => {
    if (typeof room !== 'object' || room === null || Array.isArray(room)) return []
    const record = room as Record<string, Json | undefined>
    return typeof record.name === 'string' && typeof record.size === 'string'
      ? [{ name: record.name, size: record.size }]
      : []
  })
}

function PlanViewer({ plan, onOpen }: { plan: PlanImage | null; onOpen: (plan: PlanImage) => void }) {
  if (!plan) {
    return <div className="plan-placeholder"><span className="plan-placeholder-icon" aria-hidden="true">⌂</span><span>Plan image coming soon</span></div>
  }
  return (
    <button className="plan-image-button" type="button" onClick={() => onOpen(plan)} aria-label={`Open ${plan.alt} in image viewer`}>
      <img src={plan.src} alt={plan.alt} loading="lazy" />
      <span className="plan-zoom-hint" aria-hidden="true">View full screen ↗</span>
    </button>
  )
}

export function FloorPlanTabs({ images, units, brochureUrl }: FloorPlanTabsProps) {
  const typicalPlans = images.filter((image) => image.category === 'typical_floor_plan')
  const tabs = [
    { id: 'typical', label: 'Typical Floor Plan', unit: null as UnitTypeRow | null },
    ...units.map((unit) => ({ id: unit.id, label: `${unit.name}${unit.area_sqft ? ` · ${unit.area_sqft} sq ft` : ''}`, unit })),
  ]
  const [activeTab, setActiveTab] = useState('typical')
  const [lightboxPlan, setLightboxPlan] = useState<PlanImage | null>(null)

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
    let nextIndex = currentIndex
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex !== currentIndex) {
      event.preventDefault()
      setActiveTab(tabs[nextIndex].id)
      document.getElementById(`floor-tab-${tabs[nextIndex].id}`)?.focus()
    }
  }

  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const unit = active.unit
  const rooms = unit ? readRooms(unit.rooms) : []

  return (
    <div className="floor-plan-widget">
      <div className="floor-plan-tabs" role="tablist" aria-label="Choose a floor plan">
        {tabs.map((tab) => <button key={tab.id} id={`floor-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`floor-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} className={`floor-plan-tab${activeTab === tab.id ? ' is-active' : ''}`} onClick={() => setActiveTab(tab.id)} onKeyDown={handleTabKeyDown}>{tab.label}</button>)}
      </div>
      <div className="floor-plan-panel" id={`floor-panel-${active.id}`} role="tabpanel" aria-labelledby={`floor-tab-${active.id}`} tabIndex={0}>
        {unit ? (
          <>
            <div className="unit-plan-heading"><div><p className="eyebrow">Apartment layout</p><h3>{unit.name}</h3></div>{unit.area_sqft && <span className="unit-area">{unit.area_sqft.toLocaleString('en-IN')} sq ft</span>}</div>
            <div className="unit-plans-grid">
              <div className="unit-plan-card"><h4>2D floor plan</h4><PlanViewer plan={unit.floor_plan_2d_url ? { src: unit.floor_plan_2d_url, alt: `${unit.name} 2D floor plan` } : null} onOpen={setLightboxPlan} /></div>
              <div className="unit-plan-card"><h4>3D floor plan</h4><PlanViewer plan={unit.floor_plan_3d_url ? { src: unit.floor_plan_3d_url, alt: `${unit.name} 3D floor plan` } : null} onOpen={setLightboxPlan} /></div>
            </div>
            {rooms.length > 0 && <div className="room-table-wrap"><h4>Room sizes</h4><table className="room-table"><thead><tr><th scope="col">Room</th><th scope="col">Size</th></tr></thead><tbody>{rooms.map((room, index) => <tr key={`${room.name}-${index}`}><th scope="row">{room.name}</th><td>{room.size}</td></tr>)}</tbody></table></div>}
          </>
        ) : typicalPlans.length ? (
          <div className="typical-plans-grid">{typicalPlans.map((image) => <PlanViewer key={image.id} plan={{ src: image.image_url, alt: image.caption || 'Typical floor plan' }} onOpen={setLightboxPlan} />)}</div>
        ) : (
          <div className="plans-empty"><span aria-hidden="true">⌂</span><h3>Floor plans will be added soon</h3><p>Contact our team if you’d like to learn more about the available layouts.</p></div>
        )}
      </div>
      <div className="floor-plan-note-row"><p className="floor-plan-note">Floor plans are indicative and subject to change.</p>{brochureUrl && <a className="button button-outline-dark brochure-button" href={brochureUrl} target="_blank" rel="noreferrer">Download brochure <span aria-hidden="true">↓</span></a>}</div>
      {lightboxPlan && <Lightbox src={lightboxPlan.src} alt={lightboxPlan.alt} onClose={() => setLightboxPlan(null)} />}
    </div>
  )
}

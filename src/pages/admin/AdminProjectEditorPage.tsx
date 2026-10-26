import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteAdminChildRow, createAdminProject, getAdminProjectDetail, saveAdminLandmark, saveAdminProjectImage, saveAdminSpecification, saveAdminUnitType, updateAdminProjectFields, updateAdminProjectRecord, type ProjectWrite } from '../../lib/admin-queries'
import type { Json, NearbyLandmarkRow, ProjectImageRow, ProjectRow, ProjectStatus, SpecificationRow, UnitTypeRow } from '../../lib/database.types'
import { prepareProjectImage, uploadProjectMedia, validateProjectPdf } from '../../lib/admin-media'
import { buildDirectionsUrl, buildGoogleMapsEmbedUrl } from '../../lib/contact-links'

type EditorTab = 'basic' | 'theme' | 'media' | 'units' | 'gallery' | 'specifications' | 'landmarks'
type RoomDraft = { name: string; size: string }
type UnitDraft = Omit<UnitTypeRow, 'rooms' | 'created_at'> & { rooms: RoomDraft[]; localId: string }
type SpecificationDraft = Omit<SpecificationRow, 'details'> & { detailsText: string; localId: string }
type LandmarkDraft = NearbyLandmarkRow & { localId: string }

const editorTabs: { key: EditorTab; label: string }[] = [
  { key: 'basic', label: 'Basic info' },
  { key: 'theme', label: 'Theme' },
  { key: 'media', label: 'Media' },
  { key: 'units', label: 'Unit types' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'specifications', label: 'Specifications' },
  { key: 'landmarks', label: 'Landmarks' },
]

const companyPalette = {
  theme_primary: '#3E8A9C',
  theme_secondary: '#6B3A26',
  theme_accent: '#C0603A',
  theme_background: '#F0E4D8',
  theme_text: '#2B3F8C',
}

function emptyProject(): ProjectWrite {
  return {
    slug: '', name: '', block_label: null, tagline: null, short_description: null, about_text: null,
    status: 'upcoming', is_published: false, is_featured: false, display_order: 0,
    locality: null, city: 'Hyderabad', address: null, pincode: null, maps_query: null, rera_number: null, possession_date: null,
    contact_phones: [], whatsapp_number: null, hero_image_url: null, brochure_url: null, location_map_url: null, logo_url: null,
    theme_primary: null, theme_secondary: null, theme_accent: null, theme_background: null, theme_text: null, highlights: [],
  }
}

function toProjectWrite(project: ProjectRow): ProjectWrite {
  return {
    slug: project.slug,
    name: project.name,
    block_label: project.block_label,
    tagline: project.tagline,
    short_description: project.short_description,
    about_text: project.about_text,
    status: project.status,
    is_published: project.is_published,
    is_featured: project.is_featured,
    display_order: project.display_order,
    locality: project.locality,
    city: project.city,
    address: project.address,
    pincode: project.pincode,
    maps_query: project.maps_query,
    rera_number: project.rera_number,
    possession_date: project.possession_date,
    contact_phones: project.contact_phones || [],
    whatsapp_number: project.whatsapp_number,
    hero_image_url: project.hero_image_url,
    brochure_url: project.brochure_url,
    location_map_url: project.location_map_url,
    logo_url: project.logo_url,
    theme_primary: project.theme_primary,
    theme_secondary: project.theme_secondary,
    theme_accent: project.theme_accent,
    theme_background: project.theme_background,
    theme_text: project.theme_text,
    highlights: project.highlights || [],
  }
}

function mediaField(slot: 'hero' | 'logo' | 'brochure' | 'location-map') {
  if (slot === 'hero') return 'hero_image_url' as const
  if (slot === 'logo') return 'logo_url' as const
  if (slot === 'brochure') return 'brochure_url' as const
  return 'location_map_url' as const
}

function slugify(value: string) {
  return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function textLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
}

function roomDrafts(value: Json): RoomDraft[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return []
    const room = item as Record<string, Json | undefined>
    return typeof room.name === 'string' && typeof room.size === 'string' ? [{ name: room.name, size: room.size }] : []
  })
}

function InputField({ label, value, onChange, type = 'text', placeholder, required = false, min, max, step }: {
  label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: number; max?: number; step?: number
}) {
  return <label className="editor-field">{label}{required && <span className="editor-required">*</span>}<input type={type} value={value} placeholder={placeholder} required={required} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} /></label>
}

function TextAreaField({ label, value, onChange, rows = 4, placeholder, maxLength }: {
  label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string; maxLength?: number
}) {
  return <label className="editor-field editor-field-wide">{label}<textarea value={value} rows={rows} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>
}

function EditorCard({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="editor-card"><div className="editor-card-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>
}

function MediaUploadCard({ title, help, url, type, busy, onUpload, onRemove }: {
  title: string; help: string; url: string | null; type: 'image' | 'pdf'; busy: boolean; onUpload: (file: File) => void; onRemove: () => void
}) {
  return <article className="media-upload-card"><div className="media-upload-heading"><div><h3>{title}</h3><p>{help}</p></div>{url && <button className="editor-text-danger" type="button" onClick={onRemove}>Remove</button>}</div>
    {url && (type === 'image' ? <img className="media-preview" src={url} alt={`${title} preview`} loading="lazy" /> : <a className="media-pdf-preview" href={url} target="_blank" rel="noreferrer"><span aria-hidden="true">PDF</span> View uploaded brochure ↗</a>)}
    <label className="editor-file-input">{busy ? 'Uploading…' : url ? 'Replace file' : 'Choose file'}<input type="file" accept={type === 'image' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = '' }} /></label>
  </article>
}

function ProjectEditorSkeleton() {
  return <main className="admin-project-editor"><div className="admin-table-skeleton"><span /><span /><span /><span /><span /></div></main>
}

export function AdminProjectEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [project, setProject] = useState<ProjectWrite>(emptyProject())
  const [detail, setDetail] = useState<(ProjectRow & { unit_types: UnitTypeRow[]; project_images: ProjectImageRow[]; specifications: SpecificationRow[]; nearby_landmarks: NearbyLandmarkRow[] }) | null>(null)
  const [units, setUnits] = useState<UnitDraft[]>([])
  const [images, setImages] = useState<ProjectImageRow[]>([])
  const [specifications, setSpecifications] = useState<SpecificationDraft[]>([])
  const [landmarks, setLandmarks] = useState<LandmarkDraft[]>([])
  const [activeTab, setActiveTab] = useState<EditorTab>('basic')
  const [isLoading, setIsLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState('')
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew)
  const [newGalleryCategory, setNewGalleryCategory] = useState<ProjectImageRow['category']>('gallery')

  useEffect(() => {
    let active = true
    if (!id) {
      setProject(emptyProject())
      setDetail(null)
      setIsLoading(false)
      setSlugManuallyEdited(false)
      return () => { active = false }
    }
    setIsLoading(true)
    setLoadError('')
    getAdminProjectDetail(id).then((loaded) => {
      if (!active) return
      if (!loaded) { setLoadError('This project could not be found.'); setDetail(null); return }
      setDetail(loaded)
      setProject(toProjectWrite(loaded))
      setUnits(loaded.unit_types.map((unit) => ({ ...unit, rooms: roomDrafts(unit.rooms), localId: unit.id })))
      setImages(loaded.project_images)
      setSpecifications(loaded.specifications.map((spec) => ({ ...spec, detailsText: spec.details.join('\n'), localId: spec.id })))
      setLandmarks(loaded.nearby_landmarks.map((landmark) => ({ ...landmark, localId: landmark.id })))
      setSlugManuallyEdited(true)
    }).catch(() => { if (active) setLoadError('We couldn’t load this project. Please try again.') }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [id])

  const projectId = detail?.id ?? (id || undefined)
  const colorPreview = useMemo(() => ({
    '--color-teal': project.theme_primary || companyPalette.theme_primary,
    '--color-wood': project.theme_secondary || companyPalette.theme_secondary,
    '--color-terracotta': project.theme_accent || companyPalette.theme_accent,
    '--color-cream': project.theme_background || companyPalette.theme_background,
    '--color-paper': project.theme_background || '#F8F1EA',
    '--color-navy': project.theme_text || companyPalette.theme_text,
  }) as unknown as CSSProperties, [project.theme_primary, project.theme_secondary, project.theme_accent, project.theme_background, project.theme_text])

  function setProjectField<K extends keyof ProjectWrite>(field: K, value: ProjectWrite[K]) {
    setProject((current) => ({ ...current, [field]: value }))
  }

  function parseMapsInput(input: string): string {
    const trimmed = input.trim()
    if (!trimmed) return ''

    const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (coordMatch) {
      return `${coordMatch[1]}, ${coordMatch[2]}`
    }

    const qMatch = trimmed.match(/[?&]q=([^&]+)/)
    if (qMatch) {
      try {
        return decodeURIComponent(qMatch[1].replace(/\+/g, ' '))
      } catch {
        return qMatch[1]
      }
    }

    const placeMatch = trimmed.match(/\/place\/([^/@?]+)/)
    if (placeMatch) {
      try {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      } catch {
        return placeMatch[1]
      }
    }

    return trimmed
  }

  function handleMapQueryChange(value: string) {
    const cleaned = parseMapsInput(value)
    setProjectField('maps_query', cleaned || null)
  }

  function autoFillMapFromAddress() {
    const parts = [project.address, project.locality, project.city, project.pincode].filter(Boolean)
    if (!parts.length) {
      setMessage({ tone: 'error', text: 'Please enter the address, locality, or city first.' })
      return
    }
    const query = parts.join(', ')
    setProjectField('maps_query', query)
    setMessage({ tone: 'success', text: 'Map query generated from address.' })
  }

  function useCurrentGpsLocation() {
    if (!navigator.geolocation) {
      setMessage({ tone: 'error', text: 'Geolocation is not supported by your browser.' })
      return
    }
    setMessage({ tone: 'success', text: 'Detecting GPS location…' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        setProjectField('maps_query', coords)
        setMessage({ tone: 'success', text: `Pinned GPS coordinates: ${coords}` })
      },
      (err) => {
        setMessage({ tone: 'error', text: `Could not retrieve GPS location: ${err.message}` })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const effectiveMapQuery = project.maps_query || [project.address, project.locality, project.city].filter(Boolean).join(', ')
  const activeMapEmbedUrl = buildGoogleMapsEmbedUrl(effectiveMapQuery)

  function updateName(value: string) {
    setProject((current) => ({ ...current, name: value, ...(!slugManuallyEdited ? { slug: slugify(`${value} ${current.block_label || ''}`) } : {}) }))
  }

  function updateBlock(value: string) {
    setProject((current) => ({ ...current, block_label: value || null, ...(!slugManuallyEdited ? { slug: slugify(`${current.name} ${value}`) } : {}) }))
  }

  async function saveBasicInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!project.name.trim() || !project.slug.trim()) { setMessage({ tone: 'error', text: 'Project name and slug are required.' }); return }
    setBusy(true)
    setMessage(null)
    try {
      const payload = toProjectWrite({
        ...project,
        name: project.name.trim(),
        slug: slugify(project.slug),
      } as unknown as ProjectRow)
      if (id) {
        const saved = await updateAdminProjectRecord(id, payload)
        setDetail((current) => current ? { ...current, ...saved } : current)
        setProject(toProjectWrite(saved))
        setMessage({ tone: 'success', text: 'Project details saved.' })
      } else {
        const created = await createAdminProject(payload)
        navigate(`/admin/projects/${created.id}`, { replace: true })
      }
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Project details could not be saved. Check the slug and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function saveTheme() {
    if (!projectId) return
    setBusy(true); setMessage(null)
    try {
      const fields = { theme_primary: project.theme_primary, theme_secondary: project.theme_secondary, theme_accent: project.theme_accent, theme_background: project.theme_background, theme_text: project.theme_text }
      const saved = await updateAdminProjectFields(projectId, fields)
      setDetail((current) => current ? { ...current, ...saved } : current)
      setMessage({ tone: 'success', text: 'Project theme saved.' })
    } catch { setMessage({ tone: 'error', text: 'The project theme could not be saved.' }) }
    finally { setBusy(false) }
  }

  function resetTheme() {
    setProject((current) => ({ ...current, theme_primary: null, theme_secondary: null, theme_accent: null, theme_background: null, theme_text: null }))
  }

  async function uploadMedia(slot: 'hero' | 'logo' | 'brochure' | 'location-map', file: File) {
    if (!projectId) { setMessage({ tone: 'error', text: 'Save Basic Info before uploading project media.' }); return }
    setUploading(slot); setMessage(null)
    try {
      const upload = slot === 'brochure' ? (validateProjectPdf(file), file) : await prepareProjectImage(file)
      const url = await uploadProjectMedia(projectId, slot, upload)
      const field = mediaField(slot)
      const saved = await updateAdminProjectFields(projectId, { [field]: url } as Partial<ProjectWrite>)
      setProject((current) => ({ ...current, [field]: url }))
      setDetail((current) => current ? { ...current, ...saved } : current)
      setMessage({ tone: 'success', text: `${slot === 'brochure' ? 'Brochure' : 'Image'} uploaded and saved.` })
    } catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'The file could not be uploaded.' }) }
    finally { setUploading('') }
  }

  async function removeMedia(slot: 'hero' | 'logo' | 'brochure' | 'location-map') {
    if (!projectId) return
    const field = mediaField(slot)
    setUploading(slot); setMessage(null)
    try {
      const saved = await updateAdminProjectFields(projectId, { [field]: null } as Partial<ProjectWrite>)
      setProject((current) => ({ ...current, [field]: null }))
      setDetail((current) => current ? { ...current, ...saved } : current)
      setMessage({ tone: 'success', text: 'Media removed from this project.' })
    } catch { setMessage({ tone: 'error', text: 'Media could not be removed.' }) }
    finally { setUploading('') }
  }

  async function uploadUnitPlan(localId: string, field: 'floor_plan_2d_url' | 'floor_plan_3d_url', file: File) {
    if (!projectId) return
    setUploading(`${localId}-${field}`); setMessage(null)
    try {
      const prepared = await prepareProjectImage(file)
      const url = await uploadProjectMedia(projectId, `unit-plans/${field}`, prepared)
      setUnits((current) => current.map((unit) => unit.localId === localId ? { ...unit, [field]: url } as UnitDraft : unit))
      setMessage({ tone: 'success', text: 'Plan uploaded. Save this unit type to keep the change.' })
    } catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'The plan could not be uploaded.' }) }
    finally { setUploading('') }
  }

  async function saveUnit(unit: UnitDraft) {
    if (!projectId) return
    setBusy(true); setMessage(null)
    try {
      const saved = await saveAdminUnitType({
        ...(unit.id.startsWith('new-') ? {} : { id: unit.id }), project_id: projectId, name: unit.name.trim() || 'Unit type',
        bhk: unit.bhk, facing: unit.facing, area_sqft: unit.area_sqft, floor_plan_2d_url: unit.floor_plan_2d_url,
        floor_plan_3d_url: unit.floor_plan_3d_url, rooms: unit.rooms as unknown as Json, display_order: unit.display_order,
      })
      setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...saved, rooms: roomDrafts(saved.rooms), localId: saved.id } : item).sort((a, b) => a.display_order - b.display_order))
      setMessage({ tone: 'success', text: 'Unit type saved.' })
    } catch { setMessage({ tone: 'error', text: 'Unit type could not be saved.' }) }
    finally { setBusy(false) }
  }

  async function removeUnit(unit: UnitDraft) {
    if (unit.id.startsWith('new-')) { setUnits((current) => current.filter((item) => item.localId !== unit.localId)); return }
    if (!window.confirm(`Remove the “${unit.name}” unit type?`)) return
    setBusy(true)
    try { await deleteAdminChildRow('unit_types', unit.id); setUnits((current) => current.filter((item) => item.id !== unit.id)); setMessage({ tone: 'success', text: 'Unit type removed.' }) }
    catch { setMessage({ tone: 'error', text: 'Unit type could not be removed.' }) }
    finally { setBusy(false) }
  }

  async function addGalleryImage(file: File) {
    if (!projectId) return
    setUploading('gallery'); setMessage(null)
    try {
      const prepared = await prepareProjectImage(file)
      const url = await uploadProjectMedia(projectId, `gallery/${newGalleryCategory}`, prepared)
      const saved = await saveAdminProjectImage({ project_id: projectId, image_url: url, caption: null, category: newGalleryCategory, display_order: images.length })
      setImages((current) => [...current, saved].sort((a, b) => a.display_order - b.display_order))
      setMessage({ tone: 'success', text: 'Gallery image uploaded.' })
    } catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'The image could not be uploaded.' }) }
    finally { setUploading('') }
  }

  async function saveGalleryImage(image: ProjectImageRow) {
    setBusy(true); setMessage(null)
    try { const saved = await saveAdminProjectImage({ id: image.id, project_id: projectId!, image_url: image.image_url, caption: image.caption, category: image.category, display_order: image.display_order }); setImages((current) => current.map((item) => item.id === image.id ? saved : item).sort((a, b) => a.display_order - b.display_order)); setMessage({ tone: 'success', text: 'Gallery details saved.' }) }
    catch { setMessage({ tone: 'error', text: 'Gallery details could not be saved.' }) }
    finally { setBusy(false) }
  }

  async function removeGalleryImage(image: ProjectImageRow) {
    if (!window.confirm('Remove this image from the project gallery?')) return
    setBusy(true)
    try { await deleteAdminChildRow('project_images', image.id); setImages((current) => current.filter((item) => item.id !== image.id)); setMessage({ tone: 'success', text: 'Gallery image removed.' }) }
    catch { setMessage({ tone: 'error', text: 'Gallery image could not be removed.' }) }
    finally { setBusy(false) }
  }

  async function saveSpecification(spec: SpecificationDraft) {
    setBusy(true); setMessage(null)
    try {
      const saved = await saveAdminSpecification({ ...(spec.id.startsWith('new-') ? {} : { id: spec.id }), project_id: projectId!, title: spec.title.trim() || 'Specification', details: textLines(spec.detailsText), icon: spec.icon || null, display_order: spec.display_order })
      setSpecifications((current) => current.map((item) => item.localId === spec.localId ? { ...saved, detailsText: saved.details.join('\n'), localId: saved.id } : item).sort((a, b) => a.display_order - b.display_order))
      setMessage({ tone: 'success', text: 'Specification saved.' })
    } catch { setMessage({ tone: 'error', text: 'Specification could not be saved.' }) }
    finally { setBusy(false) }
  }

  async function removeSpecification(spec: SpecificationDraft) {
    if (spec.id.startsWith('new-')) { setSpecifications((current) => current.filter((item) => item.localId !== spec.localId)); return }
    if (!window.confirm(`Remove “${spec.title}”?`)) return
    setBusy(true)
    try { await deleteAdminChildRow('specifications', spec.id); setSpecifications((current) => current.filter((item) => item.id !== spec.id)); setMessage({ tone: 'success', text: 'Specification removed.' }) }
    catch { setMessage({ tone: 'error', text: 'Specification could not be removed.' }) }
    finally { setBusy(false) }
  }

  async function saveLandmark(landmark: LandmarkDraft) {
    setBusy(true); setMessage(null)
    try {
      const saved = await saveAdminLandmark({ ...(landmark.id.startsWith('new-') ? {} : { id: landmark.id }), project_id: projectId!, name: landmark.name.trim() || 'Nearby place', category: landmark.category, distance_text: landmark.distance_text, display_order: landmark.display_order })
      setLandmarks((current) => current.map((item) => item.localId === landmark.localId ? { ...saved, localId: saved.id } : item).sort((a, b) => a.display_order - b.display_order))
      setMessage({ tone: 'success', text: 'Landmark saved.' })
    } catch { setMessage({ tone: 'error', text: 'Landmark could not be saved.' }) }
    finally { setBusy(false) }
  }

  async function removeLandmark(landmark: LandmarkDraft) {
    if (landmark.id.startsWith('new-')) { setLandmarks((current) => current.filter((item) => item.localId !== landmark.localId)); return }
    if (!window.confirm(`Remove “${landmark.name}”?`)) return
    setBusy(true)
    try { await deleteAdminChildRow('nearby_landmarks', landmark.id); setLandmarks((current) => current.filter((item) => item.id !== landmark.id)); setMessage({ tone: 'success', text: 'Landmark removed.' }) }
    catch { setMessage({ tone: 'error', text: 'Landmark could not be removed.' }) }
    finally { setBusy(false) }
  }

  if (isLoading || (Boolean(id) && !detail && !loadError)) return <ProjectEditorSkeleton />
  if (loadError) return <main className="admin-project-editor"><div className="admin-data-error"><strong>{loadError}</strong><Link className="admin-button admin-button-secondary" to="/admin/projects">Back to projects</Link></div></main>

  return (
    <main className="admin-project-editor">
      <div className="admin-editor-heading"><div><Link className="editor-back-link" to="/admin/projects">← Projects</Link><p className="admin-eyebrow">Project workspace</p><h1>{isNew ? 'Add a project' : project.name || 'Edit project'}</h1><p>{isNew ? 'Start with the basic details. You can add media and project information after saving.' : `Editing ${project.name}${project.block_label ? ` · ${project.block_label}` : ''}`}</p></div>{!isNew && <a className="admin-button admin-button-secondary" href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">View on site ↗</a>}</div>
      <div className="editor-workspace">
        <nav className="editor-tabs" aria-label="Project editor sections">{editorTabs.map((tab) => <button key={tab.key} type="button" aria-pressed={activeTab === tab.key} disabled={isNew && tab.key !== 'basic'} className={activeTab === tab.key ? 'is-active' : ''} onClick={() => { setActiveTab(tab.key); setMessage(null) }}>{tab.label}{isNew && tab.key !== 'basic' && <span className="editor-lock" aria-hidden="true">⌑</span>}</button>)}</nav>
        <div className="editor-tab-content">
          {message && <p className={`editor-feedback editor-feedback-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</p>}
          {isNew && <p className="editor-draft-note">New projects are saved as unpublished drafts.</p>}
          {activeTab === 'basic' && <form onSubmit={saveBasicInfo}>
            <EditorCard title="Basic information" description="Name, status, project description and public contact details.">
              <div className="editor-fields-grid">
                <InputField label="Project name" value={project.name} required placeholder="e.g. Pratheek’s Sai Sadan" onChange={updateName} />
                <InputField label="Block label" value={project.block_label || ''} placeholder="e.g. Block A" onChange={updateBlock} />
                <InputField label="URL slug" value={project.slug} required placeholder="project-name-block-a" onChange={(value) => { setSlugManuallyEdited(true); setProjectField('slug', value) }} />
                <InputField label="Tagline" value={project.tagline || ''} placeholder="Short project tagline" onChange={(value) => setProjectField('tagline', value || null)} />
                <TextAreaField label="Short description" value={project.short_description || ''} rows={3} maxLength={500} placeholder="A concise introduction shown on project cards." onChange={(value) => setProjectField('short_description', value || null)} />
                <TextAreaField label="About this project" value={project.about_text || ''} rows={4} placeholder="Project overview for the detail page." onChange={(value) => setProjectField('about_text', value || null)} />
                <TextAreaField label="Highlights (one per line)" value={(project.highlights || []).join('\n')} rows={4} placeholder="Only add confirmed project details." onChange={(value) => setProjectField('highlights', textLines(value))} />
              </div>
            </EditorCard>
            <EditorCard title="Status and visibility" description="Choose the project status and how it appears across the public site.">
              <div className="editor-fields-grid editor-fields-compact">
                <label className="editor-field">Status<select value={project.status} onChange={(event) => setProjectField('status', event.target.value as ProjectStatus)}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></label>
                <InputField label="Display order" type="number" value={project.display_order} onChange={(value) => setProjectField('display_order', Number(value) || 0)} />
                <label className="editor-checkbox"><input type="checkbox" checked={project.is_published} onChange={(event) => setProjectField('is_published', event.target.checked)} /><span><strong>Published</strong><small>Visible on the public website</small></span></label>
                <label className="editor-checkbox"><input type="checkbox" checked={project.is_featured} onChange={(event) => setProjectField('is_featured', event.target.checked)} /><span><strong>Featured</strong><small>Show in the home page featured section</small></span></label>
              </div>
            </EditorCard>
            <EditorCard title="Location and contact" description="Public address, directions details and project-specific contact options.">
              <div className="editor-fields-grid">
                <InputField label="Locality" value={project.locality || ''} onChange={(value) => setProjectField('locality', value || null)} />
                <InputField label="City" value={project.city || ''} onChange={(value) => setProjectField('city', value || null)} />
                <InputField label="Pincode" value={project.pincode || ''} onChange={(value) => setProjectField('pincode', value || null)} />
                <InputField label="Possession date" value={project.possession_date || ''} placeholder="Only if confirmed" onChange={(value) => setProjectField('possession_date', value || null)} />
                <TextAreaField label="Full address" value={project.address || ''} rows={3} onChange={(value) => setProjectField('address', value || null)} />
                <div className="editor-field editor-field-wide admin-map-selection-box">
                  <div className="admin-map-selection-header">
                    <label className="admin-map-label">
                      <strong>Google Maps Location &amp; Pin Selection</strong>
                      <span>Address, landmark, coordinates (lat, lng), or pasted Google Maps link</span>
                    </label>
                    <div className="admin-map-actions">
                      <button
                        type="button"
                        className="admin-button admin-button-secondary admin-btn-xs"
                        onClick={autoFillMapFromAddress}
                        title="Generate search query from the address fields"
                      >
                        Auto-fill from address
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button-secondary admin-btn-xs"
                        onClick={useCurrentGpsLocation}
                        title="Use device GPS to set coordinates"
                      >
                        Pin current GPS
                      </button>
                      {effectiveMapQuery && (
                        <a
                          className="admin-button admin-button-secondary admin-btn-xs"
                          href={buildDirectionsUrl(effectiveMapQuery) || '#'}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open in Google Maps ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={project.maps_query || ''}
                    placeholder="e.g. Kranthi Nagar Bachupally Hyderabad, or 17.5342, 78.3685, or paste Maps link"
                    onChange={(event) => handleMapQueryChange(event.target.value)}
                  />
                  {activeMapEmbedUrl ? (
                    <div className="admin-map-preview-container">
                      <iframe
                        title="Location Map Preview"
                        src={activeMapEmbedUrl}
                        width="100%"
                        height="280"
                        loading="lazy"
                        style={{ border: 0, borderRadius: '8px', display: 'block' }}
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                      <p className="admin-map-hint">
                        Live preview of the map that appears on the public project page. Pan or zoom to verify the pin.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-map-empty-hint">
                      Enter an address, landmark, or coordinates above to preview the map location.
                    </div>
                  )}
                </div>
                <InputField label="RERA number" value={project.rera_number || ''} onChange={(value) => setProjectField('rera_number', value || null)} />
                <TextAreaField label="Contact phones (one per line)" value={(project.contact_phones || []).join('\n')} rows={3} onChange={(value) => setProjectField('contact_phones', textLines(value))} />
                <InputField label="WhatsApp number" value={project.whatsapp_number || ''} placeholder="Include country code if available" onChange={(value) => setProjectField('whatsapp_number', value || null)} />
              </div>
            </EditorCard>
            <div className="editor-save-row"><button className="admin-button admin-button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Create project' : 'Save basic info'}</button><Link className="admin-button admin-button-secondary" to="/admin/projects">Cancel</Link></div>
          </form>}

          {activeTab === 'theme' && <EditorCard title="Project theme" description="Optional page-only colours. Reset to company colours by leaving these values empty." action={<button type="button" className="admin-button admin-button-secondary" onClick={resetTheme}>Reset to company default</button>}>
            <div className="theme-editor-grid"><div className="theme-color-list">{(['theme_primary', 'theme_secondary', 'theme_accent', 'theme_background', 'theme_text'] as const).map((field, index) => { const labels = ['Primary', 'Secondary', 'Accent', 'Background', 'Text']; const label = labels[index]; return <label className="theme-color-field" key={field}><span>{label}<small>{project[field] || 'Using company default'}</small></span><input type="color" value={project[field] || companyPalette[field]} onChange={(event) => setProjectField(field, event.target.value)} aria-label={`${label} colour`} /></label> })}</div><div className="theme-live-preview" style={colorPreview}><p className="admin-eyebrow">Live preview</p><h3>{project.name || 'Your project name'}</h3><p>{project.tagline || 'Project tagline preview'}</p><span className="theme-preview-chip">{project.status}</span><button type="button">Enquire now</button><div className="theme-preview-card"><strong>About this project</strong><span>Headings and accents update as you choose colours.</span></div></div></div>
            <div className="editor-save-row"><button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => void saveTheme()}>{busy ? 'Saving…' : 'Save theme'}</button></div>
          </EditorCard>}

          {activeTab === 'media' && <EditorCard title="Project media" description="Upload JPG, PNG or WebP images up to 20 MB; large images are resized in your browser. PDF brochures may be up to 20 MB.">
            {!projectId && <p className="editor-draft-note">Save Basic Info before uploading media.</p>}
            <div className="media-upload-grid">
              <MediaUploadCard title="Hero image" help="Shown at the top of the project page and on cards." type="image" url={project.hero_image_url} busy={uploading === 'hero'} onUpload={(file) => void uploadMedia('hero', file)} onRemove={() => void removeMedia('hero')} />
              <MediaUploadCard title="Project logo" help="Optional project mark or logo." type="image" url={project.logo_url} busy={uploading === 'logo'} onUpload={(file) => void uploadMedia('logo', file)} onRemove={() => void removeMedia('logo')} />
              <MediaUploadCard title="Brochure PDF" help="A public PDF brochure linked from floor plans." type="pdf" url={project.brochure_url} busy={uploading === 'brochure'} onUpload={(file) => void uploadMedia('brochure', file)} onRemove={() => void removeMedia('brochure')} />
              <MediaUploadCard title="Location map" help="Shown in the project location section." type="image" url={project.location_map_url} busy={uploading === 'location-map'} onUpload={(file) => void uploadMedia('location-map', file)} onRemove={() => void removeMedia('location-map')} />
            </div>
          </EditorCard>}

          {activeTab === 'units' && <EditorCard title="Unit types" description="Add floor plans, areas and room sizes for each apartment layout." action={<button type="button" className="admin-button admin-button-secondary" onClick={() => setUnits((current) => [...current, { id: `new-${crypto.randomUUID()}`, localId: `new-${crypto.randomUUID()}`, project_id: projectId!, name: '', bhk: null, facing: null, area_sqft: null, floor_plan_2d_url: null, floor_plan_3d_url: null, rooms: [], display_order: current.length }])}>＋ Add unit type</button>}>
            {units.length ? <div className="editor-record-list">{units.map((unit, index) => <section className="editor-record-card" key={unit.localId}><div className="editor-record-heading"><strong>{unit.name || `New unit type ${index + 1}`}</strong><button className="editor-text-danger" type="button" onClick={() => void removeUnit(unit)}>Remove</button></div><div className="editor-fields-grid editor-fields-compact"><InputField label="Name" value={unit.name} required onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, name: value } : item))} /><InputField label="BHK" type="number" min={1} value={unit.bhk ?? ''} onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, bhk: value ? Number(value) : null } : item))} /><InputField label="Facing" value={unit.facing || ''} onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, facing: value || null } : item))} /><InputField label="Area (sq ft)" type="number" min={0} value={unit.area_sqft ?? ''} onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, area_sqft: value ? Number(value) : null } : item))} /><InputField label="Display order" type="number" value={unit.display_order} onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, display_order: Number(value) || 0 } : item))} /></div>
                <div className="unit-upload-row">{(['floor_plan_2d_url', 'floor_plan_3d_url'] as const).map((field) => <label className="unit-plan-upload" key={field}><span>{field.includes('2d') ? '2D floor plan' : '3D floor plan'}</span>{unit[field] && <a href={unit[field] || undefined} target="_blank" rel="noreferrer">View current plan ↗</a>}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadUnitPlan(unit.localId, field, file); event.currentTarget.value = '' }} /></label>)}</div>
                <div className="editor-rooms-heading"><h4>Room sizes</h4><button type="button" className="editor-link-button" onClick={() => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, rooms: [...item.rooms, { name: '', size: '' }] } : item))}>＋ Add room</button></div>
                {unit.rooms.length > 0 && <div className="editor-room-list">{unit.rooms.map((room, roomIndex) => <div className="editor-room-row" key={`${unit.localId}-room-${roomIndex}`}><InputField label="Room" value={room.name} onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, rooms: item.rooms.map((entry, index) => index === roomIndex ? { ...entry, name: value } : entry) } : item))} /><InputField label="Size" value={room.size} onChange={(value) => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, rooms: item.rooms.map((entry, index) => index === roomIndex ? { ...entry, size: value } : entry) } : item))} /><button type="button" className="editor-text-danger" onClick={() => setUnits((current) => current.map((item) => item.localId === unit.localId ? { ...item, rooms: item.rooms.filter((_, index) => index !== roomIndex) } : item))} aria-label="Remove room">×</button></div>)}</div>}
                <div className="editor-record-actions"><button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => void saveUnit(unit)}>Save unit type</button></div>
              </section>)}</div> : <div className="editor-empty-state"><span aria-hidden="true">⌂</span><p>No unit types added yet.</p><button type="button" className="editor-link-button" onClick={() => setUnits([{ id: `new-${crypto.randomUUID()}`, localId: `new-${crypto.randomUUID()}`, project_id: projectId!, name: '', bhk: null, facing: null, area_sqft: null, floor_plan_2d_url: null, floor_plan_3d_url: null, rooms: [], display_order: 0 }])}>Add the first unit type</button></div>}
          </EditorCard>}

          {activeTab === 'gallery' && <EditorCard title="Project gallery" description="Upload project images and choose how each appears on the public detail page." action={<label className="admin-button admin-button-primary editor-upload-button">{uploading === 'gallery' ? 'Uploading…' : '＋ Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void addGalleryImage(file); event.currentTarget.value = '' }} /></label>}>
            <div className="gallery-upload-category"><label className="editor-field">Image category<select value={newGalleryCategory} onChange={(event) => setNewGalleryCategory(event.target.value as ProjectImageRow['category'])}><option value="gallery">Gallery</option><option value="exterior">Exterior</option><option value="amenity">Amenity</option><option value="typical_floor_plan">Typical floor plan</option></select></label><p>Images are compressed before upload when needed.</p></div>
            {images.length ? <div className="editor-gallery-list">{images.map((image) => <article className="editor-gallery-row" key={image.id}><img src={image.image_url} alt={image.caption || `${image.category.replaceAll('_', ' ')} preview`} loading="lazy" /><div className="editor-gallery-fields"><InputField label="Caption" value={image.caption || ''} onChange={(value) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, caption: value || null } : item))} /><label className="editor-field">Category<select value={image.category} onChange={(event) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, category: event.target.value as ProjectImageRow['category'] } : item))}><option value="exterior">Exterior</option><option value="typical_floor_plan">Typical floor plan</option><option value="gallery">Gallery</option><option value="amenity">Amenity</option></select></label><InputField label="Display order" type="number" value={image.display_order} onChange={(value) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, display_order: Number(value) || 0 } : item))} /><div className="editor-record-actions"><button className="admin-button admin-button-secondary" type="button" disabled={busy} onClick={() => void saveGalleryImage(image)}>Save</button><button className="editor-text-danger" type="button" disabled={busy} onClick={() => void removeGalleryImage(image)}>Remove</button><a href={image.image_url} target="_blank" rel="noreferrer">View original ↗</a></div></div></article>)}</div> : <div className="editor-empty-state"><span aria-hidden="true">▧</span><p>No gallery images yet. Choose a category, then upload an image.</p></div>}
          </EditorCard>}

          {activeTab === 'specifications' && <EditorCard title="Specifications" description="Add a title and one bullet point per line. Set display order to control the sequence." action={<button className="admin-button admin-button-secondary" type="button" onClick={() => setSpecifications((current) => [...current, { id: `new-${crypto.randomUUID()}`, localId: `new-${crypto.randomUUID()}`, project_id: projectId!, title: '', detailsText: '', icon: null, display_order: current.length }])}>＋ Add specification</button>}>
            {specifications.length ? <div className="editor-record-list">{specifications.map((spec) => <section className="editor-record-card" key={spec.localId}><div className="editor-record-heading"><strong>{spec.title || 'New specification'}</strong><button type="button" className="editor-text-danger" onClick={() => void removeSpecification(spec)}>Remove</button></div><div className="editor-fields-grid editor-fields-compact"><InputField label="Title" value={spec.title} onChange={(value) => setSpecifications((current) => current.map((item) => item.localId === spec.localId ? { ...item, title: value } : item))} /><InputField label="Icon name (optional)" value={spec.icon || ''} onChange={(value) => setSpecifications((current) => current.map((item) => item.localId === spec.localId ? { ...item, icon: value || null } : item))} /><InputField label="Display order" type="number" value={spec.display_order} onChange={(value) => setSpecifications((current) => current.map((item) => item.localId === spec.localId ? { ...item, display_order: Number(value) || 0 } : item))} /><TextAreaField label="Details (one per line)" value={spec.detailsText} rows={4} onChange={(value) => setSpecifications((current) => current.map((item) => item.localId === spec.localId ? { ...item, detailsText: value } : item))} /></div><div className="editor-record-actions"><button type="button" className="admin-button admin-button-primary" disabled={busy} onClick={() => void saveSpecification(spec)}>Save specification</button></div></section>)}</div> : <div className="editor-empty-state"><span aria-hidden="true">✳</span><p>No specifications added yet.</p><button type="button" className="editor-link-button" onClick={() => setSpecifications([{ id: `new-${crypto.randomUUID()}`, localId: `new-${crypto.randomUUID()}`, project_id: projectId!, title: '', detailsText: '', icon: null, display_order: 0 }])}>Add the first specification</button></div>}
          </EditorCard>}

          {activeTab === 'landmarks' && <EditorCard title="Nearby landmarks" description="Add nearby places and optional distance text. Set display order to control the sequence." action={<button className="admin-button admin-button-secondary" type="button" onClick={() => setLandmarks((current) => [...current, { id: `new-${crypto.randomUUID()}`, localId: `new-${crypto.randomUUID()}`, project_id: projectId!, name: '', category: null, distance_text: null, display_order: current.length }])}>＋ Add landmark</button>}>
            {landmarks.length ? <div className="editor-record-list">{landmarks.map((landmark) => <section className="editor-record-card editor-landmark-card" key={landmark.localId}><InputField label="Landmark name" value={landmark.name} onChange={(value) => setLandmarks((current) => current.map((item) => item.localId === landmark.localId ? { ...item, name: value } : item))} /><InputField label="Category" value={landmark.category || ''} placeholder="e.g. bank, supermarket, road" onChange={(value) => setLandmarks((current) => current.map((item) => item.localId === landmark.localId ? { ...item, category: value || null } : item))} /><InputField label="Distance text" value={landmark.distance_text || ''} placeholder="e.g. 1.2 km" onChange={(value) => setLandmarks((current) => current.map((item) => item.localId === landmark.localId ? { ...item, distance_text: value || null } : item))} /><InputField label="Display order" type="number" value={landmark.display_order} onChange={(value) => setLandmarks((current) => current.map((item) => item.localId === landmark.localId ? { ...item, display_order: Number(value) || 0 } : item))} /><div className="editor-record-actions"><button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => void saveLandmark(landmark)}>Save landmark</button><button className="editor-text-danger" type="button" disabled={busy} onClick={() => void removeLandmark(landmark)}>Remove</button></div></section>)}</div> : <div className="editor-empty-state"><span aria-hidden="true">⌖</span><p>No nearby landmarks added yet.</p><button type="button" className="editor-link-button" onClick={() => setLandmarks([{ id: `new-${crypto.randomUUID()}`, localId: `new-${crypto.randomUUID()}`, project_id: projectId!, name: '', category: null, distance_text: null, display_order: 0 }])}>Add the first landmark</button></div>}
          </EditorCard>}
        </div>
      </div>
    </main>
  )
}

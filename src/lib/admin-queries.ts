import { supabase } from './supabase'
import type { EnquiryRow, EnquiryStatus, NearbyLandmarkRow, ProjectImageRow, ProjectRow, ProjectStatus, SiteSettingsRow, SpecificationRow, UnitTypeRow } from './database.types'
import type { SiteSettings } from './site-settings'

export type AdminEnquiryPreview = Pick<EnquiryRow, 'id' | 'project_id' | 'name' | 'phone' | 'status' | 'created_at'> & { project_name: string | null }

export type AdminDashboardData = {
  counts: Record<ProjectStatus, number> & { total: number }
  enquiriesLast7Days: number
  latestEnquiries: AdminEnquiryPreview[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [projectResult, recentEnquiryResult, latestResult] = await Promise.all([
    supabase.from('projects').select('id,status'),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('enquiries').select('id,project_id,name,phone,status,created_at').order('created_at', { ascending: false }).limit(5),
  ])
  const error = projectResult.error || recentEnquiryResult.error || latestResult.error
  if (error) throw error

  const projectRows = projectResult.data ?? []
  const counts: AdminDashboardData['counts'] = { total: projectRows.length, ongoing: 0, upcoming: 0, completed: 0 }
  for (const project of projectRows) counts[project.status] += 1

  const latestRows = latestResult.data ?? []
  const projectIds = [...new Set(latestRows.flatMap((enquiry) => enquiry.project_id ? [enquiry.project_id] : []))]
  const namesById = new Map<string, string>()
  if (projectIds.length) {
    const { data: relatedProjects, error: relatedError } = await supabase.from('projects').select('id,name').in('id', projectIds)
    if (relatedError) throw relatedError
    for (const project of relatedProjects ?? []) namesById.set(project.id, project.name)
  }

  return {
    counts,
    enquiriesLast7Days: recentEnquiryResult.count ?? 0,
    latestEnquiries: latestRows.map((enquiry) => ({ ...enquiry, project_name: enquiry.project_id ? namesById.get(enquiry.project_id) ?? null : null })),
  }
}

export async function getAdminProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase.from('projects').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type AdminProjectDetail = ProjectRow & {
  unit_types: UnitTypeRow[]
  project_images: ProjectImageRow[]
  specifications: SpecificationRow[]
  nearby_landmarks: NearbyLandmarkRow[]
}

export async function getAdminProjectDetail(id: string): Promise<AdminProjectDetail | null> {
  const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!project) return null
  const [units, images, specifications, landmarks] = await Promise.all([
    supabase.from('unit_types').select('*').eq('project_id', id).order('display_order', { ascending: true }),
    supabase.from('project_images').select('*').eq('project_id', id).order('display_order', { ascending: true }),
    supabase.from('specifications').select('*').eq('project_id', id).order('display_order', { ascending: true }),
    supabase.from('nearby_landmarks').select('*').eq('project_id', id).order('display_order', { ascending: true }),
  ])
  const childError = units.error || images.error || specifications.error || landmarks.error
  if (childError) throw childError
  return { ...project, unit_types: units.data ?? [], project_images: images.data ?? [], specifications: specifications.data ?? [], nearby_landmarks: landmarks.data ?? [] }
}

export type ProjectWrite = Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>

const projectWriteKeys: (keyof ProjectWrite)[] = [
  'slug', 'name', 'block_label', 'tagline', 'short_description', 'about_text',
  'status', 'is_published', 'is_featured', 'display_order',
  'locality', 'city', 'address', 'pincode', 'maps_query', 'rera_number', 'possession_date',
  'contact_phones', 'whatsapp_number', 'hero_image_url', 'brochure_url', 'location_map_url', 'logo_url',
  'theme_primary', 'theme_secondary', 'theme_accent', 'theme_background', 'theme_text', 'highlights'
]

function sanitizeProjectWrite<T extends Partial<ProjectWrite>>(payload: T): T {
  const sanitized = {} as Record<string, unknown>
  for (const key of projectWriteKeys) {
    if (key in payload) {
      sanitized[key] = payload[key]
    }
  }
  return sanitized as T
}

export async function createAdminProject(project: ProjectWrite): Promise<ProjectRow> {
  const payload = sanitizeProjectWrite(project)
  const { data, error } = await supabase.from('projects').insert(payload).select('*').single()
  if (error) throw error
  return data
}

export async function updateAdminProjectRecord(id: string, project: ProjectWrite): Promise<ProjectRow> {
  const payload = sanitizeProjectWrite(project)
  const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function updateAdminProjectFields(id: string, updates: Partial<ProjectWrite>): Promise<ProjectRow> {
  const payload = sanitizeProjectWrite(updates)
  const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export type UnitTypeWrite = Omit<UnitTypeRow, 'id' | 'created_at'> & { id?: string }
export async function saveAdminUnitType(unit: UnitTypeWrite): Promise<UnitTypeRow> {
  const { id, ...values } = unit
  const result = id
    ? await supabase.from('unit_types').update(values).eq('id', id).select('*').single()
    : await supabase.from('unit_types').insert(values).select('*').single()
  if (result.error) throw result.error
  return result.data
}

export type ProjectImageWrite = Omit<ProjectImageRow, 'id' | 'created_at'> & { id?: string }
export async function saveAdminProjectImage(image: ProjectImageWrite): Promise<ProjectImageRow> {
  const { id, ...values } = image
  const result = id
    ? await supabase.from('project_images').update(values).eq('id', id).select('*').single()
    : await supabase.from('project_images').insert(values).select('*').single()
  if (result.error) throw result.error
  return result.data
}

export type SpecificationWrite = Omit<SpecificationRow, 'id'> & { id?: string }
export async function saveAdminSpecification(specification: SpecificationWrite): Promise<SpecificationRow> {
  const { id, ...values } = specification
  const result = id
    ? await supabase.from('specifications').update(values).eq('id', id).select('*').single()
    : await supabase.from('specifications').insert(values).select('*').single()
  if (result.error) throw result.error
  return result.data
}

export type LandmarkWrite = Omit<NearbyLandmarkRow, 'id'> & { id?: string }
export async function saveAdminLandmark(landmark: LandmarkWrite): Promise<NearbyLandmarkRow> {
  const { id, ...values } = landmark
  const result = id
    ? await supabase.from('nearby_landmarks').update(values).eq('id', id).select('*').single()
    : await supabase.from('nearby_landmarks').insert(values).select('*').single()
  if (result.error) throw result.error
  return result.data
}

export async function deleteAdminChildRow(table: 'unit_types' | 'project_images' | 'specifications' | 'nearby_landmarks', id: string): Promise<void> {
  const result = table === 'unit_types'
    ? await supabase.from('unit_types').delete().eq('id', id)
    : table === 'project_images'
      ? await supabase.from('project_images').delete().eq('id', id)
      : table === 'specifications'
        ? await supabase.from('specifications').delete().eq('id', id)
        : await supabase.from('nearby_landmarks').delete().eq('id', id)
  const { error } = result
  if (error) throw error
}

export type AdminProjectUpdate = Partial<Pick<ProjectRow, 'status' | 'is_published' | 'is_featured' | 'display_order'>>

export async function updateAdminProject(id: string, updates: AdminProjectUpdate): Promise<void> {
  const { error } = await supabase.from('projects').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteAdminProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export type AdminEnquiryRecord = EnquiryRow & { project_name: string | null }
export type AdminEnquiryFilters = { projectId?: string; status?: EnquiryStatus | 'all'; search?: string }

export async function getAdminEnquiries(filters: AdminEnquiryFilters, page = 1, pageSize = 25): Promise<{ rows: AdminEnquiryRecord[]; total: number }> {
  const from = Math.max(0, page - 1) * pageSize
  const to = from + pageSize - 1
  let query = supabase.from('enquiries').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (filters.projectId) query = query.eq('project_id', filters.projectId)
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  const term = filters.search?.trim().replace(/[%_,.()"\\]/g, '')
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
  const { data, count, error } = await query.range(from, to)
  if (error) throw error

  const rows = data ?? []
  const projectIds = [...new Set(rows.flatMap((row) => row.project_id ? [row.project_id] : []))]
  const projectNames = new Map<string, string>()
  if (projectIds.length) {
    const { data: projects, error: projectError } = await supabase.from('projects').select('id,name').in('id', projectIds)
    if (projectError) throw projectError
    for (const project of projects ?? []) projectNames.set(project.id, project.name)
  }
  return { rows: rows.map((row) => ({ ...row, project_name: row.project_id ? projectNames.get(row.project_id) ?? null : null })), total: count ?? 0 }
}

export async function getAllAdminEnquiries(filters: AdminEnquiryFilters): Promise<AdminEnquiryRecord[]> {
  const pageSize = 500
  const all: AdminEnquiryRecord[] = []
  let page = 1
  while (true) {
    const result = await getAdminEnquiries(filters, page, pageSize)
    all.push(...result.rows)
    if (result.rows.length < pageSize || all.length >= result.total) return all
    page += 1
  }
}

export async function updateAdminEnquiry(id: string, updates: Partial<Pick<EnquiryRow, 'status' | 'admin_notes'>>): Promise<void> {
  const { error } = await supabase.from('enquiries').update(updates).eq('id', id)
  if (error) throw error
}

export async function getAdminSiteSettings(): Promise<SiteSettingsRow> {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  if (!data) throw new Error('The company settings row was not found.')
  return data
}

export type SiteSettingsWrite = Omit<SiteSettings, 'updated_at'>
export async function saveAdminSiteSettings(settings: SiteSettingsWrite): Promise<SiteSettingsRow> {
  const { data, error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'id' }).select('*').single()
  if (error) throw error
  return data
}

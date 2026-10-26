import { supabase } from './supabase'
import type { EnquiryRow, NearbyLandmarkRow, ProjectImageRow, ProjectRow, SpecificationRow, UnitTypeRow } from './database.types'

export type PublicProject = ProjectRow & { unit_types: UnitTypeRow[] }
export type PublicProjectDetail = ProjectRow & {
  unit_types: UnitTypeRow[]
  project_images: ProjectImageRow[]
  specifications: SpecificationRow[]
  nearby_landmarks: NearbyLandmarkRow[]
}

function attachProjectDefaults<T extends ProjectRow>(
  project: T,
  units: UnitTypeRow[],
  images: ProjectImageRow[] = [],
): { project: T; units: UnitTypeRow[]; images: ProjectImageRow[] } {
  if (project.slug !== 'sai-sadan-block-a') {
    return { project, units, images }
  }

  const enrichedProject: T = {
    ...project,
    hero_image_url: project.hero_image_url || '/images/projects/sai-sadan/hero-building.png',
    location_map_url: project.location_map_url || '/images/projects/sai-sadan/location-map.png',
  }

  const enrichedUnits: UnitTypeRow[] = units.map((unit) => {
    const is2Bhk = unit.bhk === 2 || unit.name.toLowerCase().includes('2 bhk')
    const is3Bhk = unit.bhk === 3 || unit.name.toLowerCase().includes('3 bhk')
    return {
      ...unit,
      floor_plan_2d_url:
        unit.floor_plan_2d_url ||
        (is2Bhk ? '/images/projects/sai-sadan/unit-2bhk-2d.png' : is3Bhk ? '/images/projects/sai-sadan/unit-3bhk-2d.png' : null),
      floor_plan_3d_url:
        unit.floor_plan_3d_url ||
        (is2Bhk ? '/images/projects/sai-sadan/unit-2bhk-3d.png' : is3Bhk ? '/images/projects/sai-sadan/unit-3bhk-3d.png' : null),
    }
  })

  const hasTypicalPlan = images.some((img) => img.category === 'typical_floor_plan')
  let enrichedImages = [...images]
  if (!hasTypicalPlan) {
    enrichedImages = [
      {
        id: 'sai-sadan-typical-floor-plan',
        project_id: project.id,
        image_url: '/images/projects/sai-sadan/typical-floor-plan.jpg',
        caption: 'Typical Floor Plan (2 & 3 BHK)',
        category: 'typical_floor_plan',
        display_order: 1,
        created_at: project.created_at,
      },
      ...enrichedImages,
    ]
  }

  if (!enrichedImages.some((img) => img.category === 'exterior')) {
    enrichedImages.push({
      id: 'sai-sadan-exterior-elevation',
      project_id: project.id,
      image_url: '/images/projects/sai-sadan/building-elevation.png',
      caption: 'Building Elevation',
      category: 'exterior',
      display_order: 2,
      created_at: project.created_at,
    })
  }

  if (!enrichedImages.some((img) => img.caption === '3D Floor Plans')) {
    enrichedImages.push({
      id: 'sai-sadan-3d-floor-plans',
      project_id: project.id,
      image_url: '/images/projects/sai-sadan/3d-floor-plans.png',
      caption: '3D Floor Plans',
      category: 'gallery',
      display_order: 3,
      created_at: project.created_at,
    })
  }

  return { project: enrichedProject, units: enrichedUnits, images: enrichedImages }
}

export async function getPublishedProjects(): Promise<PublicProject[]> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  if (!projects?.length) return []

  const { data: units, error: unitError } = await supabase
    .from('unit_types')
    .select('*')
    .in('project_id', projects.map((project) => project.id))
    .order('display_order', { ascending: true })

  if (unitError) throw unitError
  const unitsByProject = new Map<string, UnitTypeRow[]>()
  for (const unit of units ?? []) {
    const existing = unitsByProject.get(unit.project_id) ?? []
    existing.push(unit)
    unitsByProject.set(unit.project_id, existing)
  }

  return projects.map((project) => {
    const rawUnits = unitsByProject.get(project.id) ?? []
    const { project: enrichedProject, units: enrichedUnits } = attachProjectDefaults(project, rawUnits)
    return { ...enrichedProject, unit_types: enrichedUnits }
  })
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublicProjectDetail | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) throw error
  if (!project) return null

  const [unitResult, imageResult, specificationResult, landmarkResult] = await Promise.all([
    supabase.from('unit_types').select('*').eq('project_id', project.id).order('display_order', { ascending: true }),
    supabase.from('project_images').select('*').eq('project_id', project.id).order('display_order', { ascending: true }),
    supabase.from('specifications').select('*').eq('project_id', project.id).order('display_order', { ascending: true }),
    supabase.from('nearby_landmarks').select('*').eq('project_id', project.id).order('display_order', { ascending: true }),
  ])

  const childError = unitResult.error || imageResult.error || specificationResult.error || landmarkResult.error
  if (childError) throw childError

  const { project: enrichedProject, units: enrichedUnits, images: enrichedImages } = attachProjectDefaults(
    project,
    unitResult.data ?? [],
    imageResult.data ?? [],
  )

  return {
    ...enrichedProject,
    unit_types: enrichedUnits,
    project_images: enrichedImages,
    specifications: specificationResult.data ?? [],
    nearby_landmarks: landmarkResult.data ?? [],
  }
}

export type NewEnquiry = Pick<EnquiryRow, 'name' | 'phone'> & {
  project_id: string | null
  email?: string | null
  unit_interest?: string | null
  message?: string | null
  source_page?: string | null
}

export async function createEnquiry(enquiry: NewEnquiry): Promise<void> {
  const { error } = await supabase.from('enquiries').insert({ ...enquiry, status: 'new' })
  if (error) throw error
}

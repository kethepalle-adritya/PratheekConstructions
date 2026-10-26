export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type ProjectStatus = 'upcoming' | 'ongoing' | 'completed'
export type EnquiryStatus = 'new' | 'contacted' | 'site_visit' | 'closed'
export type ImageCategory = 'exterior' | 'typical_floor_plan' | 'gallery' | 'amenity'

export type SiteSettingsRow = {
  id: number
  company_name: string
  tagline: string | null
  about_text: string | null
  phones: string[] | null
  email: string | null
  address: string | null
  whatsapp_number: string | null
  office_hours: string | null
  instagram_url: string | null
  facebook_url: string | null
  youtube_url: string | null
  footer_disclaimer: string | null
  updated_at: string
}

export type ProjectRow = {
  id: string
  slug: string
  name: string
  block_label: string | null
  tagline: string | null
  short_description: string | null
  about_text: string | null
  status: ProjectStatus
  is_published: boolean
  is_featured: boolean
  display_order: number
  locality: string | null
  city: string | null
  address: string | null
  pincode: string | null
  maps_query: string | null
  rera_number: string | null
  possession_date: string | null
  contact_phones: string[] | null
  whatsapp_number: string | null
  hero_image_url: string | null
  brochure_url: string | null
  location_map_url: string | null
  logo_url: string | null
  theme_primary: string | null
  theme_secondary: string | null
  theme_accent: string | null
  theme_background: string | null
  theme_text: string | null
  highlights: string[] | null
  created_at: string
  updated_at: string
}

export type UnitTypeRow = {
  id: string
  project_id: string
  name: string
  bhk: number | null
  facing: string | null
  area_sqft: number | null
  floor_plan_2d_url: string | null
  floor_plan_3d_url: string | null
  rooms: Json
  display_order: number
  created_at: string
}

export type ProjectImageRow = {
  id: string
  project_id: string
  image_url: string
  caption: string | null
  category: ImageCategory
  display_order: number
  created_at: string
}

export type SpecificationRow = {
  id: string
  project_id: string
  title: string
  details: string[]
  icon: string | null
  display_order: number
}

export type NearbyLandmarkRow = {
  id: string
  project_id: string
  name: string
  category: string | null
  distance_text: string | null
  display_order: number
}

export type EnquiryRow = {
  id: string
  project_id: string | null
  name: string
  phone: string
  email: string | null
  unit_interest: string | null
  message: string | null
  source_page: string | null
  status: EnquiryStatus
  admin_notes: string | null
  created_at: string
}

export type AdminUserRow = { user_id: string; created_at: string }

export type Database = {
  public: {
    Tables: {
      site_settings: Table<SiteSettingsRow, Partial<SiteSettingsRow>, Partial<SiteSettingsRow>>
      projects: Table<ProjectRow, Partial<ProjectRow> & Pick<ProjectRow, 'slug' | 'name'>, Partial<ProjectRow>>
      unit_types: Table<UnitTypeRow, Partial<UnitTypeRow> & Pick<UnitTypeRow, 'project_id' | 'name'>, Partial<UnitTypeRow>>
      project_images: Table<ProjectImageRow, Partial<ProjectImageRow> & Pick<ProjectImageRow, 'project_id' | 'image_url'>, Partial<ProjectImageRow>>
      specifications: Table<SpecificationRow, Partial<SpecificationRow> & Pick<SpecificationRow, 'project_id' | 'title'>, Partial<SpecificationRow>>
      nearby_landmarks: Table<NearbyLandmarkRow, Partial<NearbyLandmarkRow> & Pick<NearbyLandmarkRow, 'project_id' | 'name'>, Partial<NearbyLandmarkRow>>
      enquiries: Table<EnquiryRow, Partial<EnquiryRow> & Pick<EnquiryRow, 'name' | 'phone'>, Partial<EnquiryRow>>
      admin_users: Table<AdminUserRow, Partial<AdminUserRow> & Pick<AdminUserRow, 'user_id'>, Partial<AdminUserRow>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      project_status: ProjectStatus
      enquiry_status: EnquiryStatus
      image_category: ImageCategory
    }
    CompositeTypes: Record<string, never>
  }
}

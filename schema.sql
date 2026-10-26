-- ============ EXTENSIONS & ENUMS ============
create extension if not exists "pgcrypto";

create type project_status   as enum ('upcoming', 'ongoing', 'completed');
create type enquiry_status   as enum ('new', 'contacted', 'site_visit', 'closed');
create type image_category   as enum ('exterior', 'typical_floor_plan', 'gallery', 'amenity');

-- ============ ADMIN CONTROL ============
create table admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ SITE SETTINGS (single row, company level) ============
create table site_settings (
  id              int primary key default 1 check (id = 1),
  company_name    text not null default 'Pratheek Construction & Developers',
  tagline         text,
  about_text      text,
  phones          text[] default '{}',
  email           text,
  address         text,
  whatsapp_number text,
  office_hours    text,
  instagram_url   text,
  facebook_url    text,
  youtube_url     text,
  footer_disclaimer text,
  updated_at      timestamptz not null default now()
);
create trigger trg_site_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- ============ PROJECTS ============
create table projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  block_label     text,                        -- e.g. 'Block A'
  tagline         text,
  short_description text,
  about_text      text,
  status          project_status not null default 'upcoming',
  is_published    boolean not null default false,
  is_featured     boolean not null default false,
  display_order   int not null default 0,

  locality        text,
  city            text default 'Hyderabad',
  address         text,
  pincode         text,
  maps_query      text,                        -- used for the Google Maps directions link
  rera_number     text,
  possession_date text,

  contact_phones  text[] default '{}',
  whatsapp_number text,

  hero_image_url        text,
  brochure_url          text,
  location_map_url      text,
  logo_url              text,

  theme_primary    text,                       -- hex colours, null = company default
  theme_secondary  text,
  theme_accent     text,
  theme_background text,
  theme_text       text,

  highlights       text[] default '{}',        -- quick-fact chips
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_projects_status on projects(status, is_published, display_order);
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

-- ============ UNIT TYPES (2 BHK, 3 BHK, etc.) ============
create table unit_types (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  name             text not null,              -- '2 BHK East Facing'
  bhk              int,
  facing           text,
  area_sqft        int,
  floor_plan_2d_url text,
  floor_plan_3d_url text,
  rooms            jsonb not null default '[]'::jsonb,   -- [{"name":"Hall","size":"10′-0″ x 16′-0″"}]
  display_order    int not null default 0,
  created_at       timestamptz not null default now()
);
create index idx_unit_types_project on unit_types(project_id, display_order);

-- ============ PROJECT IMAGES ============
create table project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  image_url     text not null,
  caption       text,
  category      image_category not null default 'gallery',
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_project_images_project on project_images(project_id, category, display_order);

-- ============ SPECIFICATIONS ============
create table specifications (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  title         text not null,
  details       text[] not null default '{}',  -- one bullet per array item
  icon          text,                          -- optional icon name
  display_order int not null default 0
);
create index idx_specs_project on specifications(project_id, display_order);

-- ============ NEARBY LANDMARKS ============
create table nearby_landmarks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  category      text,                          -- bank, supermarket, apartment, road
  distance_text text,
  display_order int not null default 0
);
create index idx_landmarks_project on nearby_landmarks(project_id, display_order);

-- ============ ENQUIRIES (leads) ============
create table enquiries (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete set null,  -- null = general enquiry
  name          text not null check (char_length(name) between 2 and 100),
  phone         text not null check (char_length(phone) between 7 and 20),
  email         text check (email is null or char_length(email) <= 150),
  unit_interest text,
  message       text check (message is null or char_length(message) <= 1000),
  source_page   text,
  status        enquiry_status not null default 'new',
  admin_notes   text,
  created_at    timestamptz not null default now()
);
create index idx_enquiries_project on enquiries(project_id, created_at desc);
create index idx_enquiries_status on enquiries(status, created_at desc);

-- ============ ROW LEVEL SECURITY ============
alter table admin_users      enable row level security;
alter table site_settings    enable row level security;
alter table projects         enable row level security;
alter table unit_types       enable row level security;
alter table project_images   enable row level security;
alter table specifications   enable row level security;
alter table nearby_landmarks enable row level security;
alter table enquiries        enable row level security;

-- admin_users: only admins can see the list
create policy "admins read admin_users" on admin_users
  for select using (is_admin());

-- site_settings: public read, admin write
create policy "public read settings" on site_settings for select using (true);
create policy "admin write settings" on site_settings for all
  using (is_admin()) with check (is_admin());

-- projects: public sees published only, admin sees and edits all
create policy "public read published projects" on projects
  for select using (is_published = true);
create policy "admin all projects" on projects for all
  using (is_admin()) with check (is_admin());

-- child tables: public reads rows of published projects only
create policy "public read unit_types" on unit_types for select using (
  exists (select 1 from projects p where p.id = project_id and p.is_published));
create policy "admin all unit_types" on unit_types for all
  using (is_admin()) with check (is_admin());

create policy "public read project_images" on project_images for select using (
  exists (select 1 from projects p where p.id = project_id and p.is_published));
create policy "admin all project_images" on project_images for all
  using (is_admin()) with check (is_admin());

create policy "public read specifications" on specifications for select using (
  exists (select 1 from projects p where p.id = project_id and p.is_published));
create policy "admin all specifications" on specifications for all
  using (is_admin()) with check (is_admin());

create policy "public read landmarks" on nearby_landmarks for select using (
  exists (select 1 from projects p where p.id = project_id and p.is_published));
create policy "admin all landmarks" on nearby_landmarks for all
  using (is_admin()) with check (is_admin());

-- enquiries: anyone can submit, only admins can read or manage
create policy "public insert enquiries" on enquiries
  for insert to anon, authenticated with check (status = 'new');
create policy "admin read enquiries" on enquiries for select using (is_admin());
create policy "admin update enquiries" on enquiries for update
  using (is_admin()) with check (is_admin());
create policy "admin delete enquiries" on enquiries for delete using (is_admin());

-- ============ STORAGE BUCKET FOR IMAGES / PDFs ============
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;

create policy "public read project-media" on storage.objects
  for select using (bucket_id = 'project-media');
create policy "admin upload project-media" on storage.objects
  for insert with check (bucket_id = 'project-media' and is_admin());
create policy "admin update project-media" on storage.objects
  for update using (bucket_id = 'project-media' and is_admin());
create policy "admin delete project-media" on storage.objects
  for delete using (bucket_id = 'project-media' and is_admin());

-- ============ SEED: COMPANY SETTINGS ============
insert into site_settings (id, company_name, tagline, phones, address, footer_disclaimer)
values (
  1,
  'Pratheek Construction & Developers',
  'The Lifestyle you Deserve!',
  array['98486 06111', '98491 78117'],
  'Plot # 70 & 71 Part, Road # 11, Kranthi Nagar, Near HDFC Bank, Bachupally, Hyderabad - 500 090',
  'This website is only a conceptual presentation of the projects and not a legal offering. The promoters reserve the right to make any changes deemed fit.'
);

-- ============ SEED: SAI SADAN BLOCK A ============
do $$
declare pid uuid;
begin
  insert into projects (
    slug, name, block_label, tagline, short_description, status, is_published, is_featured,
    display_order, locality, city, address, pincode, maps_query, contact_phones,
    whatsapp_number, highlights, hero_image_url, location_map_url,
    theme_primary, theme_secondary, theme_accent, theme_background, theme_text
  ) values (
    'sai-sadan-block-a', 'Pratheek''s Sai Sadan', 'Block A',
    'The Lifestyle you Deserve!',
    '2 & 3 BHK Apartment Homes @ Bachupally',
    'ongoing', true, true, 1,
    'Bachupally', 'Hyderabad',
    'Plot # 70 & 71 Part, Road # 11, Kranthi Nagar, Near HDFC Bank, Bachupally, Hyderabad - 500 090',
    '500090', 'Kranthi Nagar Bachupally Hyderabad',
    array['98486 06111', '98491 78117'],
    '919848606111',
    array['2 BHK - 1200 Sft', '3 BHK - 1530 Sft', '4-Passenger Lift', '30'' Wide East Road'],
    '/images/projects/sai-sadan/hero-building.png',
    '/images/projects/sai-sadan/location-map.png',
    '#3E8A9C', '#6B3A26', '#C0603A', '#F0E4D8', '#2B3F8C'
  ) returning id into pid;

  insert into unit_types (project_id, name, bhk, facing, area_sqft, floor_plan_2d_url, floor_plan_3d_url, rooms, display_order) values
  (pid, '2 BHK East Facing', 2, 'East', 1200,
   '/images/projects/sai-sadan/unit-2bhk-2d.png',
   '/images/projects/sai-sadan/unit-2bhk-3d.png',
   '[{"name":"Hall","size":"10′-0″ x 15′-9″"},
     {"name":"Kitchen / Dining","size":"10′-0″ x 16′-4½″"},
     {"name":"Bedroom 1","size":"10′-0″ x 12′-3″"},
     {"name":"Bedroom 2","size":"10′-0″ x 12′-0″"},
     {"name":"Puja","size":"6′ x 4′"},
     {"name":"Toilet 1","size":"5′ x 6′"},
     {"name":"Toilet 2","size":"5′ x 6′"},
     {"name":"Utility","size":"10′-0″ x 3′-4½″"},
     {"name":"Balcony","size":"4′-0″ wide"}]'::jsonb, 1),
  (pid, '3 BHK North Facing', 3, 'North', 1530,
   '/images/projects/sai-sadan/unit-3bhk-2d.png',
   '/images/projects/sai-sadan/unit-3bhk-3d.png',
   '[{"name":"Hall","size":"10′-0″ x 16′-0″"},
     {"name":"Dining","size":"12′-6″ x 12′-4½″"},
     {"name":"Kitchen","size":"11′-7½″ x 9′-3″"},
     {"name":"Puja","size":"4′-0″ x 9′-3″"},
     {"name":"Bedroom 1","size":"11′-7½″ x 15′-9″"},
     {"name":"Bedroom 2","size":"10′-0″ x 11′-4½″"},
     {"name":"Bedroom 3","size":"10′-0″ x 10′-0″"},
     {"name":"Toilet 1","size":"4′ x 7′"},
     {"name":"Toilet 2","size":"7′-7½″ x 4′"},
     {"name":"Toilet 3","size":"7′ x 4′"},
     {"name":"Utility","size":"12′-4½″ x 4′-0″"}]'::jsonb, 2);

  insert into project_images (project_id, image_url, caption, category, display_order) values
  (pid, '/images/projects/sai-sadan/typical-floor-plan.jpg', 'Typical Floor Plan (2 & 3 BHK)', 'typical_floor_plan', 1),
  (pid, '/images/projects/sai-sadan/building-elevation.png', 'Building Elevation', 'exterior', 2),
  (pid, '/images/projects/sai-sadan/3d-floor-plans.png', '3D Floor Plans', 'gallery', 3),
  (pid, '/images/projects/sai-sadan/location-map.png', 'Location Map', 'gallery', 4);

  insert into specifications (project_id, title, details, display_order) values
  (pid, 'Structure', array['R.C.C. framed structure','Steel TMT with ISI brand'], 1),
  (pid, 'Super Structure', array['External: clay red brick walls with cement mortar 4 inch / 9 inch','Internal: clay red brick walls with cement mortar 4 inch'], 2),
  (pid, 'Doors', array['Main door frame imported teak wood with teak wood shutter','Other doors imported teak wood frames with flush shutters'], 3),
  (pid, 'Windows / French Doors', array['UPVC windows and sliding doors with glass, mosquito mesh and safety grills'], 4),
  (pid, 'Plastering', array['Two coats of cement mortar and two coats of plastering with sponge finish inside and outside'], 5),
  (pid, 'Kitchen', array['Granite counter top with stainless steel sink','Glazed ceramic tiles dado of 2 ft height from platform level'], 6),
  (pid, 'Sanitary', array['EWCs of Hindware / Cera or equivalent make (one western and one Indian commode)','Concealed CPVC of Ashirwad / Hindware or equivalent','PVC pipes Prince / Sudhakar or equivalent make','CP fittings of Hindware or equivalent make'], 7),
  (pid, 'Flooring', array['Vitrified tiles of 2 ft x 2 ft in all rooms except toilets','Toilets: glazed ceramic tile dados up to door height, anti-skid tile flooring','Utilities: ceramic tile dado up to 3 ft height','Attached balconies: anti-skid tiles 2 ft x 2 ft','Corridor and staircase: anti-skid tiles / granite flooring'], 8),
  (pid, 'Painting', array['Internal: putty finish with two coats of Birla / JK putty and two coats of Asian / Berger / Techno emulsion paints','External: texture finish with two coats of Asian / Berger / Techno exterior emulsion paint (weather shield paint if required)'], 9),
  (pid, 'Electrical', array['Concealed copper wiring of Sudhakar / Polycab or equivalent make','Power outlets for split AC units in all bedrooms and living room','Power outlets in kitchen for cooking range, refrigerator, microwave, mixer & grinder and water purifier','Power outlets for geysers in all bathrooms','Electrical fittings of Havells / Anchor / Roma or equivalent','3-phase power supply with 5 KVA for each flat','MCB provision with meter and boards','Power supply socket at utility area'], 10),
  (pid, 'TV, Internet & Telephone', array['TV points in living room and master bedroom only','Internet provision at one point in living and master bedroom only','Telephone point in living and master bedroom only'], 11),
  (pid, 'Security Systems', array['24 hours surveillance in cellar'], 12),
  (pid, 'Railing', array['Staircase railing stainless steel and other railing of SS / MS pipes as per design'], 13),
  (pid, 'Power / Generator Backup', array['100% power backup for common areas, common parking areas and lift','One tube light and one fan point in the living room of each flat'], 14),
  (pid, 'Lift', array['4-passenger lift of standard make with V3F drivers for smooth operation, energy saving and lower wear and tear, with ARD system or electrical invertor'], 15),
  (pid, 'Water Supply', array['Bore water will be provided to sump through overhead tank'], 16);

  insert into nearby_landmarks (project_id, name, category, display_order) values
  (pid, 'Bachupally Chourastha', 'junction', 1),
  (pid, 'HDFC Bank', 'bank', 2),
  (pid, 'ICICI Bank', 'bank', 3),
  (pid, 'S Mart', 'supermarket', 4),
  (pid, 'Vijetha Supermarket', 'supermarket', 5),
  (pid, 'Resinia Apartments', 'apartments', 6);
end $$;
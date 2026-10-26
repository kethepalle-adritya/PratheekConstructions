import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { LeafWatermark } from './components/LeafWatermark'
import { Navbar } from './components/Navbar'
import { BrandOrnament } from './components/BrandOrnament'
import { SiteSettingsProvider } from './components/SiteSettingsProvider'
import { HomePage } from './pages/HomePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { FloatingWhatsApp } from './components/FloatingWhatsApp'
import { AuthProvider } from './components/admin/AuthProvider'
import { AdminGate } from './components/admin/AdminGate'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminProjectEditorPage } from './pages/admin/AdminProjectEditorPage'

function PagePlaceholder({ title }: { title: string }) {
  return (
    <main className="placeholder-page">
      <LeafWatermark className="watermark placeholder-watermark" />
      <p className="eyebrow">A place to call your own</p>
      <h1>{title}</h1>
      <BrandOrnament className="section-ornament" />
      <p className="placeholder-copy">We’re preparing something thoughtful for you. Please check back soon.</p>
      <Link className="button button-teal" to="/projects">Explore our projects <span aria-hidden="true">↗</span></Link>
    </main>
  )
}

function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<PagePlaceholder title="Page not found" />} />
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminGate />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="projects/new" element={<AdminProjectEditorPage />} />
              <Route path="projects/:id" element={<AdminProjectEditorPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </SiteSettingsProvider>
  )
}

function PublicLayout() {
  return <><Navbar /><Outlet /><FloatingWhatsApp /><Footer /></>
}


export default App

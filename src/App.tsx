import { Link, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { LeafWatermark } from './components/LeafWatermark'
import { Navbar } from './components/Navbar'
import { BrandOrnament } from './components/BrandOrnament'
import { SiteSettingsProvider } from './components/SiteSettingsProvider'

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
      <Navbar />
      <Routes>
        <Route path="/" element={<PagePlaceholder title="Homes made for living" />} />
        <Route path="/projects" element={<PagePlaceholder title="Our projects" />} />
        <Route path="/projects/:slug" element={<PagePlaceholder title="A closer look at home" />} />
        <Route path="/about" element={<PagePlaceholder title="Built around what matters" />} />
        <Route path="/contact" element={<PagePlaceholder title="Let’s talk about home" />} />
        <Route path="/admin/*" element={<PagePlaceholder title="Admin sign in" />} />
        <Route path="*" element={<PagePlaceholder title="Page not found" />} />
      </Routes>
      <Footer />
    </SiteSettingsProvider>
  )
}

export default App

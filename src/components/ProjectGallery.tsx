import { useState } from 'react'
import type { ProjectImageRow } from '../lib/database.types'
import { BrandOrnament } from './BrandOrnament'
import { Lightbox } from './Lightbox'

type ProjectGalleryProps = { images: ProjectImageRow[]; projectName: string }

export function ProjectGallery({ images, projectName }: ProjectGalleryProps) {
  const galleryImages = images.filter((image) => ['exterior', 'gallery', 'amenity'].includes(image.category))
  const [activeImage, setActiveImage] = useState<ProjectImageRow | null>(null)
  if (!galleryImages.length) return null

  return (
    <section className="project-gallery-section" id="gallery">
      <div className="project-section-heading"><p className="eyebrow">A closer look</p><h2>Project gallery</h2><BrandOrnament className="section-ornament" /><p>Images shared for this project.</p></div>
      <div className="project-gallery-grid">{galleryImages.map((image) => <button className="gallery-image" key={image.id} type="button" onClick={() => setActiveImage(image)} aria-label={`View ${image.caption || projectName + ' image'}`}><img src={image.image_url} alt={image.caption || `${projectName} ${image.category.replaceAll('_', ' ')}`} loading="lazy" /><span className="gallery-image-caption">{image.caption || image.category.replaceAll('_', ' ')}</span><span className="gallery-expand" aria-hidden="true">↗</span></button>)}</div>
      {activeImage && <Lightbox src={activeImage.image_url} alt={activeImage.caption || `${projectName} ${activeImage.category.replaceAll('_', ' ')}`} onClose={() => setActiveImage(null)} />}
    </section>
  )
}

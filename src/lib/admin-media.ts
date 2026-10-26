import { supabase } from './supabase'

const MAX_IMAGE_INPUT_BYTES = 20 * 1024 * 1024
const MAX_IMAGE_OUTPUT_BYTES = 8 * 1024 * 1024
const MAX_PDF_BYTES = 20 * 1024 * 1024
const MAX_IMAGE_EDGE = 2200

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image processing failed. Please choose a different image.')), type, quality)
  })
}

export async function prepareProjectImage(file: File): Promise<File> {
  if (!imageTypes.has(file.type)) throw new Error('Choose a JPG, PNG or WebP image.')
  if (file.size > MAX_IMAGE_INPUT_BYTES) throw new Error('Images must be 20 MB or smaller.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    if (file.size <= MAX_IMAGE_OUTPUT_BYTES) return file
    throw new Error('This image could not be resized. Please choose a JPG, PNG or WebP file under 8 MB.')
  }

  const scale = Math.min(1, MAX_IMAGE_EDGE / bitmap.width, MAX_IMAGE_EDGE / bitmap.height)
  const shouldCompress = file.size > 1.5 * 1024 * 1024 || scale < 1
  if (!shouldCompress) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Your browser could not prepare this image for upload.')
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await canvasToBlob(canvas, 'image/webp', 0.86)
  if (blob.size > MAX_IMAGE_OUTPUT_BYTES) throw new Error('The resized image is still too large. Please choose a smaller image.')
  const filename = file.name.replace(/\.[^.]+$/, '') || 'project-image'
  return new File([blob], `${filename}.webp`, { type: 'image/webp', lastModified: Date.now() })
}

export function validateProjectPdf(file: File) {
  if (file.type !== 'application/pdf') throw new Error('Choose a PDF brochure.')
  if (file.size > MAX_PDF_BYTES) throw new Error('PDFs must be 20 MB or smaller.')
}

export async function uploadProjectMedia(projectId: string, slot: string, file: File): Promise<string> {
  const safeSlot = slot.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
  const path = `${projectId}/${safeSlot}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from('project-media').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('project-media').getPublicUrl(path)
  return data.publicUrl
}

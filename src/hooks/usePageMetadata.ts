import { useEffect } from 'react';

type PageMetadata = { title: string; description: string; image?: string; url?: string };

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, key); document.head.appendChild(tag); }
  tag.content = content;
}

export function usePageMetadata({ title, description, image, url }: PageMetadata) {
  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', url ?? window.location.href);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    if (image) { setMeta('property', 'og:image', image); setMeta('name', 'twitter:image', image); }
  }, [title, description, image, url]);
}

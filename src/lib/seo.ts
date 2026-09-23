// Kinoma Dynamic SEO & Metadata utility
export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'video.other' | 'video.episode' | 'video.tv_show';
  canonicalUrl?: string;
  schema?: Record<string, any>;
}

export function updateSEO({ title, description, image, type = 'website', canonicalUrl, schema }: SEOProps) {
  const fullTitle = title ? (title.toLowerCase().includes('kinoma') ? title : `${title} — Kinoma`) : 'Kinoma — Anime, Movies & Series';
  const defaultDesc = description || 'Discover anime, movies and series on Kinoma. Find something worth watching and keep your viewing experience simple.';
  const defaultImage = image || '/icon.svg';
  const url = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '/');

  document.title = fullTitle;

  const setMetaTag = (attrName: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaTag('name', 'description', defaultDesc);
  setMetaTag('name', 'robots', 'index, follow, max-image-preview:large');
  setMetaTag('name', 'theme-color', '#0f0d0d');

  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', defaultDesc);
  setMetaTag('property', 'og:image', defaultImage);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:site_name', 'Kinoma');

  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', defaultDesc);
  setMetaTag('name', 'twitter:image', defaultImage);

  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', url);

  const schemaId = 'kinoma-schema-structured-data';
  let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = schemaId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kinoma',
    url: origin || '/',
    logo: origin ? `${origin}/icon.svg` : '/icon.svg',
    description: defaultDesc,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin || ''}/search?keyword={search_term_string}` },
      'query-input': 'required name=search_term_string'
    }
  };

  scriptEl.textContent = JSON.stringify(schema || defaultSchema);
}

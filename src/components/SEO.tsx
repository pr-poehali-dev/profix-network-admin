// SEO-теги страниц формируются в head() маршрутов через seoHead() —
// так они попадают в HTML уже при серверном рендере.
// Компонент <SEO> оставлен для совместимости со страницами и ничего не рендерит.

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  schema?: object;
}

const BASE = "ПРОФИКС — IT-сервис в Якутске";
const SITE_URL = "https://pfx.su";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

// Базовая Schema.org для компании — добавляется на всех страницах
const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "ООО «ПРОФИКС»",
  "alternateName": "ProFiX",
  "url": SITE_URL,
  "logo": DEFAULT_IMAGE,
  "image": DEFAULT_IMAGE,
  "description": "IT-сервис и автоматизация бизнеса в Якутске: внедрение 1С, торговое оборудование, ремонт компьютеров, видеонаблюдение, монтаж сетей",
  "telephone": "+7-914-272-71-87",
  "email": "727187@it-profix.ru",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ул. Халтурина, 6",
    "addressLocality": "Якутск",
    "addressRegion": "Республика Саха (Якутия)",
    "postalCode": "677009",
    "addressCountry": "RU"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "62.0286",
    "longitude": "129.7325"
  },
  "areaServed": [
    { "@type": "City", "name": "Якутск" },
    { "@type": "AdministrativeArea", "name": "Республика Саха (Якутия)" }
  ],
  "serviceType": [
    "Внедрение 1С", "Обслуживание онлайн-касс", "Ремонт компьютеров",
    "Видеонаблюдение", "Монтаж сетей", "Заправка картриджей",
    "Продажа ТСД", "Регистрация ККТ"
  ],
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "sameAs": [
    `${SITE_URL}`
  ]
};

export function seoHead({ title, description, keywords, canonical, image, type = "website", publishedTime, schema }: SEOProps) {
  const fullTitle = `${title} | ${BASE}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;
  const pageSchema = schema || LOCAL_BUSINESS_SCHEMA;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      ...(keywords ? [{ name: "keywords", content: keywords }] : []),
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "author", content: "ПРОФИКС" },
      { name: "geo.region", content: "RU-SA" },
      { name: "geo.placename", content: "Якутск" },
      { name: "geo.position", content: "62.0286;129.7325" },
      { name: "ICBM", content: "62.0286, 129.7325" },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:locale", content: "ru_RU" },
      { property: "og:url", content: canonicalUrl },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:site_name", content: "ПРОФИКС" },
      ...(publishedTime ? [{ property: "article:published_time", content: publishedTime }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(pageSchema) }],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SEO = (_props: SEOProps) => null;

export default SEO;

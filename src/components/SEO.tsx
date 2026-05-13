import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  schema?: object;
}

const BASE = "ProFiX — IT-сервис в Якутске";
const SITE_URL = "https://pfx.su";
const DEFAULT_IMAGE = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png";

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

const SEO = ({ title, description, keywords, canonical, image, type = "website", publishedTime, schema }: SEOProps) => {
  const fullTitle = `${title} | ${BASE}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;

  const pageSchema = schema || LOCAL_BUSINESS_SCHEMA;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="author" content="ProFiX" />
      <meta name="geo.region" content="RU-SA" />
      <meta name="geo.placename" content="Якутск" />
      <meta name="geo.position" content="62.0286;129.7325" />
      <meta name="ICBM" content="62.0286, 129.7325" />
      <html lang="ru" />

      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="ProFiX" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
    </Helmet>
  );
};

export default SEO;

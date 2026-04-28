import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
}

const BASE = "ProFiX — IT-сервис в Якутске";
const SITE_URL = "https://it-profix.ru";

const SEO = ({ title, description, keywords, canonical }: SEOProps) => {
  const fullTitle = `${title} | ${BASE}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <html lang="ru" />

      {canonical && <link rel="canonical" href={`${SITE_URL}${canonical}`} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ru_RU" />
      {canonical && <meta property="og:url" content={`${SITE_URL}${canonical}`} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default SEO;

import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesAboutSection from "@/components/ServicesAboutSection";
import PartnersSection from "@/components/PartnersSection";
import ContactFooter from "@/components/ContactFooter";
import ChatWidget from "@/components/ChatWidget";
import ReviewsSection from "@/components/ReviewsSection";
import MapSection from "@/components/MapSection";
import ShopPreview from "@/components/ShopPreview";
import { useSiteContent } from "@/hooks/useSiteContent";

const DEFAULT_ORDER = [
  { key: "hero",     visible: true },
  { key: "carousel", visible: true },
  { key: "services", visible: true },
  { key: "onec",     visible: true },
  { key: "partners", visible: true },
  { key: "about",    visible: true },
  { key: "reviews",  visible: true },
  { key: "map",      visible: true },
];

const Index = () => {
  const [activeSection, setActiveSection] = useState("Главная");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", topic: "", problem: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const { json } = useSiteContent();
  const blocksOrder = json<{key:string;visible:boolean}[]>("home.blocks_order", DEFAULT_ORDER);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (section: string) => {
    setActiveSection(section);
    setMenuOpen(false);
    const id =
      section === "Главная" ? "hero"
      : section === "Услуги" ? "services"
      : section === "1С" ? "1c"
      : section === "О компании" ? "about"
      : "contacts";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://functions.poehali.dev/d9dfa652-a0b7-4233-ba59-2efd338c4f10", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Не удалось отправить. Попробуйте позже.");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: "", phone: "", email: "", topic: "", problem: "" });
  };

  function renderBlock(key: string) {
    switch (key) {
      case "hero":
        return (
          <HeroSection
            key="hero"
            carouselIdx={carouselIdx}
            onSetCarouselIdx={setCarouselIdx}
            onScrollTo={scrollTo}
          />
        );
      case "carousel":
      case "services":
      case "onec":
      case "about":
        return <ServicesAboutSection key="services" />;
      case "partners":
        return <PartnersSection key="partners" />;
      case "reviews":
        return <ReviewsSection key="reviews" />;
      case "map":
        return <MapSection key="map" />;
      default:
        return null;
    }
  }

  const rendered = new Set<string>();

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <SEO
        title="IT-сервис и автоматизация бизнеса"
        description="ProFiX в Якутске — внедрение 1С, торговое оборудование (кассы, ТСД), ремонт компьютеров, видеонаблюдение, монтаж сетей, заправка картриджей."
        keywords="1С Якутск, онлайн-касса Якутск, ТСД, ремонт компьютеров Якутск, видеонаблюдение Якутск"
        canonical="/"
      />
      <Navbar
        scrolled={scrolled}
        activeSection={activeSection}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(!menuOpen)}
        onScrollTo={scrollTo}
      />

      {/* Блоки в управляемом порядке */}
      {blocksOrder
        .filter(b => b.visible)
        .map(b => {
          // ServicesAboutSection рендерится один раз для группы carousel/services/onec/about
          const renderKey = ["carousel","services","onec","about"].includes(b.key) ? "services" : b.key;
          if (rendered.has(renderKey)) return null;
          rendered.add(renderKey);
          return renderBlock(renderKey);
        })
      }

      {/* Магазин — всегда */}
      <ShopPreview />

      {/* Форма контактов/футер — всегда последний */}
      <ContactFooter
        formData={formData}
        submitted={submitted}
        loading={loading}
        error={error}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
      <ChatWidget />
    </div>
  );
};

export default Index;

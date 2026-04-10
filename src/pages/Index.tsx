import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection, { carouselSlides } from "@/components/HeroSection";
import ServicesAboutSection from "@/components/ServicesAboutSection";
import PartnersSection from "@/components/PartnersSection";
import ContactFooter from "@/components/ContactFooter";
import ChatWidget from "@/components/ChatWidget";

const Index = () => {
  const [activeSection, setActiveSection] = useState("Главная");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", topic: "", problem: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIdx((i) => (i + 1) % carouselSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <Navbar
        scrolled={scrolled}
        activeSection={activeSection}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(!menuOpen)}
        onScrollTo={scrollTo}
      />
      <HeroSection
        carouselIdx={carouselIdx}
        onSetCarouselIdx={setCarouselIdx}
        onScrollTo={scrollTo}
      />
      <ServicesAboutSection />
      <PartnersSection />
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
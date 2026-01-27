import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";
import { ValuePropositions } from "@/components/home/ValuePropositions";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PreviewSection } from "@/components/home/PreviewSection";
import { FooterReassurance } from "@/components/home/FooterReassurance";

const Home = () => {
  const navigate = useNavigate();
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const handleStartExploring = () => {
    navigate("/questionnaire");
  };

  const handleHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        onStartExploring={handleStartExploring}
        onHowItWorks={handleHowItWorks}
      />
      <ValuePropositions />
      <HowItWorksSection ref={howItWorksRef} />
      <PreviewSection />
      <FooterReassurance />
    </div>
  );
};

export default Home;

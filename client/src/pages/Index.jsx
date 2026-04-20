import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { CrossPlatform } from "@/components/landing/CrossPlatform";
import { DashboardPreviews } from "@/components/landing/DashboardPreviews";
import { Advanced } from "@/components/landing/Advanced";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <CrossPlatform />
        <DashboardPreviews />
        <Advanced />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

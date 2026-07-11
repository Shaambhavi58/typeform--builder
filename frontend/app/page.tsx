import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#2b222d] text-white">
      <Navbar />
      <Hero />
      <FeatureCards />
      <Footer />
    </main>
  );
}
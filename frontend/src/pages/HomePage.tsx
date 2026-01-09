import HeroSection from "../sections/HeroSection";
import FeaturesSection from "../sections/FeaturesSection";
import TestimonialSection from "../sections/TestimonialSection";
import PricingSection from "../sections/PricingSection";
import ContactSection from "../sections/ContactSection";
import CTASection from "../sections/CTASection";
import SEO from "../components/SEO";
import FloatingLines from "../components/FloatingLines";

export default function HomePage() {
    return (
        <div className="relative">
            <div className="fixed inset-0 -z-10">
                <FloatingLines />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <SEO
                title="Thumby - AI YouTube Thumbnail Generator | Create Stunning Thumbnails"
                description="Generate eye-catching YouTube thumbnails with AI. Create professional, engaging thumbnails in seconds. Boost your video CTR with Thumby's intelligent design tool."
                keywords={[
                    "YouTube thumbnail generator",
                    "AI thumbnail maker",
                    "YouTube thumbnail creator",
                    "thumbnail design tool",
                    "AI video thumbnail",
                    "YouTube CTR optimizer",
                    "thumbnail generator online",
                    "free thumbnail maker",
                    "YouTube video thumbnail",
                    "AI design tool",
                    "content creator tools",
                    "video marketing",
                    "thumbnail optimization",
                    "YouTube growth tool",
                    "automated thumbnail design",
                ]}
                ogImage="https://thumby.app/og-image.png"
                canonicalUrl="https://thumby.app"
                twitterHandle="@thumbyapp"
            />
            <HeroSection />
            <FeaturesSection />
            <TestimonialSection />
            <PricingSection />
            <ContactSection />
            <CTASection />
        </div>
    );
}
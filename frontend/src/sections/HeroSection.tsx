import { CheckIcon, ChevronRightIcon, VideoIcon } from "lucide-react";
import TiltedImage from "../components/TiltImage";
import RotatingText from "../components/RotatingText";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HeroSection() {

    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const specialFeatures = [
        "No Design Skills Required",
        "Fast Generation",
        "High CTR Templates",
    ];

    return (
        <div className="relative top-48 flex flex-col items-center justify-center px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="absolute top-30 -z-10 left-1/4 size-72 blur-[300px]" style={{backgroundColor: '#e947f5', opacity: 0.3}}></div>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
            >
                <Link to={isLoggedIn ? "/generate" : "/login"} className="group flex items-center gap-2 rounded-full p-1 pr-3" style={{color: '#e947f5', backgroundColor: 'rgba(233, 71, 245, 0.1)'}}>
                <span className="text-white text-xs px-3.5 py-1 rounded-full" style={{backgroundColor: '#e947f5'}}>
                    NEW
                </span>
                <p className="flex items-center gap-1 text-white">
                    <span>Generate your first thumbnail for free! </span>
                    <ChevronRightIcon size={16} className="group-hover:translate-x-0.5 transition duration-300" />
                </p>
                </Link>
            </motion.div>
            <motion.h1 className="text-5xl/17 md:text-6xl/21 font-medium max-w-3xl text-center"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
            >
                AI Thumbnail Generator for your <span className="text-nowrap border-b-2 border-indigo-500 pb-1">
                  <RotatingText 
                    texts={["Reels.", "Videos."]} 
                    rotationInterval={3000}
                    staggerDuration={0.05}
                    mainClassName="inline-block"
                  />
                </span>
            </motion.h1>
            <motion.p className="text-base text-center text-slate-200 max-w-lg mt-6"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
            >
               Stop wasting hours on design. Get high-quality thumbnails in seconds.</motion.p>
            <motion.div className="flex items-center gap-4 mt-8"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
            >
                <button onClick={() => navigate('/generate')} className="text-white rounded-full px-7 h-11 transition-all" style={{backgroundColor: '#e947f5'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d926e8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e947f5'}>
                    Generate Now
                </button>
                <button className="flex items-center gap-2 transition rounded-full px-6 h-11" style={{borderColor: '#e947f5', borderWidth: '1px'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(233, 71, 245, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <VideoIcon strokeWidth={1} />
                    <span>See how it works</span>
                </button>
            </motion.div>

            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-14 mt-12">
                {specialFeatures.map((feature, index) => (
                    <motion.p className="flex items-center gap-2 " key={index}
                        initial={{ y: 30, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2, duration: 0.3 }}
                    >
                        <CheckIcon className="size-5" style={{color: '#e947f5'}} />
                        <span className="text-white/80">{feature}</span>
                    </motion.p>
                ))}
            </div>
            <TiltedImage />
        </div>
    );
}
'use client'
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {


    const navigate = useNavigate();

    return (
        <motion.div className="max-w-5xl py-16 mt-40 md:pl-20 md:w-full max-md:mx-4 md:mx-auto flex flex-col md:flex-row max-md:gap-6 items-center justify-between text-left rounded-2xl p-6 text-white" style={{background: 'linear-gradient(to bottom, rgba(233, 71, 245, 0.2), rgba(47, 75, 162, 0.2))'}}
            initial={{ y: 150, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
            <div>
                <motion.h1 className="text-4xl md:text-[46px] md:leading-15 font-semibold text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(to right, white, #e947f5)'}}
                    initial={{ y: 80, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
                >
                    Ready To Go Viral?
                </motion.h1>
                <motion.p className="text-transparent bg-clip-text text-lg" style={{backgroundImage: 'linear-gradient(to right, white, #e947f5)'}}
                    initial={{ y: 80, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, damping: 70, mass: 1 }}
                >
                    Join Thousands Of Creators Using AI To Boost Their CPR.
                </motion.p>
            </div>
            <motion.button onClick={() => navigate('/generate')} className="px-12 py-3 text-slate-800 bg-white hover:bg-slate-200 rounded-full text-sm mt-4"
                initial={{ y: 80, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                Generate Free Thumbnail
            </motion.button>
        </motion.div>
    );
}
import type { SectionTitleProps } from "../types";
import { motion } from "motion/react";

const colorMap = {
  pink: { text: 'text-pink-600', bg: 'bg-pink-950/70', border: 'border-pink-800' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-950/70', border: 'border-blue-800' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-950/70', border: 'border-purple-800' },
  green: { text: 'text-green-600', bg: 'bg-green-950/70', border: 'border-green-800' },
  orange: { text: 'text-orange-600', bg: 'bg-orange-950/70', border: 'border-orange-800' },
  cyan: { text: 'text-cyan-600', bg: 'bg-cyan-950/70', border: 'border-cyan-800' },
};

export default function SectionTitle({ text1, text2, text3, color = 'pink' }: SectionTitleProps) {
    const colors = colorMap[color];
    return (
        <>
            <motion.p className={`text-center font-medium ${colors.text} mt-28 px-10 py-2 rounded-full ${colors.bg} border ${colors.border} w-max mx-auto`}
                initial={{ y: 120, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
            >
                {text1}
            </motion.p>
            <motion.h3 className="text-3xl font-semibold text-center mx-auto mt-4"
                initial={{ y: 120, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                {text2}
            </motion.h3>
            <motion.p className="text-slate-300 text-center mt-2 max-w-xl mx-auto"
                initial={{ y: 120, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
            >
                {text3}
            </motion.p>
        </>
    );
}
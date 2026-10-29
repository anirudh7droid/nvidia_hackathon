"use client";

import { motion } from "framer-motion";

const ORBS = [
  {
    className: "-top-[20%] -left-[10%] size-[60vw]",
    gradient: "radial-gradient(circle, rgb(6 78 59 / 0.55) 0%, transparent 65%)",
    animate: { x: [0, 80, -40, 0], y: [0, 60, 20, 0], scale: [1, 1.1, 0.95, 1] },
    duration: 28,
  },
  {
    className: "-right-[15%] -bottom-[25%] size-[55vw]",
    gradient: "radial-gradient(circle, rgb(118 185 0 / 0.28) 0%, transparent 65%)",
    animate: { x: [0, -70, 30, 0], y: [0, -50, -10, 0], scale: [1, 0.92, 1.08, 1] },
    duration: 32,
  },
  {
    className: "top-[30%] left-[35%] size-[35vw]",
    gradient: "radial-gradient(circle, rgb(118 185 0 / 0.12) 0%, transparent 70%)",
    animate: { x: [0, 50, -60, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.9, 1] },
    duration: 24,
  },
];

/** Slow-breathing blurred glow orbs that sit behind the glass panels. */
export function BackgroundOrbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {ORBS.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          style={{ background: orb.gradient }}
          animate={orb.animate}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

import { motion as Motion } from 'motion/react';
import { fadeUpItem } from '@/lib/motion.js';

export function Reveal({ children, variants = fadeUpItem, ...props }) {
  return (
    <Motion.div initial="hidden" animate="visible" variants={variants} {...props}>
      {children}
    </Motion.div>
  );
}

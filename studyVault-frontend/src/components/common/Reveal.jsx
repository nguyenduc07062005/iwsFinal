import { motion as Motion } from 'motion/react';
import { fadeUpItem, subtleScaleIn } from '@/lib/motion.js';

/**
 * Reveal — wraps children in a smooth entrance animation.
 *
 * @param {"fadeUp"|"scaleIn"} preset  – animation preset name
 * @param {object}             variants – override with raw framer-motion variants
 */
export function Reveal({
  children,
  className,
  delay = 0,
  preset = 'fadeUp',
  variants,
  ...props
}) {
  const presetMap = {
    fadeUp: fadeUpItem,
    scaleIn: subtleScaleIn,
  };

  const resolvedVariants = variants || presetMap[preset] || fadeUpItem;

  // If a delay is provided, clone the variants with the delay added
  const finalVariants = delay > 0
    ? {
      ...resolvedVariants,
      visible: {
        ...resolvedVariants.visible,
        transition: {
          ...resolvedVariants.visible?.transition,
          delay,
        },
      },
    }
    : resolvedVariants;

  return (
    <Motion.div
      initial="hidden"
      animate="visible"
      variants={finalVariants}
      className={className}
      {...props}
    >
      {children}
    </Motion.div>
  );
}

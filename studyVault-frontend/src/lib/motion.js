/**
 * Centralized motion presets for Framer Motion (motion/react).
 * Import these in any component that needs smooth, consistent animations.
 */

/* ── Easing curves ─────────────────────────────────────── */
/** Apple-style spring-out curve — fast start, gentle landing */
export const defaultEase = [0.22, 1, 0.36, 1];

/** Emphasized ease-out for dramatic reveals */
export const emphasisEase = [0.16, 1, 0.3, 1];

/** Snappy micro-interaction curve */
export const snappyEase = [0.34, 1.56, 0.64, 1];

/** Smooth deceleration curve */
export const smoothEase = [0.25, 0.46, 0.45, 0.94];

/* ── Reusable spring configs ──────────────────────────── */
export const gentleSpring = { type: 'spring', stiffness: 260, damping: 26, mass: 0.8 };
export const bouncySpring = { type: 'spring', stiffness: 380, damping: 18, mass: 0.6 };
export const softSpring = { type: 'spring', stiffness: 180, damping: 22, mass: 1 };

/* ── Variant presets ──────────────────────────────────── */

/** Standard fade-up animation */
export const fadeUpItem = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.52,
      ease: emphasisEase,
    },
  },
};

/** Subtle scale-in with blur */
export const subtleScaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 16,
    filter: 'blur(6px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: emphasisEase,
    },
  },
};

/** Slide in from left */
export const slideInLeft = {
  hidden: { opacity: 0, x: -20, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: emphasisEase },
  },
};

/** Slide in from right */
export const slideInRight = {
  hidden: { opacity: 0, x: 20, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: emphasisEase },
  },
};

/** Pop-in effect — used for icons, badges, small elements */
export const popIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...bouncySpring },
  },
};

/** Elastic scale for buttons and interactive elements */
export const elasticScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...gentleSpring },
  },
};

/* ── Stagger containers ───────────────────────────────── */

export const staggerContainer = (delayChildren = 0.06) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: delayChildren,
      delayChildren: 0.04,
    },
  },
});

/** Fast stagger for list items */
export const fastStagger = staggerContainer(0.04);

/** Slow stagger for prominent sections */
export const slowStagger = staggerContainer(0.1);

/* ── Transition presets ───────────────────────────────── */

/** Standard page-level transition */
export const pageTransition = {
  initial: { opacity: 0, y: 20, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)' },
  transition: { duration: 0.45, ease: emphasisEase },
};

/** Modal overlay */
export const overlayTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: smoothEase },
};

/** Modal panel (content) */
export const modalPanelTransition = {
  initial: { opacity: 0, y: 30, scale: 0.97, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 16, scale: 0.97, filter: 'blur(4px)' },
  transition: { duration: 0.32, ease: emphasisEase },
};

/** Dropdown / popover menus */
export const dropdownTransition = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.2, ease: defaultEase },
};

/* ── Hover / tap presets for whileHover / whileTap ──── */

export const hoverLift = {
  whileHover: { y: -3, transition: { duration: 0.25, ease: defaultEase } },
  whileTap: { scale: 0.985, transition: { duration: 0.1 } },
};

export const hoverGlow = {
  whileHover: {
    y: -2,
    boxShadow: '0 20px 50px -24px rgba(143, 59, 50, 0.35)',
    transition: { duration: 0.3, ease: defaultEase },
  },
  whileTap: { scale: 0.98 },
};

export const buttonPulse = {
  whileHover: { scale: 1.03, transition: { duration: 0.2, ease: snappyEase } },
  whileTap: { scale: 0.97 },
};

/* ── List item animation factory ──────────────────────── */

export const listItemAnimation = (index, maxDelay = 0.2) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.38,
      delay: Math.min(index * 0.04, maxDelay),
      ease: emphasisEase,
    },
  },
});

export const gridItemAnimation = (index, maxDelay = 0.24) => ({
  initial: { opacity: 0, y: 18, scale: 0.97, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.42,
      delay: Math.min(index * 0.05, maxDelay),
      ease: emphasisEase,
    },
  },
});

export const defaultEase = [0.22, 1, 0.36, 1];

export const fadeUpItem = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: defaultEase,
    },
  },
};

export const subtleScaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 16,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: defaultEase,
    },
  },
};

export const staggerContainer = (delayChildren = 0.08) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: delayChildren,
      delayChildren: 0.04,
    },
  },
});

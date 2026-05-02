import { motion, AnimatePresence } from 'motion/react';
import { Library, Bot, Search, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import { emphasisEase } from '../lib/motion.js';
import studyIllustration from '../assets/study2.png';
import { Outlet } from 'react-router-dom';

const MotionDiv = motion.div;
const MotionImg = motion.img;

const AuthLayout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-slate-50 lg:h-screen lg:overflow-hidden">
      {/* Left Column: Form */}
      <div
        className="scrollbar-hide relative z-10 flex w-full items-center justify-center overflow-y-auto bg-white p-4 py-8 shadow-2xl sm:p-10 lg:w-1/2 lg:p-16"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="group mb-8 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent text-2xl text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
              <Library size={24} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-brand-600">
              StudyVault
            </span>
          </Link>

          <AnimatePresence mode="wait">
            <MotionDiv
              key={location.pathname}
              initial={{ opacity: 0, x: -20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: emphasisEase }}
            >
              <Outlet />
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Premium Visual Panel (Hidden on mobile) */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-slate-100 p-8 lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#edf2f7_54%,#fff4f1_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[length:44px_44px]" />

        {/* Main content */}
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
          {/* Hero illustration */}
          <MotionDiv
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: emphasisEase }}
            className="mb-5"
          >
            <div className="relative">
              <MotionImg
                src={studyIllustration}
                alt="StudyVault - Academic platform"
                className="h-72 w-72 rounded-3xl object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
          </MotionDiv>

          {/* Title and description */}
          <MotionDiv
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.25, ease: emphasisEase }}
            className="mb-5 text-center"
          >
            <h3 className="mb-2 text-3xl font-black leading-tight tracking-normal text-slate-950">
              Academic Platform{' '}
              <span className="bg-gradient-to-r from-brand-500 to-accent bg-clip-text text-transparent">
                Next Generation
              </span>
            </h3>
            <p className="mx-auto max-w-sm text-sm font-semibold leading-relaxed text-slate-600">
              Manage, organize, and access study materials anytime, anywhere.
            </p>
          </MotionDiv>

          {/* Feature cards */}
          <div className="grid w-full grid-cols-3 gap-4">
            {[
              {
                icon: Bot,
                title: 'AI study support',
                desc: 'Review assistance',
                color: 'from-brand-500 to-brand-600',
                delay: 0.4,
              },
              {
                icon: Search,
                title: 'Fast search',
                desc: 'Easy lookup',
                color: 'from-accent to-yellow-600',
                delay: 0.5,
              },
              {
                icon: ShieldCheck,
                title: 'Secure access',
                desc: 'Protected sign-in',
                color: 'from-emerald-500 to-teal-600',
                delay: 0.6,
              },
            ].map((feature, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, y: 18, scale: 0.95, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.45, delay: feature.delay, ease: emphasisEase }}
                whileHover={{ y: -5, scale: 1.04, transition: { duration: 0.25, ease: emphasisEase } }}
                className="group cursor-default"
              >
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-medium)]">
                  <div
                    className={cn(
                      'mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
                      feature.color,
                    )}
                  >
                    <feature.icon size={22} />
                  </div>
                  <h4 className="mb-0.5 text-sm font-bold text-slate-800">
                    {feature.title}
                  </h4>
                  <p className="text-xs font-semibold leading-tight text-slate-600">
                    {feature.desc}
                  </p>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;

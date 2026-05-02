import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import workspaceHeroAiImage from '../../assets/workspace-hero-ai.png';
import workspaceHeroFlowImage from '../../assets/workspace-hero-flow.png';
import workspaceHeroLibraryImage from '../../assets/workspace-hero-library.png';
import workspaceHeroOverviewImage from '../../assets/workspace-hero-overview.png';

const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionImg = motion.img;

const HERO_SLIDES = [
    {
        src: workspaceHeroOverviewImage,
        alt: 'StudyVault workspace overview screenshot',
        label: 'Overview',
        description: 'View all your documents, notes, and recent uploads at a glance.',
    },
    {
        src: workspaceHeroAiImage,
        alt: 'StudyVault AI-powered features preview',
        label: 'AI assistant',
        description: 'Ask questions, generate summaries, and explore your topics.',
    },
    {
        src: workspaceHeroLibraryImage,
        alt: 'StudyVault document library layout',
        label: 'Library',
        description: 'Organize your study library with folders, tags, and favorites.',
    },
    {
        src: workspaceHeroFlowImage,
        alt: 'Wide StudyVault upload and review workflow',
        label: 'Study flow',
        description: 'Track uploads, tags, and review context in one place.',
    },
];

/**
 * The hero section at the top of the workspace page.
 * Contains the search bar, metric tiles, and animated hero image carousel.
 *
 * @param {Object} props
 * @param {string} props.searchInput - Current search input value
 * @param {(e: Event) => void} props.onSearchInputChange - Search input change handler
 * @param {() => void} props.onApplySearch - Submit search handler
 * @param {() => void} props.onClearSearch - Clear search handler
 * @param {string} props.keyword - Active search keyword from URL
 * @param {Array} props.metrics - Array of { label, value, icon } metric tiles
 */
const WorkspaceHero = ({
    keyword,
    metrics,
    onApplySearch,
    onClearSearch,
    onSearchInputChange,
    searchInput,
}) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const currentSlide = HERO_SLIDES[activeSlide];

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
        }, 4500);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative mx-auto grid w-full max-w-[1480px] grid-cols-1 items-center gap-4 overflow-visible px-0 pb-5 pt-0 sm:pb-6 lg:min-h-[300px] lg:grid-cols-[minmax(0,1fr)_minmax(540px,44vw)] lg:pt-2 2xl:grid-cols-[minmax(0,1fr)_760px]"
        >
            <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600 shadow-sm">
                    <Sparkles size={14} />
                    Study workspace
                </div>

                <h1 className="workspace-hero-title pb-2 text-4xl font-black leading-[1.05] tracking-normal sm:whitespace-nowrap sm:text-5xl lg:text-[3.35rem] xl:text-[3.75rem]">
                    Study smarter
                </h1>

                <div className="relative mt-4 flex w-full max-w-3xl items-center rounded-[1.15rem] border border-brand-200 bg-white p-1.5 shadow-[0_20px_56px_-34px_rgba(66,53,48,0.65)] transition-all duration-300 focus-within:-translate-y-0.5 focus-within:border-brand-500 focus-within:shadow-[0_24px_68px_-34px_rgba(139,63,54,0.72),0_0_0_5px_rgba(198,90,70,0.12)]">
                    <div className="pl-5 pr-2 text-slate-500">
                        <Search size={19} />
                    </div>

                    <input
                        type="text"
                        placeholder="Search all documents..."
                        value={searchInput}
                        onChange={onSearchInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onApplySearch();
                        }}
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-left text-sm font-bold text-slate-800 outline-none placeholder:text-slate-500"
                    />

                    {searchInput || keyword ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            title="Clear search"
                            onClick={onClearSearch}
                            className="mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-brand-600"
                        >
                            <X size={16} />
                        </button>
                    ) : null}

                    <MotionButton
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onApplySearch}
                        className="sks-ai-glow-btn shrink-0 rounded-[0.95rem] bg-brand-900 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-600 sm:px-5"
                    >
                        Search
                    </MotionButton>
                </div>

                <div className="mt-3 flex w-full max-w-3xl flex-wrap gap-2">
                    {metrics.map(({ label, value, icon }, index) => (
                        <MotionDiv
                            key={label}
                            aria-label={`${label}: ${value}`}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.16 + index * 0.08, ease: 'easeOut' }}
                            className="workspace-metric-tile group min-h-[3.15rem] flex-1 basis-[104px] justify-center !rounded-[1rem] !px-2.5 !py-2 sm:basis-[160px] sm:justify-start sm:!px-3"
                        >
                            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-transform group-hover:scale-105 sm:flex">
                                {icon}
                            </span>
                            <span className="min-w-0 text-left">
                                <span className="hidden truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:block">
                                    {label}
                                </span>
                                <span className="block truncate text-sm font-black text-slate-900 sm:mt-0.5">
                                    {value}
                                </span>
                            </span>
                        </MotionDiv>
                    ))}
                </div>
            </div>

            <MotionDiv
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.12, ease: 'easeOut' }}
                className="workspace-visual-panel workspace-visual-panel--compact group hidden sm:block"
            >
                <AnimatePresence mode="wait">
                    <MotionImg
                        key={currentSlide.src}
                        src={currentSlide.src}
                        alt={currentSlide.alt}
                        initial={{ opacity: 0, scale: 1.01, y: 8 }}
                        animate={{ opacity: 1, scale: 1.01, y: 0 }}
                        exit={{ opacity: 0, scale: 1.03, y: -8 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        className="workspace-visual-image"
                    />
                </AnimatePresence>

                <div className="workspace-hero-dots">
                    {HERO_SLIDES.map((slide, index) => (
                        <button
                            key={slide.label}
                            type="button"
                            aria-label={`Show ${slide.label}`}
                            aria-current={activeSlide === index ? 'true' : undefined}
                            onClick={() => setActiveSlide(index)}
                            className={cn(
                                'h-2 rounded-full transition-all',
                                activeSlide === index
                                    ? 'w-8 bg-brand-600'
                                    : 'w-2 bg-slate-300 hover:bg-brand-300',
                            )}
                        />
                    ))}
                </div>
            </MotionDiv>
        </MotionDiv>
    );
};

export default WorkspaceHero;

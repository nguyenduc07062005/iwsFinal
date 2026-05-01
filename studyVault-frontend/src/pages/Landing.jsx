import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  FolderTree,
  Library,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StudyVaultMark from '../components/navigation/StudyVaultMark.jsx';
import studyHeroImage from '../assets/study.png';
import { isAuthenticated } from '../utils/auth.js';
import {
  landingFaq,
  landingFeatureCards,
  landingHero,
  landingProofPoints,
  landingSecurityPoints,
  landingWorkflowSteps,
} from './landingContent.js';

const iconMap = {
  FolderTree,
  Library,
  ShieldCheck,
  Sparkles,
};

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#security', label: 'Privacy' },
  { href: '#faq', label: 'FAQ' },
];

const LandingButton = ({ children, href, variant = 'primary' }) => {
  const className =
    variant === 'primary'
      ? 'bg-white text-[#8c4238] shadow-[0_18px_45px_-24px_rgba(255,255,255,0.75)] hover:bg-brand-50'
      : 'border border-white/50 bg-white/12 text-white backdrop-blur-xl hover:bg-white/20';

  return (
    <Link
      to={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition-all hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </Link>
  );
};

const SectionHeading = ({ eyebrow, title, description }) => (
  <div className="mx-auto max-w-3xl text-center">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
      {eyebrow}
    </p>
    <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
      {title}
    </h2>
    {description ? (
      <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
        {description}
      </p>
    ) : null}
  </div>
);

const Landing = () => {
  const authenticated = isAuthenticated();
  const primaryCta = authenticated
    ? landingHero.authenticatedCta
    : landingHero.primaryCta;

  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <StudyVaultMark compact subtitle="Academic knowledge workspace" />

          <nav className="hidden items-center gap-6 text-sm font-extrabold text-slate-600 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-brand-600"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            to={primaryCta.href}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-900 px-4 text-sm font-black text-white shadow-lg shadow-brand-900/16 transition-all hover:-translate-y-0.5 hover:bg-brand-600"
          >
            {primaryCta.label}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate flex min-h-[92vh] items-end overflow-hidden px-4 pb-12 pt-28 sm:px-6 lg:px-8">
          <img
            src={studyHeroImage}
            alt="StudyVault workspace for organizing documents, notes, summaries, and study questions"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(20,24,34,0.86)_0%,rgba(33,38,52,0.64)_44%,rgba(45,44,47,0.2)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-[#f7fbff] to-transparent" />

          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.76fr)_minmax(320px,0.34fr)] lg:items-end">
            <div className="max-w-3xl pb-4 text-white">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-white/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/86 backdrop-blur-xl">
                <BookOpenCheck size={15} />
                {landingHero.eyebrow}
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-normal text-white sm:text-7xl lg:text-8xl">
                {landingHero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/82 sm:text-lg">
                {landingHero.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LandingButton href={primaryCta.href}>
                  {primaryCta.label}
                  <ArrowRight size={17} />
                </LandingButton>
                {!authenticated ? (
                  <LandingButton
                    href={landingHero.secondaryCta.href}
                    variant="secondary"
                  >
                    {landingHero.secondaryCta.label}
                  </LandingButton>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {landingHero.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.25rem] border border-white/28 bg-white/16 p-4 text-white shadow-[0_22px_58px_-36px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/58">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-base font-black leading-snug">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
            {landingProofPoints.map((point) => (
              <div
                key={point.label}
                className="rounded-[1.35rem] border border-white/78 bg-white/82 p-5 shadow-sm backdrop-blur-xl"
              >
                <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {point.label}
                </p>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                  {point.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built for student outcomes"
            title="Spend less time managing files and more time understanding them"
            description="StudyVault turns a messy semester of documents into a clear study workspace built around finding, reviewing, and remembering what matters."
          />

          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
            {landingFeatureCards.map((feature) => {
              const FeatureIcon = iconMap[feature.icon] || FileSearch;

              return (
                <article
                  key={feature.title}
                  className="rounded-[1.5rem] border border-white/78 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(45,44,47,0.42)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_76px_-46px_rgba(140,66,56,0.45)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <FeatureIcon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-black tracking-normal text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
                Study flow
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
                A clearer path from upload to confident review
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                Start with the material you already have, then turn it into a
                workspace that supports exams, assignments, and project work.
              </p>
            </div>

            <div className="grid gap-4">
              {landingWorkflowSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="grid gap-4 rounded-[1.35rem] border border-white/78 bg-white/84 p-5 shadow-sm backdrop-blur-xl sm:grid-cols-[auto_minmax(0,1fr)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f2a44] text-sm font-black text-white shadow-lg shadow-[#1f2a44]/16">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-black tracking-normal text-slate-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 rounded-[1.75rem] bg-[#1f2a44] p-5 text-white shadow-[0_32px_90px_-50px_rgba(31,42,68,0.56)] md:grid-cols-3 md:p-7">
            <div className="md:col-span-1">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/72">
                <LockKeyhole size={14} />
                Privacy
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal text-white">
                A private study space for real coursework.
              </h2>
            </div>

            <div className="grid gap-3 md:col-span-2">
              {landingSecurityPoints.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-[1.2rem] border border-white/12 bg-white/8 p-4"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm font-semibold leading-7 text-white/82">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions students ask before getting started"
            description="Short, practical answers focused on study habits, revision, and workspace value."
          />

          <div className="mx-auto mt-10 grid max-w-4xl gap-3">
            {landingFaq.map((item) => (
              <details
                key={item.question}
                className="group rounded-[1.35rem] border border-white/78 bg-white/86 p-5 shadow-sm backdrop-blur-xl"
              >
                <summary className="cursor-pointer list-none text-base font-black text-slate-950 marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-[0_26px_76px_-50px_rgba(45,44,47,0.44)] md:flex-row md:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
                Ready to study
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
                Bring your study materials together and review faster.
              </h2>
            </div>
            <Link
              to={primaryCta.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-900 px-5 text-sm font-black text-white shadow-lg shadow-brand-900/16 transition-all hover:-translate-y-0.5 hover:bg-brand-600"
            >
              {primaryCta.label}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/72 bg-white/72 px-4 py-8 text-sm font-semibold text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <StudyVaultMark to="/" compact />
          <p>Built for students, project groups, and exam revision workflows.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

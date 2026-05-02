import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  FileSearch,
  FolderTree,
  Library,
  LockKeyhole,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StudyVaultMark from '../components/navigation/StudyVaultMark.jsx';
import workspaceHeroAiImage from '../assets/workspace-hero-ai.png';
import workspaceHeroLibraryImage from '../assets/workspace-hero-library.png';
import workspaceHeroOverviewImage from '../assets/workspace-hero-overview.png';
import { isAuthenticated } from '../utils/auth.js';
import {
  landingFaq,
  landingFeatures,
  landingHero,
  landingStats,
} from './landingContent.js';

const iconMap = {
  FolderTree,
  Library,
  ShieldCheck,
  Sparkles,
};

const accentStyles = {
  brand: {
    iconBg: 'bg-brand-50',
    iconText: 'text-brand-700',
    border: 'group-hover:border-brand-200',
  },
  accent: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    border: 'group-hover:border-amber-200',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-700',
    border: 'group-hover:border-emerald-200',
  },
  slate: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-700',
    border: 'group-hover:border-slate-300',
  },
};

const workflowIcons = [CloudUpload, Sparkles, MessageSquareText];

const trustItems = [
  { icon: LockKeyhole, label: 'Protected access' },
  { icon: ShieldCheck, label: 'Account-isolated files' },
  { icon: Zap, label: 'Fast document review' },
];

const Landing = () => {
  const authenticated = isAuthenticated();
  const cta = authenticated ? landingHero.authenticatedCta : landingHero.primaryCta;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-950 selection:bg-brand-100 selection:text-brand-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white shadow-[0_14px_36px_-30px_rgba(15,23,42,0.55)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <StudyVaultMark compact />

          <nav className="hidden items-center gap-8 text-xs font-black uppercase tracking-[0.14em] text-slate-700 lg:flex">
            <a href="#features" className="rounded-full px-2 py-1 transition hover:bg-brand-50 hover:text-brand-800">
              Features
            </a>
            <a href="#product" className="rounded-full px-2 py-1 transition hover:bg-brand-50 hover:text-brand-800">
              Product
            </a>
            <a href="#faq" className="rounded-full px-2 py-1 transition hover:bg-brand-50 hover:text-brand-800">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!authenticated && (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full px-3 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-brand-50 hover:text-brand-900 sm:block"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center rounded-full bg-brand-900 px-5 text-sm font-extrabold text-white shadow-lg shadow-brand-900/18 transition hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-slate-950 pt-24 text-white">
          <img
            src={workspaceHeroOverviewImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 z-0 h-full w-full object-cover object-[62%_center] opacity-78"
          />
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(90deg, rgba(15,23,42,0.94) 0%, rgba(15,23,42,0.86) 36%, rgba(15,23,42,0.28) 72%, rgba(15,23,42,0.08) 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 z-10 h-36"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
            }}
          />

          <div className="relative z-20 mx-auto max-w-7xl px-5 pb-20 pt-10 sm:pt-16 lg:px-8 lg:pb-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
                <Sparkles size={14} className="text-brand-100" />
                Study workspace
              </div>

              <h1 className="landing-hero-title mt-7 max-w-3xl font-black leading-[0.95] tracking-normal text-white">
                {landingHero.title}
              </h1>
              <p className="mt-7 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl">
                Study smarter with your own documents.
              </p>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/72 sm:text-lg">
                Upload PDFs and notes, organize them by course, then summarize and ask questions from one focused workspace.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={cta.href}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-brand-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-brand-950/24 transition hover:-translate-y-0.5 hover:bg-brand-500"
                >
                  {cta.label}
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#product"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/18 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/16"
                >
                  See product
                  <Search size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 border-b border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-px px-5 py-5 sm:grid-cols-3 lg:px-8">
            {landingStats.map((item, index) => {
              const Icon = workflowIcons[index] || CheckCircle2;

              return (
                <div key={item.label} className="flex items-start gap-4 rounded-lg p-4 transition hover:bg-base-50">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-600">
                      {item.value}
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="features" className="relative bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
                  <Zap size={13} />
                  Built for study flow
                </p>
                <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                  Less searching. More understanding.
                </h2>
                <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-slate-500 sm:text-lg">
                  StudyVault keeps the core workflow close together: documents, folders, summaries, and questions stay in the same place.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {landingFeatures.map((feature) => {
                  const Icon = iconMap[feature.icon] || FileSearch;
                  const accent = accentStyles[feature.accent] || accentStyles.brand;

                  return (
                    <article
                      key={feature.title}
                      className={`group rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] transition ${accent.border} hover:-translate-y-1 hover:shadow-sks-medium`}
                    >
                      <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
                        <Icon size={22} />
                      </span>
                      <h3 className="mt-6 text-xl font-black text-slate-950">{feature.title}</h3>
                      <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
                        {feature.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="overflow-hidden bg-base-50 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sks-heavy">
                <img
                  src={workspaceHeroLibraryImage}
                  alt="StudyVault document library with organized folders and documents"
                  className="aspect-[16/9] w-full rounded-md object-cover object-center"
                />
              </div>

              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  <CheckCircle2 size={13} />
                  Product workspace
                </p>
                <h2 className="mt-6 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                  A study desk that remembers where everything is.
                </h2>
                <p className="mt-6 text-base font-semibold leading-relaxed text-slate-500 sm:text-lg">
                  Keep uploaded material organized by folder, then move straight into review with summaries, notes, and document-aware questions.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    'Course folders that stay easy to browse',
                    'Search across documents without losing context',
                    'Summaries and notes beside the material you are reading',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                      <span className="text-sm font-black leading-relaxed text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={cta.href}
                  className="mt-9 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-black text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-600"
                >
                  Try the workspace
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white py-10">
          <div className="mx-auto grid max-w-5xl gap-4 px-5 sm:grid-cols-3 lg:px-8">
            {trustItems.map((item) => {
              const TrustIcon = item.icon;

              return (
                <div key={item.label} className="flex items-center justify-center gap-3 text-sm font-black text-slate-600">
                  <TrustIcon size={18} className="text-brand-600" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
                  <MessageSquareText size={13} />
                  Review with context
                </p>
                <h2 className="mt-6 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                  Ask better questions from the files you already trust.
                </h2>
                <p className="mt-6 text-base font-semibold leading-relaxed text-slate-500 sm:text-lg">
                  Use AI assistance as a focused study layer over your uploaded material, not a separate chat that forgets your coursework.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-950 p-2 shadow-sks-heavy">
                <img
                  src={workspaceHeroAiImage}
                  alt="StudyVault AI assistant for summaries and study questions"
                  className="aspect-[16/9] w-full rounded-md object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-base-50 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <h2 className="text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                  Common questions
                </h2>
                <p className="mt-5 max-w-md text-base font-semibold leading-relaxed text-slate-500">
                  The product is built for serious study habits, but the first step is simple: bring your documents into one place.
                </p>
                <Link
                  to={cta.href}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  {cta.label}
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="space-y-3">
                {landingFaq.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:border-brand-200"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-black text-slate-950">
                      {item.question}
                      <ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm font-semibold leading-relaxed text-slate-500">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white px-5 py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StudyVaultMark compact />
            <p className="mt-4 max-w-sm text-sm font-semibold leading-relaxed text-slate-500">
              An AI study workspace for documents, notes, and review.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm font-bold text-slate-500 sm:flex sm:items-center sm:gap-6">
            <a href="#features" className="transition hover:text-brand-700">
              Features
            </a>
            <a href="#product" className="transition hover:text-brand-700">
              Product
            </a>
            <a href="#faq" className="transition hover:text-brand-700">
              FAQ
            </a>
            <Link to="/login" className="transition hover:text-brand-700">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-slate-100 pt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>(c) {new Date().getFullYear()} StudyVault. All rights reserved.</span>
          <span className="text-emerald-600">System operational</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

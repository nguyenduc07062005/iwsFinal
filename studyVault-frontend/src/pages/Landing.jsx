import {
  ArrowRight,
  FileSearch,
  FolderTree,
  Library,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StudyVaultMark from '../components/navigation/StudyVaultMark.jsx';
import neoEditorialBg from '../assets/neo_editorial_bg.png';
import studyShowcase from '../assets/study2.png';
import { isAuthenticated } from '../utils/auth.js';
import {
  landingFaq,
  landingFeatures,
  landingHero,
  landingStats,
} from './landingContent.js';

/* ── Icon registry ─────────────────────────────────────────── */
const iconMap = { FolderTree, Library, ShieldCheck, Sparkles };

/* ── Accent color map for bento cards ──────────────────────── */
const accentStyles = {
  brand: {
    iconBg: 'bg-brand-50',
    iconText: 'text-brand-600',
    glow: 'from-brand-500/20',
  },
  accent: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    glow: 'from-amber-500/20',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    glow: 'from-emerald-500/20',
  },
  slate: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    glow: 'from-slate-500/15',
  },
};

/* ══════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════ */
const Landing = () => {
  const authenticated = isAuthenticated();
  const cta = authenticated ? landingHero.authenticatedCta : landingHero.primaryCta;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-900">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/75 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <StudyVaultMark compact />
          <nav className="hidden gap-8 text-[13px] font-bold uppercase tracking-wider text-slate-400 lg:flex">
            <a href="#features" className="transition hover:text-brand-600">Features</a>
            <a href="#product" className="transition hover:text-brand-600">Product</a>
            <a href="#faq" className="transition hover:text-brand-600">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {!authenticated && (
              <>
                <Link to="/login" className="hidden px-4 py-2 text-sm font-bold text-slate-500 transition hover:text-brand-900 sm:block">
                  Sign In
                </Link>
                <Link to="/register" className="sks-ai-glow-btn inline-flex h-10 items-center rounded-full bg-brand-900 px-6 text-sm font-bold text-white shadow-sks-glow">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden pt-28 pb-28 sm:pt-32 sm:pb-32 lg:pt-40 lg:pb-44">
          <div className="absolute inset-0 -z-20 overflow-hidden bg-base-50">
            <img
              src={neoEditorialBg}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-[1.02] object-cover object-center opacity-100 contrast-[1.06] saturate-[1.08]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 70%, rgba(250,249,246,0.08) 100%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/18 via-transparent to-white/12" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/72 via-white/24 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-white/16 to-white" />
          </div>
          <div className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="relative z-20 flex flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-brand-900 shadow-sm shadow-slate-950/5 backdrop-blur-md">
                <Sparkles size={11} className="text-brand-500" />
                The Future of Learning
              </div>

              <h1 className="relative max-w-5xl [text-shadow:0_18px_45px_rgba(255,255,255,0.92)]" style={{ fontFamily: 'var(--font-serif)' }}>
                <span className="block text-[clamp(3.4rem,8vw,6.5rem)] italic leading-[0.92] tracking-normal text-slate-950">
                  StudyVault
                </span>
                <span className="mt-2 block text-[clamp(2.5rem,6.3vw,4.9rem)] font-black leading-[0.95] tracking-normal text-brand-900">
                  AI Study Workspace
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 [text-shadow:0_12px_30px_rgba(255,255,255,0.88)] sm:text-xl">
                Organize PDFs, notes, summaries, and study questions in one focused learning space
              </p>

              <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row">
                <Link
                  to={cta.href}
                  className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-brand-900 px-10 text-sm font-black text-white shadow-xl transition-all hover:scale-105"
                >
                  <span className="relative z-10">{cta.label}</span>
                  <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-brand-600 to-brand-500 transition-transform group-hover:translate-x-0" />
                </Link>
              </div>
            </div>

            {/* Exploded View Visuals */}
            <div className="absolute inset-0 -z-10 pointer-events-none select-none">
              {/* Floating Card 1: Library */}
              <div className="absolute left-[8%] top-[35%] hidden w-56 rotate-[-9deg] lg:block opacity-95">
                <div className="animate-float rounded-2xl border border-white/90 bg-white/60 p-4 shadow-[0_28px_70px_-36px_rgba(45,44,47,0.55)] backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-brand-600 shadow-sm">
                        <Library size={14} />
                      </span>
                      <p className="text-[9px] font-black uppercase tracking-wider text-brand-900">Library</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
                      Synced
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      ['Lecture notes', '24 files'],
                      ['Research PDFs', '8 indexed'],
                      ['AI summaries', '12 ready'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 shadow-sm shadow-slate-950/[0.03]">
                        <span className="text-[10px] font-extrabold text-slate-600">{label}</span>
                        <span className="text-[9px] font-black text-brand-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Card 2: AI Insight */}
              <div className="absolute right-[10%] top-[30%] hidden w-64 rotate-[4deg] animate-float-slow lg:block opacity-95">
                <div className="rounded-[2rem] border border-white/85 bg-white/55 p-5 shadow-[0_28px_70px_-38px_rgba(140,66,56,0.5)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                      <Sparkles size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-brand-900 uppercase tracking-wider">AI Insight</p>
                      <p className="text-[9px] font-bold italic text-brand-600/70">Processing...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ──────────────────────────────────── */}
        <section className="relative z-10 border-y border-slate-100 bg-white/50 backdrop-blur-sm py-12">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-12 px-5 sm:gap-24 lg:px-8">
            {landingStats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black tracking-tight text-brand-900 sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BENTO GRID FEATURES ─────────────────────────── */}
        <section id="features" className="relative py-28 sm:py-40">
          <div className="sks-bg-dots absolute inset-0 -z-10 opacity-30" />

          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-brand-600">
                <Zap size={12} className="fill-current" />
                Intelligence
              </p>
              <h2 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
                Master any subject, faster.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-slate-500">
                Four specialized tools engineered to help you absorb, organize, and recall knowledge with ease.
              </p>
            </div>

            <div className="mt-20 grid gap-6 sm:grid-cols-2">
              {landingFeatures.map((f) => {
                const Icon = iconMap[f.icon] || FileSearch;
                const a = accentStyles[f.accent] || accentStyles.brand;

                return (
                  <article
                    key={f.title}
                    className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm shadow-slate-950/[0.05] transition-all hover:border-brand-200/60 hover:shadow-sks-heavy"
                  >
                    <div className={`absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-radial ${a.glow} to-transparent blur-3xl opacity-0 transition-opacity group-hover:opacity-100`} />

                    <span className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${a.iconBg} ${a.iconText} transition-transform group-hover:scale-110`}>
                      <Icon size={32} />
                    </span>

                    <h3 className="relative mt-8 text-2xl font-black text-slate-900">{f.title}</h3>
                    <p className="relative mt-4 text-[17px] font-medium leading-relaxed text-slate-500">{f.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── PRODUCT SHOWCASE: REVERSE SPLIT ──────────────── */}
        <section id="product" className="relative overflow-hidden bg-base-50 py-28 sm:py-40">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">

              {/* Left Column: Visual */}
              <div className="order-2 lg:order-1">
                <div className="floating-ring rounded-[2.5rem]">
                  <div className="overflow-hidden rounded-[2.5rem] bg-white p-2.5 shadow-[0_30px_80px_-20px_rgba(140,66,56,0.18)]">
                    <img
                      src={studyShowcase}
                      alt="Product interface"
                      className="w-full rounded-[2rem] object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Content */}
              <div className="order-1 lg:order-2">
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
                  <CheckCircle2 size={12} />
                  Efficiency
                </p>
                <h2 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
                  Built for the deep work you actually do.
                </h2>
                <p className="mt-8 text-lg font-medium leading-relaxed text-slate-500">
                  Stop juggling 10 different apps. StudyVault brings your PDFs, notes, and AI insights into one high-performance workspace.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    'Instant RAG-powered Q&A',
                    'Auto-generated Subject hierarchies',
                    'Cross-document semantic search'
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 size={14} strokeWidth={3} />
                      </div>
                      <span className="text-base font-bold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12">
                  <Link to={cta.href} className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-100 bg-white px-8 text-sm font-extrabold text-brand-900 transition-all hover:-translate-y-1 hover:border-brand-200">
                    Try the Workspace <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── SECURITY TRUST STRIP ────────────────────────── */}
        <section className="border-y border-slate-100 bg-white py-12">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-12 px-5 text-sm font-black uppercase tracking-widest text-slate-400 sm:gap-20">
            <div className="flex items-center gap-3"><LockKeyhole size={18} className="text-brand-500" /> AES-256 Encryption</div>
            <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-brand-500" /> SOC2 Compliant</div>
            <div className="flex items-center gap-3"><Zap size={18} className="text-brand-500" /> High Performance</div>
          </div>
        </section>

        {/* ── FAQ & CTA ───────────────────────────────────── */}
        <section id="faq" className="py-28 sm:py-40">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-20 lg:grid-cols-2">

              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-600">Support</h3>
                <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">Common questions</h2>
                <div className="mt-10 space-y-4">
                  {landingFaq.map((item) => (
                    <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04] transition-all hover:border-brand-200/60">
                      <summary className="flex cursor-pointer list-none items-center justify-between p-6 text-[15px] font-bold text-slate-900 sm:text-base">
                        {item.question}
                        <ChevronDown size={18} className="text-slate-300 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-slate-50 p-6 text-sm font-medium leading-relaxed text-slate-500">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="relative flex flex-col justify-center overflow-hidden rounded-[3rem] bg-gradient-to-br from-brand-600 to-brand-500 p-12 text-white shadow-sks-heavy lg:p-20">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-mesh opacity-20" />
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/20 blur-[100px]" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-brand-900/20 blur-[80px]" />

                <div className="relative z-10">
                  <h2 className="text-4xl font-black leading-tight sm:text-6xl">
                    Elevate your learning journey.
                  </h2>
                  <p className="mt-8 max-w-lg text-lg font-bold text-white/90">
                    A unified space for your documents, notes, and AI insights. Get started today and see the difference.
                  </p>
                  <Link to={cta.href} className="mt-12 inline-flex h-16 items-center gap-3 rounded-full bg-white px-10 text-base font-black text-brand-600 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
                    Get Started Free <ArrowRight size={20} />
                  </Link>
                  <p className="mt-8 text-[11px] font-black uppercase tracking-[0.25em] text-white/60">No credit card required</p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white px-5 pt-24 pb-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">

            {/* Brand Column */}
            <div className="space-y-6">
              <StudyVaultMark compact />
              <p className="text-sm font-medium leading-relaxed text-slate-500 max-w-[240px]">
                The premier AI workspace for modern academia. Built to empower students with intelligent study tools.
              </p>
              <div className="flex gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </div>
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Product</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#features" className="transition hover:text-brand-600">Features</a></li>
                <li><a href="#faq" className="transition hover:text-brand-600">FAQ</a></li>
                <li><Link to="/register" className="transition hover:text-brand-600">Sign Up</Link></li>
                <li><Link to="/login" className="transition hover:text-brand-600">Sign In</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Resources</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#" className="transition hover:text-brand-600">Documentation</a></li>
                <li><a href="#" className="transition hover:text-brand-600">Help Center</a></li>
                <li><a href="#" className="transition hover:text-brand-600">Privacy Policy</a></li>
                <li><a href="#" className="transition hover:text-brand-600">Terms of Service</a></li>
              </ul>
            </div>

            {/* Community Column */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Community</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#" className="transition hover:text-brand-600">Twitter / X</a></li>
                <li><a href="#" className="transition hover:text-brand-600">LinkedIn</a></li>
                <li><a href="#" className="transition hover:text-brand-600">Discord</a></li>
                <li><a href="#" className="transition hover:text-brand-600">GitHub</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-slate-50 pt-10 sm:flex-row">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
              © {new Date().getFullYear()} StudyVault. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Status: All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

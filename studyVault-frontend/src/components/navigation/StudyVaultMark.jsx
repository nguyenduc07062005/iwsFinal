import { Link } from 'react-router-dom';

const StudyVaultMark = ({
  to = '/',
  compact = false,
  subtitle = 'Academic knowledge workspace',
}) => {
  const content = (
    <>
      <span
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-white shadow-[var(--shadow-brand)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
        style={{
          background:
            'linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-600) 55%, var(--color-accent) 100%)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4.75 5.75A1.75 1.75 0 0 1 6.5 4h10.25a1.25 1.25 0 0 1 1.25 1.25v12.5A1.25 1.25 0 0 1 16.75 19H6.5a1.75 1.75 0 0 0-1.75 1.75V5.75Z" />
          <path d="M6 6.5h9.5" />
          <path d="M6 10h9.5" />
          <path d="M6 13.5h6" />
        </svg>
      </span>

      <div className="min-w-0">
        <p className="text-lg font-extrabold tracking-tight text-slate-900">
          StudyVault
        </p>
        {!compact ? (
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-brand-600/80">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  if (!to) {
    return <div className="flex items-center gap-3">{content}</div>;
  }

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-3 transition-transform duration-300 hover:-translate-y-0.5"
    >
      {content}
    </Link>
  );
};

export default StudyVaultMark;

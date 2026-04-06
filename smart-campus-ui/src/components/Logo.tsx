interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-[8px]' },
    md: { icon: 'w-10 h-10', text: 'text-lg', sub: 'text-[9px]' },
    lg: { icon: 'w-11 h-11', text: 'text-xl', sub: 'text-[10px]' },
  };

  const isLight = variant === 'light';
  const iconBg = isLight ? 'bg-white/15 border-white/20' : 'bg-campus-50 border-campus-200';
  const iconColor = isLight ? 'text-white' : 'text-campus-700';
  const textColor = isLight ? 'text-white' : 'text-campus-800';
  const subColor = isLight ? 'text-white/60' : 'text-campus-400';

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size].icon} ${iconBg} border rounded-xl flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${iconColor}`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 10l10-5 10 5-10 5-10-5z" />
          <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
          <path d="M22 10v6" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`${sizes[size].text} font-extrabold tracking-tight leading-tight ${textColor}`}>
          ACADEMIC CURATOR
        </span>
        <span className={`${sizes[size].sub} font-semibold tracking-[0.2em] uppercase ${subColor}`}>
          Institutional Ecosystem
        </span>
      </div>
    </div>
  );
}

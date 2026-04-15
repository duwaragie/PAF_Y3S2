import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

type RoleKey = 'STUDENT' | 'LECTURER' | 'ADMIN';

const roles: Record<RoleKey, { title: string; blurb: string; bullets: string[]; accent: string }> = {
  STUDENT: {
    title: 'For Students',
    blurb: 'Book facilities, raise incidents, and stay in the loop without chasing anyone.',
    bullets: [
      'Reserve labs, rooms, and equipment in seconds',
      'Raise a ticket when something breaks, with photo evidence',
      'Get notified the moment your booking is approved',
      'One profile across every campus service',
    ],
    accent: 'bg-campus-600 text-white',
  },
  LECTURER: {
    title: 'For Lecturers',
    blurb: 'Own your schedule, own your classrooms, own your incident queue.',
    bullets: [
      'See facilities assigned to your courses at a glance',
      'Approve or reassign student booking requests',
      'Track and close incident tickets from your dashboard',
      'Quiet hours and notification preferences',
    ],
    accent: 'bg-purple-600 text-white',
  },
  ADMIN: {
    title: 'For Administrators',
    blurb: 'Run the campus from one console. Users, roles, facilities, everything.',
    bullets: [
      'Provision staff accounts with pre-assigned employee IDs',
      'Role-based access with hierarchical permissions',
      'Bulk user actions, audit trails, and global search',
      'Real-time dashboards for usage and open incidents',
    ],
    accent: 'bg-red-600 text-white',
  },
};

const features = [
  {
    title: 'Facility Bookings',
    desc: 'Catalogue every lab, room, and resource with availability windows. Students self-serve, staff moderate.',
    icon: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    ),
    color: 'bg-campus-50 text-campus-700 border-campus-100',
  },
  {
    title: 'Incident Tickets',
    desc: 'Broken projector? Flickering lights? Raise a ticket, attach photos, and track it to resolution.',
    icon: (
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
    ),
    color: 'bg-red-50 text-red-700 border-red-100',
  },
  {
    title: 'Real-time Notifications',
    desc: 'Push, in-app, and email alerts for bookings, assignments, and campus-wide announcements.',
    icon: (
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    ),
    color: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    title: 'Role-based Access',
    desc: 'Student, Lecturer, Admin. Hierarchical RBAC enforced on every endpoint through Spring Security.',
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
    color: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  {
    title: 'Google OAuth + OTP',
    desc: 'One-click Google sign-in alongside classic email + OTP. JWT-backed sessions with refresh tokens.',
    icon: (
      <>
        <path d="M12 11V7a4 4 0 0 0-8 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
      </>
    ),
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    title: 'Profile Completion Gate',
    desc: 'Students self-register their SRN. Staff get employee IDs from admins. Nobody slips through with half a profile.',
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    color: 'bg-blue-50 text-blue-700 border-blue-100',
  },
];

const steps = [
  { n: 1, title: 'Sign up', desc: 'Use your campus email or Google. We send a 6-digit OTP to verify local accounts.' },
  { n: 2, title: 'Complete profile', desc: 'Students add their registration number. Staff get an employee ID from admin.' },
  { n: 3, title: 'Get to work', desc: 'Book a lab, raise a ticket, check a dashboard. Role decides what you see.' },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>('STUDENT');
  const r = roles[activeRole];

  return (
    <div className="bg-[#f0f2f5]">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-campus-50 via-[#f0f2f5] to-white"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-campus-100/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-[420px] h-[420px] rounded-full bg-amber-100/30 blur-3xl"
        />

        <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center gap-10 lg:gap-16">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-campus-100 text-[11px] font-bold uppercase tracking-[0.18em] text-campus-700 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Built for modern campuses
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-campus-900 leading-[1.05] tracking-tight">
              The operating system for your campus.
            </h1>
            <p className="text-lg text-campus-500 max-w-xl leading-relaxed">
              One place for facility bookings, incident tickets, notifications, and user
              management. Designed for students, lecturers, and administrators.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/register"
                className="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-campus-800 text-white text-sm font-semibold hover:bg-campus-700 shadow-lg shadow-campus-900/20 transition-colors"
              >
                Get started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/about"
                className="h-12 px-5 inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-campus-800 hover:bg-gray-50 transition-colors"
              >
                Learn more
              </Link>
            </div>
            <div className="flex items-center gap-5 pt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                JWT + OAuth auth
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                RBAC-secured
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Real-time updates
              </span>
            </div>
          </div>

          {/* Mock dashboard visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-campus-200/40 to-amber-200/30 rounded-3xl blur-2xl" />
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl p-5 space-y-4 rotate-[1deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] font-mono text-gray-400">dashboard.academiccurator</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active Bookings', value: '24', color: 'bg-campus-50 text-campus-700' },
                  { label: 'Open Tickets', value: '3', color: 'bg-amber-50 text-amber-700' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{s.label}</p>
                    <p className="text-xl font-extrabold mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { t: 'Lab 304 booked', s: '2:00 PM', ok: true },
                  { t: 'Projector incident raised', s: 'Block B', ok: false },
                  { t: 'Library slot approved', s: '10:00 AM', ok: true },
                ].map((row) => (
                  <div key={row.t} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        row.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        {row.ok ? <path d="M5 13l4 4L19 7" /> : <path d="M12 9v4m0 4h.01" />}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-campus-800 truncate">{row.t}</p>
                      <p className="text-[10px] text-gray-400">{row.s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-4 -bottom-4 bg-white rounded-2xl border border-gray-100 shadow-lg p-3 flex items-center gap-3 w-52">
              <div className="w-9 h-9 rounded-xl bg-campus-600 text-white flex items-center justify-center text-sm font-bold">
                AC
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-campus-800 truncate">Active admin</p>
                <p className="text-[10px] text-gray-400 truncate">All systems nominal</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
                One platform, three perspectives
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-campus-900">Who it's for</h2>
              <p className="text-gray-500">
                Pick a role and see what changes. The app's surface adapts to who you are.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex items-center justify-center gap-2 mb-10">
              {(Object.keys(roles) as RoleKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveRole(key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeRole === key
                      ? 'bg-campus-800 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {roles[key].title.replace('For ', '')}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div
              key={activeRole}
              className="bg-gradient-to-br from-campus-50 to-white rounded-3xl border border-campus-100 p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade-in"
            >
              <div className="space-y-4">
                <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${r.accent}`}>
                  {activeRole}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-campus-900">{r.title}</h3>
                <p className="text-campus-500 leading-relaxed">{r.blurb}</p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-campus-800 hover:text-campus-600 transition-colors pt-2"
                >
                  Sign up as {activeRole.toLowerCase()}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <ul className="space-y-3">
                {r.bullets.map((b) => (
                  <li key={b} className="flex gap-3 items-start">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-campus-200 text-campus-700 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm text-campus-800 leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-[#f0f2f5]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
                Everything you need
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-campus-900">
                Built for campus operations
              </h2>
              <p className="text-gray-500">
                Every feature modeled on what actually happens on a university campus, with no
                extra fluff.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="group h-full bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${f.color}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-campus-900 mt-4">{f.title}</h3>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
                Zero to productive in three steps
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-campus-900">How it works</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div
              aria-hidden
              className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-campus-200 to-transparent"
            />
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <div className="relative mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-campus-600 to-campus-800 text-white flex items-center justify-center text-lg font-extrabold shadow-md">
                    {s.n}
                  </div>
                  <h3 className="text-base font-bold text-campus-900 mt-4">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-[#0c1f3a] text-white p-10 md:p-14 text-center">
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-campus-500/20 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-3xl"
              />
              <div className="relative space-y-5">
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Ready to bring order to your campus?
                </h2>
                <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
                  Create an account in under a minute. Verified faculty accounts can be
                  provisioned by an administrator.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    to="/register"
                    className="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-white text-campus-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Get started free
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="h-12 px-5 inline-flex items-center rounded-xl border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    I already have an account
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

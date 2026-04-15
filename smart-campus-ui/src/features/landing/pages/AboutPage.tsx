import { Link } from 'react-router-dom';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

const values = [
  {
    title: 'Every role gets a home',
    desc: 'Students, lecturers, and administrators each see a surface shaped for them, not a stripped-down version of someone else\'s view.',
    icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  },
  {
    title: 'Nothing slips through',
    desc: 'A request is a record. A booking has a status. An incident has an owner. If it happened on campus, it lives in one place.',
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  },
  {
    title: 'Fewer clicks, clearer answers',
    desc: 'Every page is built around the one question the person opening it is actually trying to answer.',
    icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
  },
  {
    title: 'Access is explicit',
    desc: 'Who can do what is never implicit. Role-aware gates apply whether you\'re booking a room or deleting a user.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#f0f2f5]">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-campus-50 via-[#f0f2f5] to-white"
        />
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-campus-100/40 blur-3xl"
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center space-y-5">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
            About Academic Curator
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-campus-900 leading-tight tracking-tight">
            A calmer, clearer way to run a campus.
          </h1>
          <p className="text-lg text-campus-500 max-w-2xl mx-auto leading-relaxed">
            We bring every campus workflow, bookings, incidents, notifications, people, into
            one place, and then make sure you only see the parts that matter to you.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
            The story
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-campus-900">
            Campus operations deserve better than a shared inbox.
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Walk through any university and you&rsquo;ll find the same pattern: a student
              wants to book a lab, they email a lecturer. The lecturer emails an admin. The
              admin checks a spreadsheet. Three days later, an answer comes back, usually a no.
            </p>
            <p>
              When something breaks, the same loop starts again. A flickering light becomes a
              WhatsApp message, then a phone call, then a forgotten note. Nobody knows who owns
              it. Nobody knows when it&rsquo;s fixed.
            </p>
            <p>
              We started Academic Curator because campus operations shouldn&rsquo;t feel like
              that. Students should self-serve. Lecturers should have one queue, not five.
              Administrators should see everything, but only when they need to.
            </p>
            <p className="text-campus-800 font-semibold">
              One platform. One login. One place where every workflow lives.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#f0f2f5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
              What we stand for
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-campus-900">Our principles</h2>
            <p className="text-gray-500">
              Every design choice traces back to one of these.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-card transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-campus-50 border border-campus-100 text-campus-700 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {v.icon}
                  </svg>
                </div>
                <h3 className="text-base font-bold text-campus-900 mt-4">{v.title}</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-campus-900">
            Come see what calmer campus ops look like.
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
            Create an account and take a walk through the platform. It takes about a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-campus-800 text-white text-sm font-semibold hover:bg-campus-700 transition-colors"
            >
              Get started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/contact"
              className="h-12 px-5 inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-campus-800 hover:bg-gray-50 transition-colors"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

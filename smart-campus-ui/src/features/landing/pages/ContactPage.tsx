import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { contactService } from '@/services/contactService';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Please add a short subject'),
  message: z.string().min(20, 'Messages need at least 20 characters so we can help').max(2000, 'Please keep messages under 2000 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const messageLength = watch('message', '')?.length ?? 0;

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      setError(null);
      await contactService.send(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f0f2f5]">
      <PublicHeader />

      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-campus-50 via-[#f0f2f5] to-white"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-campus-100/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full bg-amber-100/30 blur-3xl"
        />

        <div className="relative max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-center">
          {/* Left: intro */}
          <div className="space-y-5">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-campus-500">
              Get in touch
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-campus-900 leading-tight tracking-tight">
              Have a question? Tell us about it.
            </h1>
            <p className="text-gray-500 leading-relaxed">
              Whether you're curious about how the platform would fit your campus, running into
              something that doesn't feel right, or just want to say hello, send us a message.
              We read everything.
            </p>

            <div className="pt-2 space-y-3">
              {[
                {
                  title: 'Response time',
                  text: 'We reply within two business days, usually much sooner.',
                  icon: <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
                },
                {
                  title: 'Privacy',
                  text: 'Your message stays between us. We never share or sell contact details.',
                  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
                },
                {
                  title: 'Direct line',
                  text: 'Prefer email? Reach us at hello@academiccurator.app anytime.',
                  icon: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />,
                },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <span className="shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-campus-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      {b.icon}
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-campus-900">{b.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            {submitted ? (
              <div className="py-8 text-center space-y-4 animate-fade-in">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-campus-900">Message sent</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Thanks for reaching out. We'll get back to you at the email you provided.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="h-10 px-5 inline-flex items-center rounded-lg border border-gray-200 text-sm font-medium text-campus-800 hover:bg-gray-50 transition-colors"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                    <input
                      {...register('name')}
                      placeholder="Your full name"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
                  <input
                    {...register('subject')}
                    placeholder="What is this about?"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <span
                      className={`text-[11px] ${
                        messageLength > 2000 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {messageLength}/2000
                    </span>
                  </div>
                  <textarea
                    {...register('message')}
                    rows={6}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-campus-200 focus:border-campus-400"
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-campus-800 text-white text-sm font-semibold rounded-xl hover:bg-campus-700 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    'Sending...'
                  ) : (
                    <>
                      Send message
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-gray-400">
                  By submitting, you agree to our Privacy Policy and Terms of Service.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

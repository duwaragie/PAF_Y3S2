import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api } from '@/lib/axios';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = searchParams.get('email');
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      setError(null);
      await api.post('/auth/resend-otp', { email });
      setCooldown(60);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const onSubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/verify-email', { email, otp: otpCode });
      setSuccess('Email verified successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title=""
      description=""
      heading="Securing your academic journey."
      subheading="Our multi-factor authentication ensures that your research, records, and institutional data remain protected under the highest security standards."
    >
      <div className="space-y-6">
        {/* Mail icon */}
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-campus-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4L12 13L2 4" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">Check your email</h2>
          <p className="text-[15px] text-gray-500">
            We've sent a 6-digit verification code to{' '}
            <span className="font-semibold text-campus-700">{email}</span>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 text-red-600 p-3.5 rounded-xl text-sm border border-red-100">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-sm border border-emerald-100">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </div>
        )}

        {/* OTP Inputs */}
        <div className="flex gap-3" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={(e) => e.target.select()}
              className={`
                w-full h-14 text-center text-xl font-bold rounded-xl border-2 bg-gray-50
                outline-none transition-all
                ${digit ? 'border-campus-600 bg-white text-campus-800' : 'border-gray-200 text-gray-800'}
                focus:border-campus-600 focus:bg-white focus:ring-2 focus:ring-campus-600/10
              `}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          onClick={onSubmit}
          disabled={isLoading || success !== null}
          className="w-full h-[52px] bg-campus-800 hover:bg-campus-700 text-white text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying...
            </span>
          ) : success ? (
            'Verified — Redirecting'
          ) : (
            'Verify email'
          )}
        </button>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-campus-800 hover:text-campus-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to login
          </Link>
          <span className="text-sm text-gray-400">
            Didn't receive code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="font-semibold text-campus-800 hover:text-campus-600 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </span>
        </div>

        {/* Help section */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-campus-800">Need assistance?</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Contact the University IT Helpdesk at{' '}
                <span className="text-campus-600 underline">helpdesk@university.edu</span>{' '}
                if you are having trouble receiving your code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

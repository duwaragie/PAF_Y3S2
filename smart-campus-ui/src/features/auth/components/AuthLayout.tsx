import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  heading: ReactNode;
  subheading: string;
  image?: string;
  pills?: string[];
  bottomText?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  heading,
  subheading,
  image,
  pills,
  bottomText,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#f0f2f5]">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0c1f3a] relative overflow-hidden flex-col">
        {/* Hero image background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/university-students.jpg')" }}
        />
        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f3a]/70 via-[#0c1f3a]/50 to-[#0c1f3a]/40" />

        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-12">
          {/* Logo */}
          <Link to="/" className="inline-flex hover:opacity-90 transition-opacity">
            <Logo variant="light" size="lg" />
          </Link>

          {/* Main content */}
          <div className="space-y-6 -mt-8">
            <h1 className="text-[2.75rem] xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              {heading}
            </h1>
            <p className="text-white text-[15px] leading-relaxed max-w-[400px]">
              {subheading}
            </p>

            {/* Feature pills */}
            {pills && pills.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {pills.map((pill) => (
                  <span
                    key={pill}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-[13px] font-medium border border-white/10"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}

            {/* Image */}
            {image && (
              <div className="mt-4 overflow-hidden">
                <img
                  src={image}
                  alt=""
                  className="w-full h-64 xl:h-72 object-contain"
                />
              </div>
            )}
          </div>

          {/* Bottom text */}
          <div>
            {bottomText && (
              <p className="text-campus-500 text-[11px] tracking-[0.2em] uppercase font-medium">
                {bottomText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-campus-50 to-campus-100">
        <div className="flex-1 flex justify-center px-6 sm:px-10 pt-20 sm:pt-24 pb-10">
          <div className="w-full max-w-[440px] animate-slide-up">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-10">
              <Link to="/" className="inline-flex hover:opacity-90 transition-opacity">
                <Logo variant="dark" size="lg" />
              </Link>
            </div>

            <div className="space-y-1.5 mb-8">
              <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">{title}</h2>
              <p className="text-campus-400 text-[15px]">{description}</p>
            </div>

            {children}
          </div>
        </div>

        {/* Right-panel footer */}
        <footer className="border-t border-gray-100 py-5 px-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-campus-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-campus-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-campus-700 transition-colors">Support</a>
            </div>
            <p className="text-[10px] text-gray-300 tracking-wider uppercase">
              &copy; {new Date().getFullYear()} Academic Curator &bull; Institutional System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

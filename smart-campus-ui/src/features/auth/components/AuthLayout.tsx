import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  heading: string;
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
        {/* Geometric pattern background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/geometric-bg.png')" }}
        />
        {/* Gradient overlay — dark at top, slightly transparent at bottom for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f3a] via-[#0f2847]/90 to-[#132d4f]/80" />

        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-12">
          {/* Logo */}
          <Logo variant="light" size="lg" />

          {/* Main content */}
          <div className="space-y-6 -mt-8">
            <h1 className="text-[2.75rem] xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              {heading}
            </h1>
            <p className="text-campus-300 text-[15px] leading-relaxed max-w-[400px]">
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
              <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={image}
                  alt=""
                  className="w-full h-48 xl:h-56 object-cover"
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-[440px] animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Logo variant="dark" size="lg" />
          </div>

          <div className="space-y-1.5 mb-8">
            <h2 className="text-[1.75rem] font-bold tracking-tight text-campus-900">{title}</h2>
            <p className="text-campus-400 text-[15px]">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

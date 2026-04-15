import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function PublicFooter() {
  return (
    <footer className="bg-[#0c1f3a] text-white/80">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 space-y-4">
          <Logo variant="light" size="md" />
          <p className="text-sm text-white/50 max-w-sm leading-relaxed">
            One platform for campus facility bookings, incident tickets, notifications, and
            user management. Built for students, lecturers, and administrators.
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-4">
            Product
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
            <li><Link to="/#roles" className="hover:text-white transition-colors">For you</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-4">
            Company
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Sign in</Link></li>
            <li><Link to="/register" className="hover:text-white transition-colors">Get started</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p className="tracking-wider uppercase">
            &copy; {new Date().getFullYear()} Academic Curator &bull; Institutional Ecosystem
          </p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

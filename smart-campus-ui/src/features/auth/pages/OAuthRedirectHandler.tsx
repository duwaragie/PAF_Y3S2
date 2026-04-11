import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Logo } from '@/components/Logo';

export default function OAuthRedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      navigate('/login?error=oauth_failed');
      return;
    }

    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      const fetchProfileAndSetAuth = async () => {
        try {
          useAuthStore.getState().setAuth(token, refreshToken, {
            id: 0, name: '', email: '', picture: '',
            role: 'USER', authProvider: 'GOOGLE', emailVerified: true, createdAt: '', updatedAt: '',
          });
          const res = await authService.getMe();
          setAuth(token, refreshToken, res.data);
          navigate('/');
        } catch (err) {
          console.error("Failed fetching user profile", err);
          navigate('/login');
        }
      };
      fetchProfileAndSetAuth();
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <Logo variant="dark" size="lg" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Completing sign in...</p>
        </div>
      </div>
    </div>
  );
}

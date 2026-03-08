import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChefHat } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        await login(response.credential);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Login failed:', err);
      }
    },
    [login, navigate]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not set');
      return;
    }

    const initGoogle = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
          shape: 'pill',
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleCredentialResponse]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-warm-bg)] to-orange-50 flex flex-col items-center justify-center px-6">
      <div className="animate-fade-in text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-[var(--color-primary)] rounded-3xl flex items-center justify-center shadow-lg shadow-orange-200">
            <ChefHat size={40} className="text-white" />
          </div>
        </div>

        {/* Branding */}
        <h1 className="text-4xl font-bold text-stone-800 mb-2">
          Beli <span className="text-[var(--color-primary)]">at Home</span>
        </h1>
        <p className="text-lg text-stone-500 mb-2">Your kitchen, ranked.</p>
        <p className="text-sm text-stone-400 max-w-xs mx-auto mb-10">
          Rate your home-cooked dishes, discover recipes from friends, and find your all-time favorites.
        </p>

        {/* Google Sign-In Button */}
        <div className="flex justify-center mb-8">
          <div ref={buttonRef} />
        </div>

        {/* Decorative elements */}
        <div className="flex justify-center gap-3 text-2xl opacity-40 mt-12">
          <span>🍳</span>
          <span>🍝</span>
          <span>🥘</span>
          <span>🍰</span>
          <span>🥗</span>
        </div>
      </div>
    </div>
  );
}

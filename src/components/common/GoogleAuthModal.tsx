import React, { useState } from 'react';
import { X, ShieldCheck, Zap, ArrowRight, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import { BrandIcon } from './BrandLogo';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle, loginWithGoogleRedirect } = useProfile();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [redirectLoading, setRedirectLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setIsPopupBlocked(false);
      const success = await loginWithGoogle();
      if (success) {
        toast.success('Signed in with Google!', 'Welcome to your Connectly Studio.');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      console.error('[GoogleAuthModal] Error:', err);
      if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
        setIsPopupBlocked(true);
        setErrorMessage(null);
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not yet authorized in Firebase Console. Please add localhost to Authorized Domains in Firebase Auth.');
      } else {
        setErrorMessage(error.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectSignIn = async () => {
    try {
      setRedirectLoading(true);
      setErrorMessage(null);
      toast.info('Redirecting to Google...', 'You will be redirected back once signed in.');
      await loginWithGoogleRedirect();
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      console.error('[GoogleAuthModal] Redirect error:', err);
      setErrorMessage(error.message || 'Could not initiate redirect sign-in.');
      setRedirectLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 z-10 space-y-6 animate-fade-in-up">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandIcon sizeClass="w-12 h-12 rounded-2xl" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            Welcome to Connectly
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            One profile. Every connection. Sign in with Google to manage your verified links and QR codes.
          </p>
        </div>

        {/* Error message alert if needed */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Pop-up blocked recovery panel */}
        {isPopupBlocked && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-200">Browser Pop-up Blocked</h4>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  Your browser or an ad-blocker prevented the Google sign-in pop-up from opening. You can sign in directly using a full-page redirect:
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRedirectSignIn}
              disabled={redirectLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {redirectLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Redirecting to Google...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 text-slate-950" />
                  <span>Sign In with Page Redirect (No Pop-ups)</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-amber-500/20">
              <p className="font-medium text-slate-300">Or allow pop-ups in your browser:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                <li>Look for the <span className="text-amber-300 font-medium">Pop-up blocked</span> icon in the address bar and choose <strong>Always allow</strong>.</li>
                <li>If using Brave Shields or an ad-blocker, whitelist this site.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Main Google Sign-In Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || redirectLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Opening Google Sign-In...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {!isPopupBlocked && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleRedirectSignIn}
                disabled={loading || redirectLoading}
                className="text-xs text-slate-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 underline underline-offset-4"
              >
                <ExternalLink className="w-3 h-3 text-slate-400" />
                <span>Pop-ups blocked? Sign in via full-page redirect</span>
              </button>
            </div>
          )}
        </div>

        {/* Perks / Security Trust Bullets */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Instant verified creator profile</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Automatic Firebase cloud synchronization</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Free forever with unlimited social links & posters</span>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-slate-500 text-center">
          By continuing with Google, you agree to Connectly's Terms of Service and Privacy Policy.
        </p>

      </div>
    </div>
  );
};

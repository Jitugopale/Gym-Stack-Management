import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AuthButton,
  AuthField,
  AuthTitle,
} from '@/components/auth/AuthCard';
import { GymAuthCard } from '@/components/gym/GymAuthCard';
import { ROUTES, gymRoutes } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosInstance';
import { showToast, toastApiError } from '@/utils/toast';

export default function GymLoginPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { gymLogin, gymVerify2fa } = useAuth();
  const navigate = useNavigate();
  const preset = location.state || {};
  const [branding, setBranding] = useState(null);
  const [email, setEmail] = useState(preset.email || `owner@${slug}.local`);
  const [password, setPassword] = useState(preset.password || 'Password123!');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEmail(preset.email || `owner@${slug}.local`);
    setPassword(preset.password || 'Password123!');
    setChallenge(null);
    setOtp('');
  }, [slug, preset.email, preset.password]);

  useEffect(() => {
    api
      .get(`/gym/public/${slug}`)
      .then((res) => setBranding(res.data))
      .catch(() => showToast('Gym not found', 'error'));
  }, [slug]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!challenge) {
        const data = await gymLogin(slug, email, password);
        if (data.requires2fa) {
          setChallenge(data);
          if (data.otp) setOtp(data.otp);
          return;
        }
        navigate(gymRoutes.dashboard(slug), { replace: true });
        return;
      }

      await gymVerify2fa({
        slug,
        email,
        challengeId: challenge.challengeId,
        otp,
      });
      navigate(gymRoutes.dashboard(slug), { replace: true });
    } catch (err) {
      toastApiError(err, 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GymAuthCard branding={branding}>
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthTitle
          title={challenge ? 'Verify email code' : 'Desk sign in'}
          subtitle={
            challenge
              ? 'Owner 2FA required for this gym'
              : `Email + password for ${branding?.name || slug}`
          }
        />

        {!challenge ? (
          <>
            <AuthField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <AuthField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        ) : (
          <AuthField
            label="6-digit code"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        )}

        <AuthButton loading={busy} loadingText="Please wait…">
          {challenge ? 'Verify & continue' : 'Sign in'}
        </AuthButton>

        {challenge ? (
          <button
            type="button"
            className="text-sm text-[var(--muted-foreground)] underline"
            onClick={() => {
              setChallenge(null);
              setOtp('');
            }}
          >
            Back to password
          </button>
        ) : null}

        <Link
          to={ROUTES.HOME}
          className="inline-block text-sm text-[var(--muted-foreground)] hover:text-[var(--brand-ink)]"
        >
          ← Back home
        </Link>
      </form>
    </GymAuthCard>
  );
}

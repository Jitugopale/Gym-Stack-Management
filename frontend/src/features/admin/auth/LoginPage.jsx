import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AuthButton,
  AuthCard,
  AuthField,
  AuthTitle,
} from '@/components/auth/AuthCard';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import { toastApiError } from '@/utils/toast';

export default function LoginPage() {
  const { adminLogin, adminVerify2fa, appName, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@gymstack.local');
  const [password, setPassword] = useState('Password123!');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user?.realm === 'admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!challenge) {
        const data = await adminLogin(email, password);
        if (data.requires2fa) {
          setChallenge(data);
          if (data.otp) setOtp(data.otp);
          return;
        }
        navigate(ROUTES.DASHBOARD, { replace: true });
        return;
      }

      await adminVerify2fa({
        email,
        challengeId: challenge.challengeId,
        otp,
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      toastApiError(err, 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthTitle
          title={challenge ? 'Verify email code' : 'Admin sign in'}
          subtitle={
            challenge
              ? `Enter the 2FA code for ${appName}`
              : 'Email + password, then email 2FA for platform staff.'
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
    </AuthCard>
  );
}

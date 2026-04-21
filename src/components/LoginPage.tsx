import { useState } from 'react';
import type { LoginFormData, FormFieldError } from '../types/auth';
import { findUserByEmail, setSession, hashPassword } from '../utils/storage';
import {
  AuthPageShell,
  EyeOpenIcon,
  EyeClosedIcon,
  Spinner,
  inputClass,
} from './ui';

interface LoginPageProps {
  onAuthSuccess: () => void;
  onNavigateToSignup: () => void;
}

export default function LoginPage({
  onAuthSuccess,
  onNavigateToSignup,
}: LoginPageProps): React.ReactElement {
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormFieldError>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function validate(): FormFieldError {
    const errs: FormFieldError = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errs.password = 'Passwords must be at least 8 characters';
    }
    return errs;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError('');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const user = findUserByEmail(form.email);
    if (!user || user.passwordHash !== hashPassword(form.password)) {
      setServerError('Invalid email or password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setSession(user.id);
      setIsLoading(false);
      onAuthSuccess();
    }, 1200);
  }

  return (
    <AuthPageShell>
      <div className="w-full max-w-[560px] flex flex-col gap-8 p-8 bg-white rounded-[12px]">

        <h1 className="text-3xl font-bold text-grey-900">Login</h1>

        <div className="flex flex-col items-center gap-8">

          {serverError && (
            <p className="w-full text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="w-full space-y-8">

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="text-sm font-medium text-grey-500"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="text-sm font-medium text-grey-500"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass(!!errors.password) + ' pr-10'}
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-red-500">{errors.password}</p>
              ) : (
                <p className="text-sm text-right text-grey-500">
                  Passwords must be at least 8 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 w-full rounded-[8px] bg-grey-900 p-4 text-sm font-bold text-white transition hover:bg-grey-500 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Logging in…
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Navigate to signup */}
          <p className="text-sm text-center font-normal text-grey-500">
            Don&apos;t have an account?{' '}
            <button
              id="go-to-signup"
              type="button"
              onClick={onNavigateToSignup}
              className="font-bold text-grey-900 underline cursor-pointer"
            >
              Create account
            </button>
          </p>

        </div>
      </div>
    </AuthPageShell>
  );
}

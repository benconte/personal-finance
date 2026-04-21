import { useState } from 'react';
import type { SignupFormData, FormFieldError } from '../types/auth';
import {
  findUserByEmail,
  saveUser,
  setSession,
  hashPassword,
  generateId,
} from '../utils/storage';
import {
  AuthPageShell,
  EyeOpenIcon,
  EyeClosedIcon,
  Spinner,
  inputClass,
} from './ui';

interface SignupPageProps {
  onAuthSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function SignupPage({
  onAuthSuccess,
  onNavigateToLogin,
}: SignupPageProps): React.ReactElement {
  const [form, setForm] = useState<SignupFormData>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormFieldError>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function validate(): FormFieldError {
    const errs: FormFieldError = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
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
    if (findUserByEmail(form.email)) {
      setServerError('An account with this email already exists.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const user = {
        id: generateId(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        passwordHash: hashPassword(form.password),
        createdAt: new Date().toISOString(),
      };
      saveUser(user);
      setSession(user.id);
      setIsLoading(false);
      onAuthSuccess();
    }, 1200);
  }

  return (
    <AuthPageShell>
      <div className="w-full max-w-[560px] flex flex-col gap-8 p-8 bg-white rounded-[12px]">

        <h1 className="text-3xl font-bold text-grey-900">Sign Up</h1>

        <div className="flex flex-col items-center gap-8">

          {serverError && (
            <p className="w-full text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="w-full space-y-8">

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="signup-name" className="text-sm font-medium text-grey-500">
                Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium text-grey-500">
                Email
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="text-sm font-medium text-grey-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass(!!errors.password) + ' pr-10'}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
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
              id="signup-submit"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 w-full rounded-[8px] bg-grey-900 p-4 text-sm font-bold text-white transition hover:bg-grey-500 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Navigate to login */}
          <p className="text-sm text-center font-normal text-grey-500">
            Already have an account?{' '}
            <button
              id="go-to-login"
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-grey-900 underline cursor-pointer"
            >
              Login
            </button>
          </p>

        </div>
      </div>
    </AuthPageShell>
  );
}

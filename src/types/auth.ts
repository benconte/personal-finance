export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export type AuthPage = 'signup' | 'login';

export interface FormFieldError {
  name?: string;
  email?: string;
  password?: string;
}

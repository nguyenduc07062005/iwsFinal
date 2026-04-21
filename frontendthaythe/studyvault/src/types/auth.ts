export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export interface AuthUser {
  id?: string;
  name?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthOperationResult {
  message: string;
  authenticated?: boolean;
}

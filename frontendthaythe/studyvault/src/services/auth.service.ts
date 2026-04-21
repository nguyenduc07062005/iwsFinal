import type {
  AuthOperationResult,
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types/auth';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api';

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configuredBaseUrl?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const rawText = await response.text();
  const payload = rawText ? JSON.parse(rawText) : {};

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || 'Yêu cầu thất bại. Vui lòng thử lại.';
    throw new Error(message);
  }

  return payload as T;
}

function extractToken(payload: any): string | null {
  return (
    payload?.accessToken ??
    payload?.access_token ??
    payload?.token ??
    payload?.data?.accessToken ??
    payload?.data?.access_token ??
    payload?.data?.token ??
    null
  );
}

function extractUser(payload: any): AuthUser | null {
  return (
    payload?.user ??
    payload?.profile ??
    payload?.data?.user ??
    payload?.data?.profile ??
    null
  );
}

function extractMessage(payload: any, fallback: string): string {
  return payload?.message || payload?.data?.message || fallback;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await requestJson<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const token = extractToken(response);
  const user = extractUser(response);

  if (!token || !user) {
    throw new Error('Phản hồi đăng nhập chưa đầy đủ token hoặc thông tin người dùng.');
  }

  return { token, user };
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthOperationResult & { session?: AuthSession }> {
  const response = await requestJson<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const token = extractToken(response);
  const user = extractUser(response);

  return {
    message: extractMessage(response, 'Đăng ký thành công.'),
    authenticated: Boolean(token && user),
    session: token && user ? { token, user } : undefined,
  };
}

export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<AuthOperationResult> {
  const response = await requestJson<any>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    message: extractMessage(
      response,
      'Yêu cầu khôi phục mật khẩu đã được gửi thành công.',
    ),
  };
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<AuthOperationResult> {
  const response = await requestJson<any>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    message: extractMessage(response, 'Đặt lại mật khẩu thành công.'),
  };
}

export async function getProfile(token: string): Promise<AuthUser> {
  const response = await requestJson<any>('/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const user = extractUser(response) ?? response;
  if (!user?.email) {
    throw new Error('Không thể tải thông tin người dùng hiện tại.');
  }

  return user as AuthUser;
}

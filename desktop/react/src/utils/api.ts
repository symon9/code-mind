import type { AuthUser } from '../types';

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'https://code-mind-k63e.onrender.com';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface ParsedApiError {
  globalError?: string;
  fieldErrors: Record<string, string>;
}

/**
 * Parses NestJS HTTP exception responses (e.g., class-validator errors).
 */
export function parseApiError(data: any): ParsedApiError {
  const result: ParsedApiError = {
    fieldErrors: {},
  };

  if (!data) {
    result.globalError = 'An unexpected error occurred';
    return result;
  }

  // Handle single message string or array of error strings
  const messages: string[] = Array.isArray(data.message)
    ? data.message
    : typeof data.message === 'string'
    ? [data.message]
    : [];

  if (messages.length === 0) {
    result.globalError = data.error || 'Server error';
    return result;
  }

  messages.forEach((msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes('email')) {
      result.fieldErrors.email = msg;
    } else if (lower.includes('password')) {
      result.fieldErrors.password = msg;
    } else if (lower.includes('name')) {
      result.fieldErrors.name = msg;
    } else {
      if (!result.globalError) {
        result.globalError = msg;
      }
    }
  });

  return result;
}

/**
 * Login API Request (POST /auth/login)
 */
export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const parsed = parseApiError(data);
    const err: any = new Error(parsed.globalError || 'Login failed');
    err.parsed = parsed;
    err.statusCode = response.status;
    throw err;
  }

  return data;
}

/**
 * Register API Request (POST /auth/register)
 */
export async function registerApi(
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const parsed = parseApiError(data);
    const err: any = new Error(parsed.globalError || 'Registration failed');
    err.parsed = parsed;
    err.statusCode = response.status;
    throw err;
  }

  return data;
}

/**
 * User Preferences API Request (PATCH /users/me/preferences)
 */
export async function patchUserPreferencesApi(
  token: string,
  preferences: {
    theme?: string;
    fontSize?: number;
    fontFamily?: string;
    wordWrap?: string;
    autoSave?: boolean;
    tabSize?: number;
    aiProvider?: string;
    defaultLanguage?: string;
    ollamaUrl?: string;
    anthropicApiKey?: string;
    openaiApiKey?: string;
    geminiApiKey?: string;
  }
) {
  const response = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const parsed = parseApiError(data);
    const err: any = new Error(parsed.globalError || 'Failed to update preferences');
    err.parsed = parsed;
    throw err;
  }

  return response.json();
}

/**
 * AI Provider Connection Test API Request (POST /ai/test-connection)
 */
export async function testAiConnectionApi(
  token: string,
  params: {
    provider: string;
    apiKey?: string;
    ollamaUrl?: string;
    model?: string;
  }
): Promise<{
  success: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/ai/test-connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const parsed = parseApiError(data);
    const err: any = new Error(parsed.globalError || 'Connection test failed');
    err.parsed = parsed;
    throw err;
  }

  return data;
}


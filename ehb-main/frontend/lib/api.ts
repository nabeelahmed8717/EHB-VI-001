const EHB_API = process.env.NEXT_PUBLIC_EHB_API_URL ?? 'http://localhost:5000';

export const EHB_TOKEN_KEY = 'ehb_token';

/** Persist the EHB token in localStorage (client-side only) */
export function storeEhbToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EHB_TOKEN_KEY, token);
  }
}

/** Remove the EHB token from localStorage */
export function clearEhbToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(EHB_TOKEN_KEY);
  }
}

/** Read the stored EHB token (null on server or when absent) */
export function getStoredEhbToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EHB_TOKEN_KEY);
}

/**
 * Verify the stored EHB token with the backend.
 * Returns the user identity if valid, null if expired/revoked/missing.
 */
export async function verifyStoredToken(): Promise<{ ehb_user_id: string; email: string; full_name: string; registered_platforms: string[] } | null> {
  const token = getStoredEhbToken();
  if (!token) return null;
  try {
    const res = await fetch(`${EHB_API}/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearEhbToken(); // expired or revoked — purge it
      return null;
    }
    const data = (await res.json()) as { valid: boolean; user: { ehb_user_id: string; email: string; full_name: string; registered_platforms: string[] } };
    return data.valid ? data.user : null;
  } catch {
    return null; // network error — don't clear token, might be transient
  }
}

export interface RegisterBody {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResult {
  ehb_token: string;
  user?: {
    ehb_user_id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    is_verified: boolean;
    registered_platforms: string[];
  };
  /** Set when redirect_platform was provided */
  redirect_url?: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${EHB_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? 'Request failed');
  }
  return data as T;
}

export const ehbApi = {
  async register(body: RegisterBody, redirectPlatform?: string): Promise<AuthResult> {
    const qs = redirectPlatform ? `?redirect_platform=${redirectPlatform}` : '';
    const result = await post<AuthResult>(`/auth/register${qs}`, body);
    // Always persist the token so "already logged in" check works on next visit
    storeEhbToken(result.ehb_token);
    return result;
  },
  async login(body: LoginBody, redirectPlatform?: string): Promise<AuthResult> {
    const qs = redirectPlatform ? `?redirect_platform=${redirectPlatform}` : '';
    const result = await post<AuthResult>(`/auth/login${qs}`, body);
    storeEhbToken(result.ehb_token);
    return result;
  },
  async logout(token: string): Promise<void> {
    try {
      await fetch(`${EHB_API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // best-effort
    } finally {
      clearEhbToken();
    }
  },
};

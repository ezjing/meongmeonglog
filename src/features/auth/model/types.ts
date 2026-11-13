import type { AuthProvider } from '@/shared/api/database';

export interface AuthSession {
  userId: string;
  accessToken: string;
  provider: AuthProvider;
}

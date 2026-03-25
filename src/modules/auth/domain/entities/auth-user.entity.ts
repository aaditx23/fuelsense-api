export type AuthUserEntity = {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  profileImage: string | null;
  passwordHash: string;
};

export type AuthTokenPayload = {
  sub: string;
  userId: number;
  role: 'USER' | 'ADMIN';
  tokenType: 'admin_token' | 'user_token';
};

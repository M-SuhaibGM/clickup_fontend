export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}
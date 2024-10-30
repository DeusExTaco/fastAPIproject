
export interface User {
  id: number;
  username: string;
  roles: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (userId: number, username: string, roles: string[], token: string) => void;
  logout: () => void;
}
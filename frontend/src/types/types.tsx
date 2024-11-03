export interface DetailedUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
    status: string;
    user_name: string;
    created_at?: string;
    last_login?: string;
}

export interface UsersTableProps {
  users: DetailedUser[];
  currentUserId: number;
  isRefreshing: boolean;
  token: string | null;
  onDeleteUser: (userId: number) => void;
  onAuthError: () => void;
  setActiveComponent: (component: string) => void;
  onUserUpdated: () => void;
}
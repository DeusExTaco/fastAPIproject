export interface DetailedUser {
  id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string | string[];
  status: string;
  created_at?: string;
  last_login?: string;
}

export interface UsersTableProps {
  users: DetailedUser[];
  currentUserId: number;
  isRefreshing: boolean;
  token: string;
  onDeleteUser: (userId: number) => void;
  onAuthError: () => void;
  setActiveComponent?: (component: string) => void;
  onUserUpdated?: () => void;
}

export interface UserRowProps {
  user: DetailedUser;
  currentUserId: number;
  onEdit: (userId: number) => void;
  onDelete: (userId: number, userName: string) => void;
  index: number;
}

export interface TableHeaderProps {
  onSort: (field: keyof DetailedUser) => void;
  sortField: keyof DetailedUser;
  sortDirection: 'asc' | 'desc';
}

export interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

export interface TableRefreshProps {
  onRefresh: () => Promise<void>;
  isUpdating: boolean;
  lastUpdated: string | null;
  userId?: string | number;
}

export interface EmptyTableProps {
  startIndex: number;
  count: number;
  columnsCount: number;
}

export interface SortSettings {
  field: keyof DetailedUser;
  direction: 'asc' | 'desc';
}
import type { DetailedUser } from '../types/usersTypes';
import UsersTable from '../components/users/UsersTable';

interface RenderUsersContentProps {
  loading: boolean;
  error: string | null;
  token: string | null;
  users: DetailedUser[];
  currentUserId: number;
  isRefreshing: boolean;
  onDeleteUser: (userId: number) => void;
  onAuthError: () => void;
  onUserUpdated: () => void;
}

export const renderUsersContent = ({
  loading,
  error,
  token,
  users,
  currentUserId,
  isRefreshing,
  onDeleteUser,
  onAuthError,
  onUserUpdated
}: RenderUsersContentProps) => {
  if (loading) {
    return <div className="p-4 text-center">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!token) {
    return <div className="p-4 text-red-600">Authentication token not available</div>;
  }

  return (
    <UsersTable
      users={users}
      currentUserId={currentUserId}
      isRefreshing={isRefreshing}
      token={token}
      onDeleteUser={onDeleteUser}
      onAuthError={onAuthError}
      onUserUpdated={onUserUpdated}
    />
  );
};
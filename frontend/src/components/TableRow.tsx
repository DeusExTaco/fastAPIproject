// components/TableRow.tsx
import React from 'react';
import { DetailedUser } from '../types/types';

interface TableRowProps {
  user: DetailedUser;
  currentUserId: number;
  onEdit: (userId: number) => void;
  onDelete: (userId: number, userName: string) => void;
  index: number;
}

const TableRow: React.FC<TableRowProps> = ({
  user,
  currentUserId,
  onEdit,
  onDelete,
  index
}) => {
  const getBadgeClass = (roles: string | string[]) => {
    // Convert roles to array if it's a string
    const roleList = Array.isArray(roles)
      ? roles.map(r => r.toLowerCase())
      : roles.toString().toLowerCase().split(',').map(r => r.trim());

    if (roleList.includes('admin')) return 'bg-red-100 text-red-800';
    if (roleList.includes('moderator')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  // Add debug logging
  console.log('TableRow rendering with user:', {
    id: user.id,
    roles: user.roles,
    typeof_roles: typeof user.roles
  });

  return (
    <tr className={`transition-colors hover:bg-gray-200 ${
      index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
    }`}>
      <td className="p-4 border-b border-gray-200">
        <div>
          <span className="text-sm text-gray-700 font-normal">
            {user.first_name} {user.last_name}
          </span>
          <span className="block text-sm text-gray-700 font-normal opacity-70">
            {user.user_name}
          </span>
        </div>
      </td>
      <td className="p-4 border-b border-gray-200">
        <span className="text-sm text-gray-700 font-normal">
          {user.email}
        </span>
      </td>
      <td className="p-4 border-b border-gray-200">
        <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(user.roles)}`}>
          {Array.isArray(user.roles)
            ? user.roles.join(', ').toUpperCase()
            : String(user.roles).toUpperCase()}
        </div>
      </td>
      <td className="p-4 border-b border-gray-200">
        <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
          {user.status}
        </div>
      </td>
      <td className="p-4 border-b border-gray-200">
        <span className="text-sm text-gray-700 font-normal">
          {formatDate(user.created_at)}
        </span>
      </td>
      <td className="p-4 border-b border-gray-200">
        <span className="text-sm text-gray-700 font-normal">
          {formatDate(user.last_login)}
        </span>
      </td>
      <td className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(user.id)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(user.id, user.user_name)}
            className={`text-red-600 hover:text-red-700 text-sm font-medium ${
              user.id === currentUserId ? 'opacity-50 cursor-default pointer-events-none' : ''
            }`}
            disabled={user.id === currentUserId}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
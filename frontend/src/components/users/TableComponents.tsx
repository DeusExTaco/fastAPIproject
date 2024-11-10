import React from 'react';
import {
  DetailedUser,
  TableHeaderProps,
  UserRowProps,
  EmptyTableProps
} from '../../types/usersTypes';
import { getBadgeClass, getStatusBadgeClass, formatDate } from '../../utils/usersUtils';

const TABLE_CELL_BASE_CLASSES = "p-4 border-b border-gray-200";
const TABLE_ROW_BASE_CLASSES = "transition-colors hover:bg-gray-200";
const TABLE_TEXT_BASE_CLASSES = "text-sm text-gray-700 font-normal";

export const TABLE_COLUMNS = [
  { label: "User", field: "user_name" as keyof DetailedUser },
  { label: "Email", field: "email" as keyof DetailedUser },
  { label: "Role", field: "roles" as keyof DetailedUser },
  { label: "Status", field: "status" as keyof DetailedUser },
  { label: "Created", field: "created_at" as keyof DetailedUser },
  { label: "Last Login", field: "last_login" as keyof DetailedUser },
  { label: "Actions", field: null }
] as const;

const SortIcon: React.FC<{ field: keyof DetailedUser; sortField: keyof DetailedUser | null; sortDirection: 'asc' | 'desc' }> = ({
  field,
  sortField,
  sortDirection
}) => {
  if (sortField !== field) return <span className="ml-1">↕</span>;
  return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
};

const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <td className={`${TABLE_CELL_BASE_CLASSES} ${className}`}>
    {children}
  </td>
);

export const TableHeader: React.FC<TableHeaderProps> = ({ onSort, sortField, sortDirection }) => (
  <thead className="bg-gray-100">
    <tr>
      {TABLE_COLUMNS.map(({ label, field }) => (
        <th
          key={label}
          onClick={() => field && onSort(field)}
          className={`sticky top-0 ${TABLE_CELL_BASE_CLASSES} bg-gray-100 transition-colors hover:bg-gray-200 ${
            !field ? '' : 'cursor-pointer'
          }`}
          style={{ position: 'sticky', top: 0, zIndex: 20 }}
        >
          <span className="flex items-center justify-between gap-2 font-semibold text-sm text-gray-700 leading-none">
            {label}
            {field && <SortIcon field={field} sortField={sortField} sortDirection={sortDirection} />}
          </span>
        </th>
      ))}
    </tr>
  </thead>
);

export const TableRow: React.FC<UserRowProps> = ({
  user,
  currentUserId,
  onEdit,
  onDelete,
  index
}) => {
  return (
    <tr className={`${TABLE_ROW_BASE_CLASSES} ${
      index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
    }`}>
      <TableCell>
        <div>
          <span className={TABLE_TEXT_BASE_CLASSES}>
            {user.first_name} {user.last_name}
          </span>
          <span className={`${TABLE_TEXT_BASE_CLASSES} block opacity-70`}>
            {user.user_name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className={TABLE_TEXT_BASE_CLASSES}>
          {user.email}
        </span>
      </TableCell>
      <TableCell>
        <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(user.roles)}`}>
          {Array.isArray(user.roles)
            ? user.roles.join(', ').toUpperCase()
            : String(user.roles).toUpperCase()}
        </div>
      </TableCell>
      <TableCell>
        <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
          {user.status}
        </div>
      </TableCell>
      <TableCell>
        <span className={TABLE_TEXT_BASE_CLASSES}>
          {formatDate(user.created_at)}
        </span>
      </TableCell>
      <TableCell>
        <span className={TABLE_TEXT_BASE_CLASSES}>
          {formatDate(user.last_login)}
        </span>
      </TableCell>
      <TableCell>
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
      </TableCell>
    </tr>
  );
};

export const EmptyTableRows: React.FC<EmptyTableProps> = ({ startIndex, count, columnsCount }) => (
  <>
    {Array(count).fill(null).map((_, index) => {
      const rowNum = startIndex + index;
      return (
        <tr
          key={`empty-row-${rowNum}`}
          className={rowNum % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
        >
          {Array(columnsCount).fill(null).map((_, colIndex) => (
            <TableCell key={`empty-cell-${rowNum}-${colIndex}`}>
              <div className="h-8"></div>
            </TableCell>
          ))}
        </tr>
      );
    })}
  </>
);
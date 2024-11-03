// components/TableHeader.tsx
import React from 'react';
import { DetailedUser } from '../types/types.tsx';

interface TableHeaderProps {
  onSort: (field: keyof DetailedUser) => void;
  sortField: keyof DetailedUser;
  sortDirection: 'asc' | 'desc';
}

type TableColumn = {
  label: string;
  field: keyof DetailedUser | null;
};

const TABLE_COLUMNS: TableColumn[] = [
  { label: "User", field: "user_name" },
  { label: "Email", field: "email" },
  { label: "Role", field: "roles" },
  { label: "Status", field: "status" },
  { label: "Created", field: "created_at" },
  { label: "Last Login", field: "last_login" },
  { label: "Actions", field: null }
] as const;

const TableHeader: React.FC<TableHeaderProps> = ({ onSort, sortField, sortDirection }) => {
  const SortIcon = ({ field }: { field: keyof DetailedUser }) => {
    if (sortField !== field) return <span className="ml-1">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <thead className="bg-gray-100">
      <tr>
        {TABLE_COLUMNS.map(({ label, field }) => (
          <th
            key={label}
            onClick={() => field && onSort(field)}
            className={`sticky top-0 z-10 border-b border-gray-200 bg-gray-100 p-4 transition-colors hover:bg-gray-200 ${
              !field ? '' : 'cursor-pointer'
            }`}
            style={{ position: 'sticky', top: 0 }}
          >
            <span className="flex items-center justify-between gap-2 font-semibold text-sm text-gray-700 leading-none">
              {label}
              {field && <SortIcon field={field} />}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
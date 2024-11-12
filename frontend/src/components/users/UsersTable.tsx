import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Button, Card } from "@material-tailwind/react";

import { useUserData } from '../../hooks/useUserData';
import { TableHeader, TableRow, EmptyTableRows } from './TableComponents';
import TableRefreshControls from './TableRefreshControls';
import DeleteModal from '../users/DeleteModal';
import Pagination from './Pagination';
import { AddUserDialog } from '../users/AddUserDiaglog';
import { EditUserDialog } from '../users/EditUserDialog';
import ErrorBoundary from '../errors/ErrorBoundary';

import { deleteUser } from '../../services/usersService';
import { loadSortSettings, saveSortSettings, sortUsers, loadRefreshSettings } from '../../utils/usersUtils';
import type { UsersTableProps, DetailedUser, SortSettings } from '../../types/usersTypes';

const UsersTable: React.FC<UsersTableProps> = ({
  users: initialUsers,
  currentUserId,
  isRefreshing,
  token,
  onDeleteUser,
  onAuthError
}) => {
  const {
    users,
    isUpdating,
    lastUpdated,
    fetchUsers,
    error: userDataError,
    resetPollingTimer,
    setIsPolling
  } = useUserData(initialUsers, token, onAuthError, currentUserId);

  // State management
  const [sort, setSort] = useState<SortSettings>(() => loadSortSettings(currentUserId));
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; userName: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const itemsPerPage = 10;

   // Only start polling if enabled in refresh settings
  useEffect(() => {
    if (token) {
      const settings = loadRefreshSettings(currentUserId);
      if (settings.enabled) {
        setIsPolling(true);
      }
    }
    return () => setIsPolling(false);
  }, [token, setIsPolling, currentUserId]);

  const handleRefresh = useCallback(async () => {
    if (!token) return;
    try {
      await fetchUsers(true); // Show loading state for manual refresh
      resetPollingTimer(); // Reset polling timer after manual refresh
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [token, fetchUsers, resetPollingTimer]);

  const handleSort = useCallback((field: keyof DetailedUser) => {
    const newSettings = {
      field,
      direction: field === sort.field ? (sort.direction === 'asc' ? 'desc' : 'asc') : 'asc'
    } as const;
    setSort(newSettings);
    saveSortSettings(newSettings, currentUserId);
  }, [sort.field, sort.direction, currentUserId]);

  const handleDeleteClick = useCallback((userId: number, userName: string) => {
    setUserToDelete({ id: userId, userName });
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id, token);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      onDeleteUser?.(userToDelete.id);
      await fetchUsers(true); // Immediate refresh after delete
      resetPollingTimer(); // Reset polling timer after operation
    } catch (error) {
      if (error instanceof Error) {
        setDeleteError(error.message === 'AUTH_ERROR' ? 'Authentication failed' :
                      error.message === 'PERMISSION_ERROR' ? 'Permission denied' : error.message);
        if (error.message === 'AUTH_ERROR') onAuthError();
      }
    } finally {
      setIsDeleting(false);
    }
  }, [userToDelete, token, onDeleteUser, fetchUsers, resetPollingTimer, onAuthError]);

  const handleEditClick = useCallback((userId: number) => {
  // Prevent setting the same ID multiple times
    setEditingUserId(current => current === userId ? current : userId);
  }, []);

  const handleEditSuccess = useCallback(async () => {
    setEditingUserId(null);
    await handleRefresh();
  }, [handleRefresh]);

  const handleEditClose = useCallback(() => {
    setEditingUserId(null);
  }, []);

  // Data processing
  const sortedUsers = sortUsers(users, sort);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const currentUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!users.length) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-gray-500">No users found.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <>
        {/* Refresh Controls Card */}
        <Card
          className="w-full bg-white shadow-md"
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <div className="px-6 py-4">
            <TableRefreshControls
              onRefresh={handleRefresh}
              isUpdating={isUpdating}
              lastUpdated={lastUpdated}
              userId={currentUserId}
              setIsPolling={setIsPolling}
            />
          </div>
        </Card>

        {/* Main Users Management Card */}
        <Card
            className="w-full bg-white shadow-md mt-6"
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
        >
          <div className="p-6">
            {/* Error Alert */}
            {userDataError && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{userDataError}</p>
              </div>
            )}

            {/* Create User Button */}
            <div className="mb-6">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2"
                color="blue"
                placeholder={""}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </div>

            {/* Users Table */}
            <div className={`mb-6 transition-opacity duration-200 ${
              isRefreshing || isUpdating ? 'opacity-50' : 'opacity-100'
            }`}>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max table-auto">
                    <TableHeader
                      onSort={handleSort}
                      sortField={sort.field}
                      sortDirection={sort.direction}
                    />
                    <tbody>
                      {currentUsers.map((user, index) => (
                        <TableRow
                          key={user.id}
                          user={user}
                          currentUserId={currentUserId}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                          index={index}
                        />
                      ))}
                      {currentUsers.length < itemsPerPage && (
                        <EmptyTableRows
                          startIndex={currentUsers.length}
                          count={itemsPerPage - currentUsers.length}
                          columnsCount={7}
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
              />
            </div>
          </div>
        </Card>

        {/* Modals */}
        <AddUserDialog
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={async () => {
            setIsCreateModalOpen(false);
            await handleRefresh();
          }}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleConfirmDelete}
          userName={userToDelete?.userName ?? ''}
          isDeleting={isDeleting}
          error={deleteError}
        />

        {editingUserId !== null && (
         <EditUserDialog
            open={editingUserId !== null}
            onClose={handleEditClose}
            onSuccess={handleEditSuccess}
            userId={editingUserId ?? 0}
            token={token}
          />
        )}
      </>
    </ErrorBoundary>
  );
};

export default UsersTable;
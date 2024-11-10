import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody
} from "@material-tailwind/react";

import { useUserData } from '../../hooks/useUserData';
import { TableHeader, TableRow, EmptyTableRows } from './TableComponents';
import TableRefreshControls from './TableRefreshControls';
import DeleteModal from '../users/DeleteModal';
import Pagination from '../users/Pagination';
import Signup from '../Signup';
import { EditUser } from '../users/EditUser';

import { deleteUser } from '../../services/usersService';
import { loadSortSettings, saveSortSettings, sortUsers } from '../../utils/usersUtils';
import type { UsersTableProps, DetailedUser, SortSettings } from '../../types/usersTypes';

const UsersTable: React.FC<UsersTableProps> = ({
  users: initialUsers,
  currentUserId,
  isRefreshing,
  token,
  onDeleteUser,
  onAuthError
}) => {
  // State management
  const [sort, setSort] = useState<SortSettings>(() => loadSortSettings(currentUserId));
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; userName: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    users,
    isUpdating,
    lastUpdated,
    fetchUsers,
    error: userDataError,
    resetPollingTimer,
    setIsPolling
  } = useUserData(initialUsers, token, onAuthError);

  const itemsPerPage = 10;

  // Enable polling and initial fetch when component mounts and token is available
  useEffect(() => {
    const initializeTable = async () => {
      if (!token) {
        console.log('Initialization skipped - no token available');
        return;
      }

      try {
        await fetchUsers(true); // Force initial fetch
        setIsPolling(true); // Enable polling after initial fetch
      } catch (error) {
        console.error('Failed to initialize table:', error);
      }
    };

    void initializeTable();

    // Cleanup on unmount
    return () => {
      setIsPolling(false);
    };
  }, [token, fetchUsers, setIsPolling]);

  // Error handling effect
  useEffect(() => {
    if (userDataError) {
      setFetchError(userDataError);
    } else {
      setFetchError(null);
    }
  }, [userDataError]);

  // Page reset when users change
  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  // Immediate refresh handler with debounce check
  const refreshTable = useCallback(async () => {
    if (!token) {
      console.log('Refresh skipped - no token available');
      return;
    }

    try {
      await fetchUsers(true); // Force immediate refresh
      resetPollingTimer(); // Reset polling timer
    } catch (error) {
      console.error('Failed to refresh table:', error);
      throw error; // Propagate error for handling in UI
    }
  }, [token, fetchUsers, resetPollingTimer]);

  // Sort handlers
  const handleSort = useCallback((field: keyof DetailedUser) => {
    const newSettings = {
      field,
      direction: field === sort.field
        ? sort.direction === 'asc' ? 'desc' : 'asc'
        : 'asc'
    } as const;

    setSort(newSettings);
    saveSortSettings(newSettings, currentUserId);
  }, [sort.field, sort.direction, currentUserId]);

  // Delete handlers
  const handleDeleteClick = useCallback((userId: number, userName: string) => {
    setUserToDelete({ id: userId, userName });
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete || !token) {
      setDeleteError('Authentication token missing');
      onAuthError();
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteUser(userToDelete.id, token);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await refreshTable(); // Immediate refresh after delete
      onDeleteUser?.(userToDelete.id);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'AUTH_ERROR') {
          onAuthError();
        } else if (error.message === 'PERMISSION_ERROR') {
          setDeleteError('You do not have permission to delete users');
        } else {
          setDeleteError(error.message);
        }
      }
    } finally {
      setIsDeleting(false);
    }
  }, [userToDelete, token, refreshTable, onDeleteUser, onAuthError]);

  // Success handlers with immediate refresh
  const handleEditSuccess = useCallback(async () => {
    setEditingUserId(null);
    try {
      await refreshTable(); // Immediate refresh after edit
    } catch (error) {
      console.error('Failed to refresh after edit:', error);
    }
  }, [refreshTable]);

  const handleCreateSuccess = useCallback(async () => {
    setIsCreateModalOpen(false);
    try {
      await refreshTable(); // Immediate refresh after create
    } catch (error) {
      console.error('Failed to refresh after create:', error);
    }
  }, [refreshTable]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshTable();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  }, [refreshTable]);

  // Sort and paginate users
  const sortedUsers = sortUsers(users, sort);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const currentUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Early return for empty state
  if (!users.length) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-gray-500">No users found.</p>
      </div>
    );
  }

  return (
    <div>
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{fetchError}</p>
        </div>
      )}

      <div className={`w-full shadow-lg transition-opacity duration-200 ${
        isRefreshing || isUpdating ? 'opacity-50' : 'opacity-100'
      }`}>
        <div className="w-full bg-white rounded-lg">
          <TableRefreshControls
            onRefresh={handleManualRefresh}
            isUpdating={isUpdating}
            lastUpdated={lastUpdated}
            userId={currentUserId}
          />

          <div className="px-4 pb-4">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 hover:bg-blue-800"
              color="blue"
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
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
                      onEdit={setEditingUserId}
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
          />
        </div>

        {/* Modals */}
        <Dialog
            open={isCreateModalOpen}
            handler={() => setIsCreateModalOpen(false)}
            className="bg-white"
            size="sm"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}        >
          <DialogHeader
              className="border-b border-gray-200 px-6 py-4"
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
          >
            Create New User
          </DialogHeader>
          <DialogBody
              className="p-6"
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
          >
            <Signup
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogBody>
        </Dialog>

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

        {editingUserId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 w-full max-w-4xl">
              <EditUser
                userId={editingUserId}
                onClose={() => setEditingUserId(null)}
                onSuccess={handleEditSuccess}
                token={token}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTable;
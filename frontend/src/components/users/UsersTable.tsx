import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useUserData } from '../hooks/useUserData';
import TableHeader from '../components/TableHeader';
import TableRow from '../components/TableRow';
import DeleteModal from '../components/DeleteModal';
import Pagination from '../components/Pagination';
import Signup from './Signup';
import { EditUser } from './EditUser';
import { UsersTableProps, DetailedUser } from '../types/types';
import TableRefreshControls from '../components/TableRefreshControls';
import { UserPlus } from 'lucide-react';
import { Button } from "@material-tailwind/react";
import { loadSortSettings, saveSortSettings } from '../utils/sortSettings';
import EmptyTableRows from '../components/EmptyTableRows';


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
        fetchUsers
    } = useUserData(initialUsers, token, onAuthError);

    const [sort, setSort] = useState(() => loadSortSettings(currentUserId));
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: number; userName: string } | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [localUsers, setLocalUsers] = useState(initialUsers);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const itemsPerPage = 10;

    useEffect(() => {
        setLocalUsers(users);
    }, [users]);

    useEffect(() => {
        let isMounted = true;

        const initFetch = async () => {
            try {
                if (isMounted) {
                    await fetchUsers();
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error in initial fetch:', error);
                    setFetchError(error instanceof Error ? error.message : 'Failed to fetch users');
                }
            }
        };

        void initFetch();

        return () => {
            isMounted = false;
        };
    }, [fetchUsers]);

    const refreshUsers = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    onAuthError();
                }
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setLocalUsers(data);
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    };

    // const handleRefresh = async () => {
    //     try {
    //         await fetchUsers(true); // Add the force parameter here
    //         setFetchError(null);
    //     } catch (error) {
    //         console.error('Error during manual refresh:', error);
    //         setFetchError(error instanceof Error ? error.message : 'Failed to fetch users');
    //     }
    // };

    const handleSort = (field: keyof DetailedUser) => {
        const newSettings = {
            field,
            direction: field === sort.field
                ? sort.direction === 'asc' ? 'desc' : 'asc'
                : 'asc'
        } as const;

        setSort(newSettings);
        saveSortSettings(newSettings, currentUserId);
    };

    // Add an effect to reload sort settings when user changes
    useEffect(() => {
        setSort(loadSortSettings(currentUserId));
    }, [currentUserId]);

    const handleEditSuccess = async () => {
        setEditingUserId(null);
        try {
            await refreshUsers();
            setFetchError(null);
        } catch (error) {
            console.error('Error refreshing after edit:', error);
            setFetchError(error instanceof Error ? error.message : 'Failed to fetch users');
        }
    };

    const handleCreateSuccess = async () => {
        setIsCreateModalOpen(false);
        try {
            await refreshUsers();
            setFetchError(null);
        } catch (error) {
            console.error('Error refreshing after create:', error);
            setFetchError(error instanceof Error ? error.message : 'Failed to fetch users');
        }
    };

    const handleDeleteClick = (userId: number, userName: string) => {
        setUserToDelete({ id: userId, userName });
        setIsDeleteModalOpen(true);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete || !token) {
            setDeleteError('Authentication token missing');
            onAuthError();
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`http://localhost:8000/api/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 403) {
                    setDeleteError('You do not have permission to delete users');
                    return;
                } else if (response.status === 401) {
                    setDeleteError('Authentication failed. Please log in again.');
                    onAuthError();
                    return;
                }
                setDeleteError(errorData.detail || 'Failed to delete user');
                return;
            }

            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            setDeleteError(null);

            try {
                await refreshUsers();
            } catch (error) {
                console.error('Error refreshing after delete:', error);
            }

            if (onDeleteUser) {
                onDeleteUser(userToDelete.id);
            }
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    const sortedUsers = [...localUsers].sort((a, b) => {
        let aValue = a[sort.field];
        let bValue = b[sort.field];

        if (aValue === null || aValue === undefined) return sort.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sort.direction === 'asc' ? 1 : -1;

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = (bValue as string).toLowerCase();
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = sortedUsers.slice(startIndex, endIndex);

    if (!localUsers || localUsers.length === 0) {
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
                isRefreshing ? 'opacity-50' : 'opacity-100'
            }`}>
                <div className="w-full bg-white rounded-lg">
                    {/* New Refresh Controls */}
                   <TableRefreshControls
                        onRefresh={() => fetchUsers()}
                        isUpdating={isUpdating}
                        lastUpdated={lastUpdated}
                        userId={currentUserId}
                    />

                    {/* Create User Button */}
                    <div className="px-4 pb-4">
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 hover:bg-blue-800"
                            color={"blue"}
                            placeholder=""
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
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

                <Dialog
                    as="div"
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    className="relative z-50"
                >
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">
                                        Create New User
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <Signup
                                        onSuccess={handleCreateSuccess}
                                        onCancel={() => setIsCreateModalOpen(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
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
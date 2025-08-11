import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Plus,
    Download,
    RefreshCw,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Shield,
    Settings,
    Lock,
    Unlock,
    Crown,
    UserCog,
    Briefcase
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { userService } from '../../api';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Add user form state
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
        role: 'STAFF',
        status: 'ACTIVE'
    });
    const [addUserErrors, setAddUserErrors] = useState({});

    const roleChoices = [
        { value: 'ADMIN', label: 'Administrator', icon: Crown, color: 'text-purple-600' },
        { value: 'MANAGER', label: 'Manager', icon: UserCog, color: 'text-blue-600' },
        { value: 'STAFF', label: 'Staff Member', icon: Briefcase, color: 'text-green-600' }
    ];

    const statusChoices = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' }
    ];

    // Load users on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await userService.getUsers();
            setUsers(response.data || response);
        } catch (err) {
            toast.error('Failed to load users. Please try again.');
            console.error('Error loading users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (user) => {
        setSelectedUserDetail(user);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedUserDetail(null);
    };

    const handleAddUser = () => {
        setShowAddUserModal(true);
        setNewUser({
            name: '',
            email: '',
            phone: '',
            password: '',
            password_confirm: '',
            role: 'STAFF',
            status: 'ACTIVE'
        });
        setAddUserErrors({});
    };

    const closeAddUserModal = () => {
        setShowAddUserModal(false);
        setNewUser({
            name: '',
            email: '',
            phone: '',
            password: '',
            password_confirm: '',
            role: 'STAFF',
            status: 'ACTIVE'
        });
        setAddUserErrors({});
    };

    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));

        if (addUserErrors[name]) {
            setAddUserErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateAddUserForm = () => {
        const errors = {};

        if (!newUser.name.trim()) errors.name = 'Name is required';
        if (!newUser.email.trim()) errors.email = 'Email is required';
        if (!/\S+@\S+\.\S+/.test(newUser.email)) errors.email = 'Please enter a valid email';
        if (!newUser.phone.trim()) errors.phone = 'Phone is required';
        if (!newUser.password) errors.password = 'Password is required';
        if (newUser.password.length < 8) errors.password = 'Password must be at least 8 characters';
        if (newUser.password !== newUser.password_confirm) {
            errors.password_confirm = 'Passwords do not match';
        }

        setAddUserErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!validateAddUserForm()) return;

        setIsCreating(true);
        try {
            const userData = {
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                password: newUser.password,
                role: newUser.role,
                status: newUser.status
            };

            await userService.createUser(userData);
            toast.success('User created successfully!');
            closeAddUserModal();
            loadUsers(); // Refresh the list
        } catch (err) {
            toast.error('Failed to create user. Please try again.');
            console.error('Error creating user:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const refreshUsers = async () => {
        setIsRefreshing(true);
        await loadUsers();
        setIsRefreshing(false);
    };


    const exportUsers = () => {
        const csvContent = [
            ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created Date'],
            ...filteredUsers.map(user => [
                user.name,
                user.email,
                user.phone,
                user.role,
                user.status,
                new Date(user.created_at || Date.now()).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.user_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'INACTIVE':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleColor = (role) => {
        const roleConfig = roleChoices.find(r => r.value === role);
        return roleConfig ? roleConfig.color : 'text-gray-600';
    };

    const getRoleIcon = (role) => {
        const roleConfig = roleChoices.find(r => r.value === role);
        return roleConfig ? roleConfig.icon : User;
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Users</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadUsers}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                                <p className="text-sm text-gray-600">Manage system users and permissions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshUsers}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportUsers}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                            <button
                                onClick={handleAddUser}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Shield className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Roles</option>
                                    {roleChoices.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Total: {filteredUsers.length} users</span>

                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading users...</p>
                            </div>
                        </div>
                    ) : currentUsers.length === 0 ? (
                        <div className="text-center py-20">
                            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No users have been created yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentUsers.map((user, index) => {
                                            const RoleIcon = getRoleIcon(user.role);
                                            return (
                                                <tr key={user.user_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-500">
                                                        #{index + 1}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-amber-800">
                                                                        {user.name?.[0]?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {user.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {user.user_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                                                {user.email}
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                                                {user.phone || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <RoleIcon className={`h-4 w-4 mr-2 ${getRoleColor(user.role)}`} />
                                                            <span className="text-sm text-gray-900">
                                                                {roleChoices.find(r => r.value === user.role)?.label || user.role}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                                                            {user.status === 'ACTIVE' ? (
                                                                <UserCheck className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <UserX className="h-3 w-3 mr-1" />
                                                            )}
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Calendar className="h-4 w-4 mr-2" />
                                                            {new Date(user.created_at || Date.now()).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => handleViewDetails(user)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Eye className="h-4 w-4 mr-3" />
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastUser, filteredUsers.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredUsers.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>
                                                {[...Array(totalPages)].map((_, index) => {
                                                    const page = index + 1;
                                                    if (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        (page >= currentPage - 2 && page <= currentPage + 2)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                                    ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    } else if (
                                                        (page === currentPage - 3 && currentPage > 4) ||
                                                        (page === currentPage + 3 && currentPage < totalPages - 3)
                                                    ) {
                                                        return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                                                    }
                                                    return null;
                                                })}
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Click outside to close action menu */}
            {showActionMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowActionMenu(null)}
                />
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Plus className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                            </div>
                            <button
                                onClick={closeAddUserModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <form onSubmit={handleCreateUser} className="p-6">
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newUser.name}
                                        onChange={handleNewUserChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${addUserErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter full name"
                                    />
                                    {addUserErrors.name && <p className="text-red-500 text-xs mt-1">{addUserErrors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newUser.email}
                                        onChange={handleNewUserChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${addUserErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter email address"
                                    />
                                    {addUserErrors.email && <p className="text-red-500 text-xs mt-1">{addUserErrors.email}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={newUser.phone}
                                        onChange={handleNewUserChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${addUserErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter phone number"
                                    />
                                    {addUserErrors.phone && <p className="text-red-500 text-xs mt-1">{addUserErrors.phone}</p>}
                                </div>

                                {/* Role and Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            name="role"
                                            value={newUser.role}
                                            onChange={handleNewUserChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            {roleChoices.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={newUser.status}
                                            onChange={handleNewUserChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            {statusChoices.map(status => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={newUser.password}
                                        onChange={handleNewUserChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${addUserErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter password"
                                    />
                                    {addUserErrors.password && <p className="text-red-500 text-xs mt-1">{addUserErrors.password}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password_confirm"
                                        value={newUser.password_confirm}
                                        onChange={handleNewUserChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${addUserErrors.password_confirm ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Confirm password"
                                    />
                                    {addUserErrors.password_confirm && <p className="text-red-500 text-xs mt-1">{addUserErrors.password_confirm}</p>}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeAddUserModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <div className="flex items-center">
                                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showDetailModal && selectedUserDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                                    <span className="text-lg font-medium text-amber-800">
                                        {selectedUserDetail.name?.[0]?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {selectedUserDetail.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">User Details</p>
                                </div>
                            </div>
                            <button
                                onClick={closeDetailModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Status and Basic Info */}
                            <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">User ID: {selectedUserDetail.user_id}</h4>
                                        <p className="text-sm text-gray-600">System User Account</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedUserDetail.status)}`}>
                                            {selectedUserDetail.status === 'ACTIVE' ? (
                                                <UserCheck className="h-4 w-4 mr-2" />
                                            ) : (
                                                <UserX className="h-4 w-4 mr-2" />
                                            )}
                                            {selectedUserDetail.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Calendar className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedUserDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        {(() => {
                                            const RoleIcon = getRoleIcon(selectedUserDetail.role);
                                            return <RoleIcon className={`h-6 w-6 mx-auto mb-2 ${getRoleColor(selectedUserDetail.role)}`} />;
                                        })()}
                                        <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {roleChoices.find(r => r.value === selectedUserDetail.role)?.label || selectedUserDetail.role}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Information Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Contact Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Mail className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Contact Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <Mail className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</p>
                                                <p className="text-sm text-gray-900 break-all">{selectedUserDetail.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <Phone className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</p>
                                                <p className="text-sm text-gray-900">{selectedUserDetail.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Shield className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Account Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</p>
                                            <p className="text-sm text-gray-900 font-mono">{selectedUserDetail.user_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</p>
                                            <div className="flex items-center mt-1">
                                                {(() => {
                                                    const RoleIcon = getRoleIcon(selectedUserDetail.role);
                                                    return <RoleIcon className={`h-4 w-4 mr-2 ${getRoleColor(selectedUserDetail.role)}`} />;
                                                })()}
                                                <span className="text-sm text-gray-900">
                                                    {roleChoices.find(r => r.value === selectedUserDetail.role)?.label || selectedUserDetail.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Status</p>
                                            <p className="text-sm text-gray-900">{selectedUserDetail.status}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Timeline */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Account Timeline</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedUserDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</p>
                                                <p className="text-sm text-gray-900">
                                                    {selectedUserDetail.updated_at
                                                        ? new Date(selectedUserDetail.updated_at).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })
                                                        : 'Never updated'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${selectedUserDetail.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</p>
                                                <p className="text-sm text-gray-900">{selectedUserDetail.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Lock className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Security Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password Status</p>
                                            <p className="text-sm text-gray-900">Secured with Hash</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</p>
                                            <p className="text-sm text-gray-900">Not available</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedUserDetail.role === 'ADMIN' ? 'Full System Access' :
                                                    selectedUserDetail.role === 'MANAGER' ? 'Management Access' :
                                                        'Limited Access'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    User ID: {selectedUserDetail.user_id} • Last viewed: {new Date().toLocaleString()}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={closeDetailModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
                                        Export Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
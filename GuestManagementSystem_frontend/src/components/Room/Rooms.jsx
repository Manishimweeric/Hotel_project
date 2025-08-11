import React, { useState, useEffect } from 'react';
import {
    Home,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Plus,
    Download,
    RefreshCw,
    Users,
    DollarSign,
    Calendar,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    X,
    Bed,
    Star,
    Crown,
    Building,
    Lock,
    Unlock,
    CheckCircle,
    XCircle,
    MapPin
} from 'lucide-react';
import { roomService } from '../../api';

const AdminRoomsPage = () => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterAvailability, setFilterAvailability] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [roomsPerPage] = useState(10);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddRoomModal, setShowAddRoomModal] = useState(false);
    const [showEditRoomModal, setShowEditRoomModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [roomForm, setRoomForm] = useState({
        room_code: '',
        categories: 'G',
        price_per_night: '',
        capacity: '1',
        description: '',
        is_active: true
    });

    const [roomFormErrors, setRoomFormErrors] = useState({});

    const categoryChoices = [
        { value: 'G', label: 'General', icon: Bed, color: 'text-gray-600', bg: 'bg-gray-100' },
        { value: 'V', label: 'VIP', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { value: 'S', label: 'Suite', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' },
        { value: 'D', label: 'Deluxe', icon: Building, color: 'text-blue-600', bg: 'bg-blue-100' }
    ];


    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await roomService.getRooms();
            setRooms(response.data || response);
            console.log('Rooms:', response.data || response);
        } catch (err) {
            setError('Failed to load rooms. Please try again.');
            console.error('Error loading rooms:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (room) => {
        setSelectedRoomDetail(room);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedRoomDetail(null);
    };

    const handleAddRoom = () => {
        setShowAddRoomModal(true);
        setRoomForm({
            room_code: '',
            categories: 'G',
            price_per_night: '',
            capacity: '1',
            description: '',
            is_active: true
        });
        setRoomFormErrors({});
    };

    const handleEditRoom = (room) => {
        setSelectedRoomDetail(room);
        setRoomForm({
            room_code: room.room_code,
            categories: room.categories,
            price_per_night: room.price_per_night.toString(),
            capacity: room.capacity.toString(),
            description: room.description || '',
            is_active: room.is_active
        });
        setShowEditRoomModal(true);
        setShowActionMenu(null);
        setRoomFormErrors({});
    };

    const closeAddRoomModal = () => {
        setShowAddRoomModal(false);
        setRoomForm({
            room_code: '',
            categories: 'G',
            price_per_night: '',
            capacity: '1',
            description: '',
            is_active: true
        });
        setRoomFormErrors({});
    };

    const closeEditRoomModal = () => {
        setShowEditRoomModal(false);
        setSelectedRoomDetail(null);
        setRoomForm({
            room_code: '',
            categories: 'G',
            price_per_night: '',
            capacity: '1',
            description: '',
            is_active: true
        });
        setRoomFormErrors({});
    };

    const handleRoomFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRoomForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (roomFormErrors[name]) {
            setRoomFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateRoomForm = () => {
        const errors = {};
        if (!roomForm.room_code.trim()) errors.room_code = 'Room code is required';
        if (!roomForm.price_per_night) errors.price_per_night = 'Price per night is required';
        if (isNaN(roomForm.price_per_night) || parseFloat(roomForm.price_per_night) <= 0) {
            errors.price_per_night = 'Please enter a valid price';
        }
        if (!roomForm.capacity) errors.capacity = 'Capacity is required';
        if (isNaN(roomForm.capacity) || parseInt(roomForm.capacity) <= 0) {
            errors.capacity = 'Please enter a valid capacity';
        }
        setRoomFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!validateRoomForm()) return;
        setIsCreating(true);
        try {
            const roomData = {
                room_code: roomForm.room_code,
                categories: roomForm.categories,
                price_per_night: parseFloat(roomForm.price_per_night),
                capacity: parseInt(roomForm.capacity),
                description: roomForm.description,
                is_active: roomForm.is_active
            };
            await roomService.createRoom(roomData);
            alert('Room created successfully!');
            closeAddRoomModal();
            loadRooms();
        } catch (err) {
            alert('Failed to create room. Please try again.');
            console.error('Error creating room:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateRoom = async (e) => {
        e.preventDefault();
        if (!validateRoomForm()) return;
        setIsUpdating(true);
        try {
            const roomData = {
                room_code: roomForm.room_code,
                categories: roomForm.categories,
                price_per_night: parseFloat(roomForm.price_per_night),
                capacity: parseInt(roomForm.capacity),
                description: roomForm.description,
                is_active: roomForm.is_active
            };
            await roomService.updateRoom(selectedRoomDetail.id, roomData);
            alert('Room updated successfully!');
            closeEditRoomModal();
            loadRooms();
        } catch (err) {
            alert('Failed to update room. Please try again.');
            console.error('Error updating room:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const refreshRooms = async () => {
        setIsRefreshing(true);
        await loadRooms();
        setIsRefreshing(false);
    };

    const handleDeleteRoom = async (roomId) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await roomService.deleteRoom(roomId);
                setRooms(rooms.filter(room => room.id !== roomId));
                alert('Room deleted successfully');
            } catch (err) {
                alert('Failed to delete room');
                console.error('Error deleting room:', err);
            }
        }
    };

    const exportRooms = () => {
        const csvContent = [
            ['Room Code', 'Category', 'Price/Night', 'Capacity', 'Reserved', 'Status', 'Created Date'],
            ...filteredRooms.map(room => [
                room.room_code,
                getCategoryLabel(room.categories),
                room.price_per_night,
                room.capacity,
                room.reserved ? 'Yes' : 'No',
                room.is_active ? 'Active' : 'Inactive',
                new Date(room.created_at || Date.now()).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rooms.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleSelectRoom = (roomId) => {
        setSelectedRooms(prev =>
            prev.includes(roomId)
                ? prev.filter(id => id !== roomId)
                : [...prev, roomId]
        );
    };

    const handleSelectAll = () => {
        if (selectedRooms.length === filteredRooms.length) {
            setSelectedRooms([]);
        } else {
            setSelectedRooms(filteredRooms.map(room => room.id));
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch =
            room.room_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || room.categories === filterCategory;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && room.is_active) ||
            (filterStatus === 'inactive' && !room.is_active);
        const matchesAvailability = filterAvailability === 'all' ||
            (filterAvailability === 'available' && !room.reserved) ||
            (filterAvailability === 'reserved' && room.reserved);
        return matchesSearch && matchesCategory && matchesStatus && matchesAvailability;
    });

    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
    const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

    const getCategoryConfig = (category) => {
        return categoryChoices.find(c => c.value === category) || categoryChoices[0];
    };

    const getCategoryLabel = (category) => {
        const config = getCategoryConfig(category);
        return config.label;
    };

    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200';
    };

    const getAvailabilityColor = (reserved) => {
        return reserved
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-green-100 text-green-800 border-green-200';
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Rooms</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadRooms}
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
                            <Home className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
                                <p className="text-sm text-gray-600">Manage hotel rooms and availability</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshRooms}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportRooms}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                            <button
                                onClick={handleAddRoom}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4 flex-wrap gap-2">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Home className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Categories</option>
                                    {categoryChoices.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
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
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="relative">
                                <MapPin className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterAvailability}
                                    onChange={(e) => setFilterAvailability(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="all">All Rooms</option>
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Total: {filteredRooms.length} rooms</span>
                            {selectedRooms.length > 0 && (
                                <span>• {selectedRooms.length} selected</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rooms Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading rooms...</p>
                            </div>
                        </div>
                    ) : currentRooms.length === 0 ? (
                        <div className="text-center py-20">
                            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' || filterAvailability !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No rooms have been created yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRooms.length === filteredRooms.length}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Room
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price & Capacity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Availability
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created Date
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentRooms.map((room) => {
                                            const categoryConfig = getCategoryConfig(room.categories);
                                            const CategoryIcon = categoryConfig.icon;
                                            return (
                                                <tr key={room.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRooms.includes(room.id)}
                                                            onChange={() => handleSelectRoom(room.id)}
                                                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${categoryConfig.bg} flex items-center justify-center`}>
                                                                <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    Room {room.room_code}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {room.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <CategoryIcon className={`h-4 w-4 mr-2 ${categoryConfig.color}`} />
                                                            <span className="text-sm text-gray-900">
                                                                {categoryConfig.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                                                                ${room.price_per_night}/night
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Users className="h-3 w-3 mr-1 text-gray-400" />
                                                                {room.capacity} guests
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAvailabilityColor(room.reserved)}`}>
                                                            {room.reserved ? (
                                                                <>
                                                                    <Lock className="h-3 w-3 mr-1" />
                                                                    Reserved
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Unlock className="h-3 w-3 mr-1" />
                                                                    Available
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(room.is_active)}`}>
                                                            {room.is_active ? (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Active
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Inactive
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Calendar className="h-4 w-4 mr-2" />
                                                            {new Date(room.created_at || Date.now()).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                                        <div className="flex justify-end items-center gap-2">
                                                            <button
                                                                onClick={() => handleViewDetails(room)}
                                                                className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditRoom(room)}
                                                                className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                                className="flex items-center px-2 py-1 text-sm text-red-700 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Delete
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
                                                Showing <span className="font-medium">{indexOfFirstRoom + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastRoom, filteredRooms.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredRooms.length}</span> results
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

            {/* Add Room Modal */}
            {showAddRoomModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Plus className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Add New Room</h3>
                            </div>
                            <button
                                onClick={closeAddRoomModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Modal Content */}
                        <form onSubmit={handleCreateRoom} className="p-6">
                            <div className="space-y-4">
                                {/* Room Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Room Code
                                    </label>
                                    <input
                                        type="text"
                                        name="room_code"
                                        value={roomForm.room_code}
                                        onChange={handleRoomFormChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${roomFormErrors.room_code ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter room code (e.g., 101, A-205)"
                                    />
                                    {roomFormErrors.room_code && <p className="text-red-500 text-xs mt-1">{roomFormErrors.room_code}</p>}
                                </div>
                                {/* Category and Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <select
                                            name="categories"
                                            value={roomForm.categories}
                                            onChange={handleRoomFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            {categoryChoices.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacity
                                        </label>
                                        <input
                                            type="number"
                                            name="capacity"
                                            value={roomForm.capacity}
                                            onChange={handleRoomFormChange}
                                            min="1"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${roomFormErrors.capacity ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Number of guests"
                                        />
                                        {roomFormErrors.capacity && <p className="text-red-500 text-xs mt-1">{roomFormErrors.capacity}</p>}
                                    </div>
                                </div>
                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price per Night ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="price_per_night"
                                        value={roomForm.price_per_night}
                                        onChange={handleRoomFormChange}
                                        step="0.01"
                                        min="0"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${roomFormErrors.price_per_night ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter price per night"
                                    />
                                    {roomFormErrors.price_per_night && <p className="text-red-500 text-xs mt-1">{roomFormErrors.price_per_night}</p>}
                                </div>
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={roomForm.description}
                                        onChange={handleRoomFormChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Enter room description (optional)"
                                    />
                                </div>
                                {/* Active Status */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={roomForm.is_active}
                                        onChange={handleRoomFormChange}
                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Active (room is available for booking)
                                    </label>
                                </div>
                            </div>
                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeAddRoomModal}
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
                                        'Create Room'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Room Modal */}
            {showEditRoomModal && selectedRoomDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Edit className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Edit Room {selectedRoomDetail.room_code}</h3>
                            </div>
                            <button
                                onClick={closeEditRoomModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Modal Content */}
                        <form onSubmit={handleUpdateRoom} className="p-6">
                            <div className="space-y-4">
                                {/* Room Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Room Code
                                    </label>
                                    <input
                                        type="text"
                                        name="room_code"
                                        value={roomForm.room_code}
                                        onChange={handleRoomFormChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${roomFormErrors.room_code ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter room code (e.g., 101, A-205)"
                                    />
                                    {roomFormErrors.room_code && <p className="text-red-500 text-xs mt-1">{roomFormErrors.room_code}</p>}
                                </div>
                                {/* Category and Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <select
                                            name="categories"
                                            value={roomForm.categories}
                                            onChange={handleRoomFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            {categoryChoices.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacity
                                        </label>
                                        <input
                                            type="number"
                                            name="capacity"
                                            value={roomForm.capacity}
                                            onChange={handleRoomFormChange}
                                            min="1"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${roomFormErrors.capacity ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Number of guests"
                                        />
                                        {roomFormErrors.capacity && <p className="text-red-500 text-xs mt-1">{roomFormErrors.capacity}</p>}
                                    </div>
                                </div>
                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price per Night ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="price_per_night"
                                        value={roomForm.price_per_night}
                                        onChange={handleRoomFormChange}
                                        step="0.01"
                                        min="0"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${roomFormErrors.price_per_night ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter price per night"
                                    />
                                    {roomFormErrors.price_per_night && <p className="text-red-500 text-xs mt-1">{roomFormErrors.price_per_night}</p>}
                                </div>
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={roomForm.description}
                                        onChange={handleRoomFormChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Enter room description (optional)"
                                    />
                                </div>
                                {/* Active Status */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={roomForm.is_active}
                                        onChange={handleRoomFormChange}
                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Active (room is available for booking)
                                    </label>
                                </div>
                            </div>
                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeEditRoomModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdating ? (
                                        <div className="flex items-center">
                                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                            Updating...
                                        </div>
                                    ) : (
                                        'Update Room'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Room Detail Modal */}
            {showDetailModal && selectedRoomDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <div className={`h-12 w-12 rounded-lg ${getCategoryConfig(selectedRoomDetail.categories).bg} flex items-center justify-center mr-4`}>
                                    {(() => {
                                        const CategoryIcon = getCategoryConfig(selectedRoomDetail.categories).icon;
                                        return <CategoryIcon className={`h-6 w-6 ${getCategoryConfig(selectedRoomDetail.categories).color}`} />;
                                    })()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Room {selectedRoomDetail.room_code}
                                    </h3>
                                    <p className="text-sm text-gray-600">Room Details</p>
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
                                        <h4 className="text-lg font-medium text-gray-900">Room {selectedRoomDetail.room_code}</h4>
                                        <p className="text-sm text-gray-600">{getCategoryLabel(selectedRoomDetail.categories)} Category</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(selectedRoomDetail.reserved)}`}>
                                            {selectedRoomDetail.reserved ? (
                                                <>
                                                    <Lock className="h-4 w-4 mr-2" />
                                                    Reserved
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock className="h-4 w-4 mr-2" />
                                                    Available
                                                </>
                                            )}
                                        </span>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRoomDetail.is_active)}`}>
                                            {selectedRoomDetail.is_active ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Inactive
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <DollarSign className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Price per Night</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            ${selectedRoomDetail.price_per_night}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Users className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Capacity</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedRoomDetail.capacity} Guests
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        {(() => {
                                            const CategoryIcon = getCategoryConfig(selectedRoomDetail.categories).icon;
                                            return <CategoryIcon className={`h-6 w-6 mx-auto mb-2 ${getCategoryConfig(selectedRoomDetail.categories).color}`} />;
                                        })()}
                                        <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {getCategoryLabel(selectedRoomDetail.categories)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Information Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Room Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Home className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Room Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Room Code</p>
                                            <p className="text-sm text-gray-900 font-mono">{selectedRoomDetail.room_code}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</p>
                                            <div className="flex items-center mt-1">
                                                {(() => {
                                                    const CategoryIcon = getCategoryConfig(selectedRoomDetail.categories).icon;
                                                    return <CategoryIcon className={`h-4 w-4 mr-2 ${getCategoryConfig(selectedRoomDetail.categories).color}`} />;
                                                })()}
                                                <span className="text-sm text-gray-900">
                                                    {getCategoryLabel(selectedRoomDetail.categories)}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedRoomDetail.description || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Pricing & Availability */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <DollarSign className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Pricing & Availability</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Night</p>
                                            <p className="text-lg font-semibold text-gray-900">${selectedRoomDetail.price_per_night}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Capacity</p>
                                            <p className="text-sm text-gray-900">{selectedRoomDetail.capacity} guests maximum</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedRoomDetail.reserved ? 'Currently Reserved' : 'Available for Booking'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* System Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">System Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedRoomDetail.created_at || Date.now()).toLocaleDateString('en-US', {
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
                                                    {selectedRoomDetail.updated_at
                                                        ? new Date(selectedRoomDetail.updated_at).toLocaleDateString('en-US', {
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
                                            <div className={`w-2 h-2 rounded-full mr-3 ${selectedRoomDetail.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Room Status</p>
                                                <p className="text-sm text-gray-900">
                                                    {selectedRoomDetail.is_active ? 'Active & Bookable' : 'Inactive'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Additional Features */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Star className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Room Features</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Room ID</p>
                                            <p className="text-sm text-gray-900 font-mono">#{selectedRoomDetail.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation Status</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedRoomDetail.reserved ? 'Reserved by guest' : 'Open for reservations'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category Benefits</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedRoomDetail.categories === 'G' && 'Standard amenities and comfort'}
                                                {selectedRoomDetail.categories === 'V' && 'Premium amenities and priority service'}
                                                {selectedRoomDetail.categories === 'S' && 'Luxury suite with exclusive features'}
                                                {selectedRoomDetail.categories === 'D' && 'Deluxe accommodations with enhanced comfort'}
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
                                    Room ID: {selectedRoomDetail.id} • Last viewed: {new Date().toLocaleString()}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={closeDetailModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => handleEditRoom(selectedRoomDetail)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Edit Room
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

export default AdminRoomsPage;

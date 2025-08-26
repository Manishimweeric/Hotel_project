import React, { useState, useEffect } from 'react';
import {
    Calendar, Search, Filter, Eye, Edit, RefreshCw, Download,
    DollarSign, MoreVertical, ChevronLeft, ChevronRight,
    X, AlertCircle, CheckCircle, XCircle, Clock, Bed, Home,
    User, MapPin, Phone, Mail, Hash, FileText, ArrowUpDown,
    TrendingUp, Users, CreditCard, Activity, CalendarDays,
    MapPinIcon, Building, Crown, Wifi, Tv, Wind, Bath
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { reservationService, roomService } from '../../api';

const ReservationManagementPage = () => {
    const [reservations, setReservations] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [reservationsPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedReservationDetail, setSelectedReservationDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [reservationToUpdate, setReservationToUpdate] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        checked_in: 0,
        checked_out: 0,
        canceled: 0,
        totalRevenue: 0,
        occupancyRate: 0
    });

    const STATUS_CHOICES = {
        'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        'confirmed': { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        'canceled': { label: 'Canceled', color: 'bg-red-100 text-red-800 border-red-200' }
    };

    useEffect(() => {
        loadData();
    }, [currentPage, sortField, sortDirection]);

    useEffect(() => {
        // Reset to first page when filters change
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            loadReservations();
        }
    }, [filterStatus, filterDateRange, searchTerm]);

    const loadData = async () => {
        await Promise.all([loadReservations(), loadRooms()]);
    };

    const loadRooms = async () => {
        try {
            const response = await roomService.getRooms();
            setRooms(response.data || response);
        } catch (err) {
            console.error('Error loading rooms:', err);
        }
    };

    const loadReservations = async () => {
        try {
            setIsLoading(true);
            setError(null);


            const response = await reservationService.getReservations();

            console.log(response)

            if (response.results) {
                setReservations(response.results);
                calculateStats(response.results);
            } else {
                setReservations(response.data || response);
                calculateStats(response.data || response);
            }
        } catch (err) {
            toast.error('Failed to load reservations. Please try again.');
            console.error('Error loading reservations:', err);
            // setError('Failed to load reservations');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (reservationsData) => {
        const totalRooms = rooms.length || 1;
        const occupiedRooms = reservationsData.filter(res => res.status === 'checked_in').length;

        const stats = {
            total: reservationsData.length,
            pending: reservationsData.filter(res => res.status === 'pending').length,
            confirmed: reservationsData.filter(res => res.status === 'confirmed').length,
            checked_in: reservationsData.filter(res => res.status === 'checked_in').length,
            checked_out: reservationsData.filter(res => res.status === 'checked_out').length,
            canceled: reservationsData.filter(res => res.status === 'canceled').length,
            totalRevenue: reservationsData
                .filter(res => ['checked_out', 'confirmed', 'checked_in'].includes(res.status))
                .reduce((sum, res) => sum + parseFloat(res.total_amount || 0), 0),
            occupancyRate: ((occupiedRooms / totalRooms) * 100).toFixed(1)
        };
        setStats(stats);
    };

    const handleViewDetails = async (reservation) => {
        try {
            setIsLoading(true);
            const detailedReservation = await reservationService.getReservation(reservation.id);
            setSelectedReservationDetail(detailedReservation);
            setShowDetailModal(true);
            setShowActionMenu(null);
        } catch (error) {
            toast.error('Failed to load reservation details');
            console.error('Error loading reservation details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedReservationDetail(null);
    };

    const handleUpdateStatus = (reservation) => {
        setReservationToUpdate(reservation);
        setNewStatus(reservation.status);
        setShowStatusModal(true);
        setShowActionMenu(null);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setReservationToUpdate(null);
        setNewStatus('');
    };

    const confirmUpdateStatus = async () => {
        if (!reservationToUpdate || !newStatus) return;

        try {
            setStatusUpdating(true);
            await reservationService.updateStatus(reservationToUpdate.id, newStatus);
            toast.success('Reservation status updated successfully!');
            closeStatusModal();
            loadReservations();
        } catch (error) {
            toast.error('Failed to update reservation status');
            console.error('Error updating status:', error);
        } finally {
            setStatusUpdating(false);
        }
    };

    const refreshReservations = async () => {
        setIsRefreshing(true);
        await loadReservations();
        setIsRefreshing(false);
    };

    const exportReservations = () => {
        const csvContent = [
            ['Reservation ID', 'Room', 'Customer', 'Status', 'Check-in', 'Check-out', 'Guests', 'Total Amount', 'Created Date'],
            ...filteredReservations.map(reservation => [
                reservation.id,
                reservation.room?.room_code || 'N/A',
                reservation.customer?.username || reservation.customer?.email || 'N/A',
                STATUS_CHOICES[reservation.status]?.label || reservation.status,
                reservation.check_in,
                reservation.check_out,
                reservation.guests,
                reservation.total_amount,
                new Date(reservation.created_at).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch =
            reservation.id?.toString().includes(searchTerm) ||
            reservation.room?.room_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const indexOfLastReservation = currentPage * reservationsPerPage;
    const indexOfFirstReservation = indexOfLastReservation - reservationsPerPage;
    const currentReservations = filteredReservations.slice(indexOfFirstReservation, indexOfLastReservation);
    const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />;
            case 'confirmed': return <CheckCircle className="h-4 w-4" />;
            case 'checked_in': return <Home className="h-4 w-4" />;
            case 'checked_out': return <MapPinIcon className="h-4 w-4" />;
            case 'canceled': return <XCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getRoomCategoryConfig = (category) => {
        const configs = {
            'standard': { name: 'Standard', color: 'blue' },
            'deluxe': { name: 'Deluxe', color: 'purple' },
            'suite': { name: 'Suite', color: 'amber' },
            'presidential': { name: 'Presidential', color: 'red' }
        };
        return configs[category] || { name: 'Standard', color: 'gray' };
    };

    const calculateNights = (checkIn, checkOut) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Reservations</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadReservations}
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
                            <Bed className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Reservation Management</h1>
                                <p className="text-sm text-gray-600">Manage room reservations and track guest stays</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshReservations}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportReservations}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Pending</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.confirmed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Revenue</p>
                                <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search reservations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        {Object.entries(STATUS_CHOICES).map(([key, value]) => (
                                            <option key={key} value={key}>{value.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterDateRange}
                                        onChange={(e) => setFilterDateRange(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">This Month</option>
                                        <option value="3months">Last 3 Months</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Total: {filteredReservations.length} reservations</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reservations Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading reservations...</p>
                            </div>
                        </div>
                    ) : currentReservations.length === 0 ? (
                        <div className="text-center py-20">
                            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterStatus !== 'all' || filterDateRange !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No reservations have been made yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('id')}
                                            >
                                                <div className="flex items-center">
                                                    #
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Guest</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('check_in')}
                                            >
                                                <div className="flex items-center">
                                                    Check-in
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('check_out')}
                                            >
                                                <div className="flex items-center">
                                                    Check-out
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('total_amount')}
                                            >
                                                <div className="flex items-center">
                                                    Total
                                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentReservations.map((reservation, index) => (
                                            <tr key={reservation.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 font-mono">
                                                                {index + 1}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Bed className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                Room {reservation.room_code || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {getRoomCategoryConfig(reservation.room?.categories).name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <User className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {reservation.guest_first_name && reservation.guest_last_name
                                                                    ? `${reservation.guest_first_name} ${reservation.guest_last_name}`
                                                                    : reservation.guest_first_name || reservation.guest_last_name || 'N/A'}
                                                            </div>


                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_CHOICES[reservation.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                        {getStatusIcon(reservation.status)}
                                                        <span className="ml-1">{STATUS_CHOICES[reservation.status]?.label || reservation.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <CalendarDays className="h-4 w-4 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {new Date(reservation.check_in).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(reservation.check_in).toLocaleDateString('en-US', { weekday: 'short' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <CalendarDays className="h-4 w-4 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {new Date(reservation.check_out).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {calculateNights(reservation.check_in, reservation.check_out)} nights
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-900">
                                                            {reservation.guests} guest{reservation.guests > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            ${parseFloat(reservation.total_amount || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(reservation)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(reservation)}
                                                            className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                                                            title="Update Status"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
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
                                                Showing <span className="font-medium">{indexOfFirstReservation + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastReservation, filteredReservations.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredReservations.length}</span> results
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

            {/* Reservation Detail Modal */}
            {showDetailModal && selectedReservationDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Bed className="h-6 w-6 text-amber-600 mr-3" />
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Reservation #{selectedReservationDetail.id}
                                    </h3>
                                    <p className="text-sm text-gray-600">Reservation Details</p>
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
                            {/* Reservation Summary */}
                            <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">Reservation Summary</h4>
                                        <p className="text-sm text-gray-600">Reservation #{selectedReservationDetail.id}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_CHOICES[selectedReservationDetail.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {getStatusIcon(selectedReservationDetail.status)}
                                            <span className="ml-2">{STATUS_CHOICES[selectedReservationDetail.status]?.label || selectedReservationDetail.status}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Total Amount</p>
                                        <p className="text-lg font-semibold text-gray-900">${parseFloat(selectedReservationDetail.total_amount || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <CalendarDays className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Nights</p>
                                        <p className="text-lg font-semibold text-gray-900">{calculateNights(selectedReservationDetail.check_in, selectedReservationDetail.check_out)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Guests</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedReservationDetail.guests}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Calendar className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedReservationDetail.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Guest and Room Information */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Guest Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <User className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Guest Information</h5>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedReservationDetail.customer?.first_name || selectedReservationDetail.customer?.username || 'N/A'}
                                                {selectedReservationDetail.customer?.last_name && ` ${selectedReservationDetail.customer.last_name}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">{selectedReservationDetail.customer?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                                            <div className="flex items-center">
                                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">{selectedReservationDetail.customer?.phone || 'No phone'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Guests</p>
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">{selectedReservationDetail.guests} guest{selectedReservationDetail.guests > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Bed className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Room Information</h5>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</p>
                                            <div className="flex items-center">
                                                <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900 font-mono">{selectedReservationDetail.room?.room_code || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</p>
                                            <div className="flex items-center">
                                                <Crown className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">{getRoomCategoryConfig(selectedReservationDetail.room?.categories).name}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</p>
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">Up to {selectedReservationDetail.room?.capacity || 'N/A'} guests</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Night</p>
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900">${selectedReservationDetail.room?.price_per_night || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stay Information */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                <div className="flex items-center mb-4">
                                    <CalendarDays className="h-5 w-5 text-amber-600 mr-2" />
                                    <h5 className="text-lg font-medium text-gray-900">Stay Information</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Date</p>
                                        <div className="flex items-center mt-1">
                                            <Calendar className="h-4 w-4 text-green-600 mr-2" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(selectedReservationDetail.check_in).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(selectedReservationDetail.check_in).toLocaleDateString('en-US', { weekday: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out Date</p>
                                        <div className="flex items-center mt-1">
                                            <Calendar className="h-4 w-4 text-red-600 mr-2" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(selectedReservationDetail.check_out).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(selectedReservationDetail.check_out).toLocaleDateString('en-US', { weekday: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</p>
                                        <div className="flex items-center mt-1">
                                            <Clock className="h-4 w-4 text-blue-600 mr-2" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {calculateNights(selectedReservationDetail.check_in, selectedReservationDetail.check_out)} nights
                                                </p>
                                                <p className="text-xs text-gray-500">Total stay duration</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Room Amenities */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                <div className="flex items-center mb-4">
                                    <Building className="h-5 w-5 text-amber-600 mr-2" />
                                    <h5 className="text-lg font-medium text-gray-900">Room Amenities</h5>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <Wifi className="h-5 w-5 text-blue-600 mr-3" />
                                        <span className="text-sm text-gray-700">Free WiFi</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <Tv className="h-5 w-5 text-purple-600 mr-3" />
                                        <span className="text-sm text-gray-700">Cable TV</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <Wind className="h-5 w-5 text-cyan-600 mr-3" />
                                        <span className="text-sm text-gray-700">Air Conditioning</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <Bath className="h-5 w-5 text-blue-600 mr-3" />
                                        <span className="text-sm text-gray-700">Private Bathroom</span>
                                    </div>
                                </div>
                            </div>

                            {/* Special Notes */}
                            {selectedReservationDetail.notes && (
                                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                    <div className="flex items-center mb-4">
                                        <FileText className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Special Notes</h5>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-700">{selectedReservationDetail.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reservation Timeline */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <Activity className="h-5 w-5 text-amber-600 mr-2" />
                                    <h5 className="text-lg font-medium text-gray-900">Reservation Timeline</h5>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Reservation Created</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(selectedReservationDetail.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(selectedReservationDetail.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-3 ${selectedReservationDetail.status === 'checked_out' ? 'bg-green-500' : selectedReservationDetail.status === 'canceled' ? 'bg-red-500' : selectedReservationDetail.status === 'checked_in' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Current Status</p>
                                            <p className="text-xs text-gray-500">
                                                {STATUS_CHOICES[selectedReservationDetail.status]?.label || selectedReservationDetail.status}
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
                                    Reservation #{selectedReservationDetail.id} • Last viewed: {new Date().toLocaleString()}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReservationDetail)}
                                        className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        <Edit className="h-4 w-4 mr-2 inline" />
                                        Update Status
                                    </button>
                                    <button
                                        onClick={closeDetailModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
                                        Print Reservation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && reservationToUpdate && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Edit className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Update Reservation Status</h3>
                            </div>
                            <button
                                onClick={closeStatusModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <div className="flex items-center mb-2">
                                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                    <h4 className="text-sm font-medium text-gray-900">Reservation #{reservationToUpdate.id}</h4>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Room {reservationToUpdate.room?.room_code} • Guest: {reservationToUpdate.customer?.username || reservationToUpdate.customer?.email || 'N/A'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Status
                                </label>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_CHOICES[reservationToUpdate.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                    {getStatusIcon(reservationToUpdate.status)}
                                    <span className="ml-2">{STATUS_CHOICES[reservationToUpdate.status]?.label || reservationToUpdate.status}</span>
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    {Object.entries(STATUS_CHOICES).map(([key, value]) => (
                                        <option key={key} value={key}>{value.label}</option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-gray-500">
                                    Select the new status for this reservation. Changes will be saved immediately.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={closeStatusModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmUpdateStatus}
                                disabled={statusUpdating || newStatus === reservationToUpdate.status}
                                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {statusUpdating ? (
                                    <div className="flex items-center">
                                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                        Updating...
                                    </div>
                                ) : (
                                    'Update Status'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationManagementPage;
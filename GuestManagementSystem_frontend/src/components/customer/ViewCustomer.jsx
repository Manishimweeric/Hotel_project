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
    MapPin,
    Calendar,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    X,
    User
} from 'lucide-react';
import { customerService } from '../../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminCustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [customersPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Load customers on component mount
    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await customerService.getCustomers();
            setCustomers(response.data || response);
            console.log('Customers:', response.data || response);
        } catch (err) {
            // setError('Failed to load customers. Please try again.');
            toast.error('Failed to load customers. Please try again.');
            console.error('Error loading customers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (customer) => {
        setSelectedCustomerDetail(customer);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedCustomerDetail(null);
    };

    const refreshCustomers = async () => {
        setIsRefreshing(true);
        await loadCustomers();
        setIsRefreshing(false);
    };
    const exportCustomers = () => {
        const csvContent = [
            ['Name', 'Email', 'Phone', 'Location', 'Status', 'Join Date'],
            ...filteredCustomers.map(customer => [
                `${customer.first_name} ${customer.last_name}`,
                customer.email,
                customer.phone,
                customer.location,
                customer.status || 'active',
                new Date(customer.created_at || Date.now()).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };


    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.username?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            (customer.status || 'active') === filterStatus;

        return matchesSearch && matchesFilter;
    });

    // Pagination
    const indexOfLastCustomer = currentPage * customersPerPage;
    const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getGenderLabel = (gender) => {
        switch (gender) {
            case 'M': return 'Male';
            case 'F': return 'Female';
            case 'O': return 'Other';
            default: return 'N/A';
        }
    };

    const getMaritalStatusLabel = (status) => {
        switch (status) {
            case 'S': return 'Single';
            case 'M': return 'Married';
            case 'D': return 'Divorced';
            case 'W': return 'Widowed';
            default: return 'N/A';
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Customers</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadCustomers}
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
                            <Users className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                                <p className="text-sm text-gray-600">Manage all registered customers</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshCustomers}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportCustomers}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
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
                                    placeholder="Search customers..."
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
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Total: {filteredCustomers.length} customers</span>

                        </div>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading customers...</p>
                            </div>
                        </div>
                    ) : currentCustomers.length === 0 ? (
                        <div className="text-center py-20">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No customers have registered yet.'}
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
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Join Date
                                            </th>
                                            <th className="px-6 py-3 text-left  text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentCustomers.map((customer, index) => (
                                            <tr key={customer.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-500 text-center whitespace-nowrap">
                                                    #{index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-amber-800">
                                                                    {customer.first_name?.[0]}{customer.last_name?.[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {customer.first_name} {customer.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                @{customer.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                                            {customer.email}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                                            {customer.phone || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                                            {customer.location || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        <div>Gender: {getGenderLabel(customer.gender)}</div>
                                                        <div className="text-gray-500">
                                                            Status: {getMaritalStatusLabel(customer.marital_status)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                            customer.status || 'A'
                                                        )}`}
                                                    >
                                                        {customer.status === 'A' ? (
                                                            <UserCheck className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <UserX className="h-3 w-3 mr-1" />
                                                        )}
                                                        {customer.status === 'A'
                                                            ? 'Active'
                                                            : customer.status === 'I'
                                                                ? 'Inactive'
                                                                : customer.status === 'S'
                                                                    ? 'Suspended'
                                                                    : 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        {new Date(customer.created_at || Date.now()).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium">
                                                    <div className="py-1 items- justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(customer)}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <Eye className="h-4 w-4 mr-3" />
                                                            View
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
                                                Showing <span className="font-medium">{indexOfFirstCustomer + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastCustomer, filteredCustomers.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredCustomers.length}</span> results
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

            {/* Customer Detail Modal */}
            {showDetailModal && selectedCustomerDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                                    <span className="text-lg font-medium text-amber-800">
                                        {selectedCustomerDetail.first_name?.[0]}{selectedCustomerDetail.last_name?.[0]}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {selectedCustomerDetail.first_name} {selectedCustomerDetail.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-600">Customer Details</p>
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
                                        <h4 className="text-lg font-medium text-gray-900">@{selectedCustomerDetail.username}</h4>
                                        <p className="text-sm text-gray-600">Customer ID: {selectedCustomerDetail.id}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedCustomerDetail.status || 'active')}`}>
                                        {selectedCustomerDetail.status === 'active' ? (
                                            <UserCheck className="h-4 w-4 mr-2" />
                                        ) : (
                                            <UserX className="h-4 w-4 mr-2" />
                                        )}
                                        {(selectedCustomerDetail.status || 'active').charAt(0).toUpperCase() + (selectedCustomerDetail.status || 'active').slice(1)} Member
                                    </span>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Calendar className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Member Since</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedCustomerDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <User className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Profile Status</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {Math.round(
                                                (Object.values(selectedCustomerDetail).filter(val => val && val !== '').length /
                                                    Object.keys(selectedCustomerDetail).length) * 100
                                            )}% Complete
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <UserCheck className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-gray-900">Standard</p>
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
                                                <p className="text-sm text-gray-900 break-all">{selectedCustomerDetail.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <Phone className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</p>
                                                <p className="text-sm text-gray-900">{selectedCustomerDetail.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</p>
                                                <p className="text-sm text-gray-900">{selectedCustomerDetail.location || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <User className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Personal Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</p>
                                            <p className="text-sm text-gray-900">{selectedCustomerDetail.first_name} {selectedCustomerDetail.last_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Username</p>
                                            <p className="text-sm text-gray-900">@{selectedCustomerDetail.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</p>
                                            <p className="text-sm text-gray-900">{getGenderLabel(selectedCustomerDetail.gender)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Marital Status</p>
                                            <p className="text-sm text-gray-900">{getMaritalStatusLabel(selectedCustomerDetail.marital_status)}</p>
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
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</p>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedCustomerDetail.created_at || Date.now()).toLocaleDateString('en-US', {
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
                                                    {selectedCustomerDetail.updated_at
                                                        ? new Date(selectedCustomerDetail.updated_at).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })
                                                        : 'Profile never updated'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${selectedCustomerDetail.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</p>
                                                <p className="text-sm text-gray-900">
                                                    {(selectedCustomerDetail.status || 'active').charAt(0).toUpperCase() + (selectedCustomerDetail.status || 'active').slice(1)} Member
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <UserCheck className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Additional Details</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Completion</p>
                                            <div className="mt-2">
                                                <div className="flex items-center">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                                        <div
                                                            className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${Math.round(
                                                                    (Object.values(selectedCustomerDetail).filter(val => val && val !== '').length /
                                                                        Object.keys(selectedCustomerDetail).length) * 100
                                                                )}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {Math.round(
                                                            (Object.values(selectedCustomerDetail).filter(val => val && val !== '').length /
                                                                Object.keys(selectedCustomerDetail).length) * 100
                                                        )}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membership Level</p>
                                            <p className="text-sm text-gray-900">Standard Member</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Communication</p>
                                            <p className="text-sm text-gray-900">Email & SMS Notifications</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data Fields Completed</p>
                                            <p className="text-sm text-gray-900">
                                                {Object.values(selectedCustomerDetail).filter(val => val && val !== '').length} of {Object.keys(selectedCustomerDetail).length} fields
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
                                    Customer ID: {selectedCustomerDetail.id} • Last viewed: {new Date().toLocaleString()}
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

export default AdminCustomersPage;
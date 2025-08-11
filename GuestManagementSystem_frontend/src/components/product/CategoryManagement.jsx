import React, { useState, useEffect } from 'react';
import {
    Tag,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Plus,
    Download,
    RefreshCw,
    Calendar,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    X,
    AlertCircle,
    CheckCircle,
    FileText,
    Hash,
    Layers
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { categoryService } from '../../api';

const CategoryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Add/Edit category form state
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: ''
    });

    const [categoryFormErrors, setCategoryFormErrors] = useState({});

    // Load categories on component mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await categoryService.getCategories();
            setCategories(response.data || response);
        } catch (err) {
            setError('Failed to load categories');
            toast.error('Failed to load categories. Please try again.');
            console.error('Error loading categories:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (category) => {
        setSelectedCategoryDetail(category);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedCategoryDetail(null);
    };

    const handleAddCategory = () => {
        setShowAddCategoryModal(true);
        setCategoryForm({
            name: '',
            description: ''
        });
        setCategoryFormErrors({});
    };

    const closeAddCategoryModal = () => {
        setShowAddCategoryModal(false);
        setCategoryForm({
            name: '',
            description: ''
        });
        setCategoryFormErrors({});
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name || '',
            description: category.description || ''
        });
        setCategoryFormErrors({});
        setShowEditCategoryModal(true);
        setShowActionMenu(null);
    };

    const closeEditCategoryModal = () => {
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm({
            name: '',
            description: ''
        });
        setCategoryFormErrors({});
    };

    const handleDeleteCategory = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
        setShowActionMenu(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
    };

    const handleCategoryFormChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm(prev => ({
            ...prev,
            [name]: value
        }));
        if (categoryFormErrors[name]) {
            setCategoryFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateCategoryForm = () => {
        const errors = {};
        if (!categoryForm.name.trim()) {
            errors.name = 'Category name is required';
        } else if (categoryForm.name.trim().length < 2) {
            errors.name = 'Category name must be at least 2 characters';
        } else if (categoryForm.name.trim().length > 100) {
            errors.name = 'Category name must not exceed 100 characters';
        }
        setCategoryFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!validateCategoryForm()) return;
        setIsCreating(true);
        try {
            const categoryData = {
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim()
            };
            await categoryService.createCategory(categoryData);
            toast.success('Category created successfully!');
            closeAddCategoryModal();
            loadCategories();
        } catch (err) {
            toast.error('Failed to create category. Please try again.');
            console.error('Error creating category:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!validateCategoryForm()) return;
        setIsUpdating(true);
        try {
            const categoryData = {
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim()
            };
            await categoryService.updateCategory(editingCategory.id, categoryData);
            toast.success('Category updated successfully!');
            closeEditCategoryModal();
            loadCategories();
        } catch (err) {
            toast.error('Failed to update category. Please try again.');
            console.error('Error updating category:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDeleteCategory = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await categoryService.deleteCategory(categoryToDelete.id);
            toast.success('Category deleted successfully!');
            closeDeleteModal();
            loadCategories();
        } catch (err) {
            toast.error('Failed to delete category. Please try again.');
            console.error('Error deleting category:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const refreshCategories = async () => {
        setIsRefreshing(true);
        await loadCategories();
        setIsRefreshing(false);
    };

    const filteredCategories = categories.filter(category => {
        return category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Pagination
    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);
    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Categories</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadCategories}
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
                            <Layers className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
                                <p className="text-sm text-gray-600">Manage product categories and classifications</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshCategories}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>

                            <button
                                onClick={handleAddCategory}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Stats */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Total: {filteredCategories.length} categories</span>
                        </div>
                    </div>
                </div>

                {/* Categories Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading categories...</p>
                            </div>
                        </div>
                    ) : currentCategories.length === 0 ? (
                        <div className="text-center py-20">
                            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Try adjusting your search criteria.'
                                    : 'No categories have been created yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentCategories.map((category, index) => (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-500">#{indexOfFirstCategory + index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                                <Tag className="h-5 w-5 text-amber-600" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                                            <div className="text-sm text-gray-500">ID: {category.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs">
                                                        {category.description ? (
                                                            <span className="truncate">
                                                                {category.description.length > 20
                                                                    ? `${category.description.slice(0, 20)}...`
                                                                    : category.description}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">No description</span>
                                                        )}
                                                    </div>

                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        {new Date(category.created_at || Date.now()).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">

                                                    <div className="py-1 flex space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(category)}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditCategory(category)}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category)}
                                                            className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
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
                                                Showing <span className="font-medium">{indexOfFirstCategory + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastCategory, filteredCategories.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredCategories.length}</span> results
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
            {
                showActionMenu && (
                    <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowActionMenu(null)}
                    />
                )
            }

            {/* Add Category Modal */}
            {
                showAddCategoryModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                            {/* Modal Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <Plus className="h-6 w-6 text-amber-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
                                </div>
                                <button
                                    onClick={closeAddCategoryModal}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Modal Content */}
                            <form onSubmit={handleCreateCategory} className="p-6">
                                <div className="space-y-4">
                                    {/* Category Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={categoryForm.name}
                                            onChange={handleCategoryFormChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${categoryFormErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter category name"
                                            maxLength="100"
                                        />
                                        {categoryFormErrors.name && <p className="text-red-500 text-xs mt-1">{categoryFormErrors.name}</p>}
                                        <p className="text-xs text-gray-500 mt-1">{categoryForm.name.length}/100 characters</p>
                                    </div>
                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={categoryForm.description}
                                            onChange={handleCategoryFormChange}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder="Enter category description (optional)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Provide a brief description of this category</p>
                                    </div>
                                </div>
                                {/* Modal Footer */}
                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeAddCategoryModal}
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
                                            'Create Category'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Category Modal */}
            {
                showEditCategoryModal && editingCategory && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                            {/* Modal Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <Edit className="h-6 w-6 text-amber-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
                                </div>
                                <button
                                    onClick={closeEditCategoryModal}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Modal Content */}
                            <form onSubmit={handleUpdateCategory} className="p-6">
                                <div className="space-y-4">
                                    {/* Category ID Display */}
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category ID
                                        </label>
                                        <div className="flex items-center">
                                            <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm font-mono text-gray-900">{editingCategory.id}</span>
                                        </div>
                                    </div>
                                    {/* Category Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={categoryForm.name}
                                            onChange={handleCategoryFormChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${categoryFormErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter category name"
                                            maxLength="100"
                                        />
                                        {categoryFormErrors.name && <p className="text-red-500 text-xs mt-1">{categoryFormErrors.name}</p>}
                                        <p className="text-xs text-gray-500 mt-1">{categoryForm.name.length}/100 characters</p>
                                    </div>
                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={categoryForm.description}
                                            onChange={handleCategoryFormChange}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder="Enter category description (optional)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Provide a brief description of this category</p>
                                    </div>
                                </div>
                                {/* Modal Footer */}
                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeEditCategoryModal}
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
                                            'Update Category'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && categoryToDelete && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Modal Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
                                </div>
                                <button
                                    onClick={closeDeleteModal}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Modal Content */}
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                                        <Tag className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">{categoryToDelete.name}</h4>
                                        <p className="text-sm text-gray-500">ID: {categoryToDelete.id}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Are you sure you want to delete this category? This action cannot be undone.
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-700">
                                            <p className="font-medium">Warning:</p>
                                            <p>Deleting this category may affect products that are assigned to it. Make sure to reassign products to other categories if needed.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteCategory}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center">
                                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete Category'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Category Detail Modal */}
            {
                showDetailModal && selectedCategoryDetail && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                                        <Tag className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {selectedCategoryDetail.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">Category Details</p>
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
                                            <h4 className="text-lg font-medium text-gray-900">Category ID: {selectedCategoryDetail.id}</h4>
                                            <p className="text-sm text-gray-600">Product Category</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                            <Calendar className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {new Date(selectedCategoryDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                            <Tag className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedCategoryDetail.name}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Information Sections */}
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Category Information */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <Tag className="h-5 w-5 text-amber-600 mr-2" />
                                            <h5 className="text-lg font-medium text-gray-900">Category Information</h5>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category ID</p>
                                                <div className="flex items-center mt-1">
                                                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                    <p className="text-sm text-gray-900 font-mono">{selectedCategoryDetail.id}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</p>
                                                <p className="text-sm text-gray-900 font-medium">{selectedCategoryDetail.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                                                <div className="mt-1">
                                                    {selectedCategoryDetail.description ? (
                                                        <p className="text-sm text-gray-900">{selectedCategoryDetail.description}</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">No description provided</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Character Count</p>
                                                <p className="text-sm text-gray-900">{selectedCategoryDetail.name.length}/100 characters</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Category Timeline */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                                            <h5 className="text-lg font-medium text-gray-900">Category Timeline</h5>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(selectedCategoryDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(selectedCategoryDetail.created_at || Date.now()).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                                    <p className="text-sm text-gray-900">Active Category</p>
                                                    <p className="text-xs text-gray-500">Available for product assignment</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</p>
                                                    <p className="text-sm text-gray-900">Product Category</p>
                                                    <p className="text-xs text-gray-500">Used for product classification</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Category Usage */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <FileText className="h-5 w-5 text-amber-600 mr-2" />
                                            <h5 className="text-lg font-medium text-gray-900">Category Usage</h5>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Products Assigned</p>
                                                <p className="text-sm text-gray-900">Information not available</p>
                                                <p className="text-xs text-gray-500">Contact system administrator for usage statistics</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category Purpose</p>
                                                <p className="text-sm text-gray-900">Product Classification</p>
                                                <p className="text-xs text-gray-500">Used to organize and categorize hotel products</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Identifier</p>
                                                <p className="text-sm text-gray-900">Yes</p>
                                                <p className="text-xs text-gray-500">Category name must be unique across the system</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        Category ID: {selectedCategoryDetail.id} • Last viewed: {new Date().toLocaleString()}
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleEditCategory(selectedCategoryDetail)}
                                            className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                        >
                                            <Edit className="h-4 w-4 mr-2 inline" />
                                            Edit
                                        </button>
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
                )
            }
        </div >
    );
};

export default CategoryManagementPage;

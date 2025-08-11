import React, { useState, useEffect } from 'react';
import {
    Package, Search, Filter, Eye, Edit, Trash2, Plus, Download, RefreshCw,
    DollarSign, Box, Calendar, MoreVertical, ChevronLeft, ChevronRight,
    X, ImageIcon, Tag, AlertCircle, CheckCircle, XCircle, ShoppingCart,
    Barcode, Hash, Tags
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { productService, categoryService } from '../../api';

const ProductManagementPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedProductDetail, setSelectedProductDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        cost: '',
        price: '',
        quantity: '',
        description: '',
        is_active: true,
        image: null,
        categories: []
    });
    const [productFormErrors, setProductFormErrors] = useState({});

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await productService.getProducts();
            setProducts(response.data || response);
        } catch (err) {
            toast.error('Failed to load products. Please try again.');
            console.error('Error loading products:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            setCategories(response.data || response);
        } catch (err) {
            console.error('Error loading categories:', err);
            toast.error('Failed to load categories.');
        }
    };

    const handleViewDetails = (product) => {
        setSelectedProductDetail(product);
        setShowDetailModal(true);
        setShowActionMenu(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedProductDetail(null);
    };

    const handleAddProduct = () => {
        setShowAddProductModal(true);
        setProductForm({
            name: '',
            cost: '',
            price: '',
            quantity: '',
            description: '',
            is_active: true,
            image: null,
            categories: []
        });
        setProductFormErrors({});
    };

    const closeAddProductModal = () => {
        setShowAddProductModal(false);
        setProductForm({
            name: '',
            cost: '',
            price: '',
            quantity: '',
            description: '',
            is_active: true,
            image: null,
            categories: []
        });
        setProductFormErrors({});
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            cost: product.cost || '',
            price: product.price || '',
            quantity: product.quantity || '',
            description: product.description || '',
            is_active: product.is_active !== undefined ? product.is_active : true,
            image: null,
            categories: product.categories ? product.categories.map(cat => cat.id) : []
        });
        setProductFormErrors({});
        setShowEditProductModal(true);
        setShowActionMenu(null);
    };

    const closeEditProductModal = () => {
        setShowEditProductModal(false);
        setEditingProduct(null);
        setProductForm({
            name: '',
            cost: '',
            price: '',
            quantity: '',
            description: '',
            is_active: true,
            image: null,
            categories: []
        });
        setProductFormErrors({});
    };

    const handleDeleteProduct = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
        setShowActionMenu(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    const handleProductFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setProductForm(prev => ({
                ...prev,
                [name]: files[0] || null
            }));
        } else if (type === 'checkbox') {
            setProductForm(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setProductForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
        if (productFormErrors[name]) {
            setProductFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleCategoryChange = (categoryId) => {
        setProductForm(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryId)
                ? prev.categories.filter(id => id !== categoryId)
                : [...prev.categories, categoryId]
        }));
    };

    const validateProductForm = () => {
        const errors = {};
        if (!productForm.name.trim()) errors.name = 'Product name is required';
        if (!productForm.cost || parseFloat(productForm.cost) <= 0) errors.cost = 'Valid cost is required';
        if (!productForm.price || parseFloat(productForm.price) <= 0) errors.price = 'Valid price is required';
        if (!productForm.quantity || parseInt(productForm.quantity) < 0) errors.quantity = 'Valid quantity is required';
        setProductFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!validateProductForm()) return;
        setIsCreating(true);
        try {
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('cost', productForm.cost);
            formData.append('price', productForm.price);
            formData.append('quantity', productForm.quantity);
            formData.append('description', productForm.description);
            formData.append('is_active', productForm.is_active);
            productForm.categories.forEach(categoryId => {
                formData.append('categories', categoryId);
            });
            if (productForm.image) {
                formData.append('image', productForm.image);
            }
            await productService.createProduct(formData);
            toast.success('Product created successfully!');
            closeAddProductModal();
            loadProducts();
        } catch (err) {
            toast.error('Failed to create product. Please try again.');
            console.error('Error creating product:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!validateProductForm()) return;
        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('cost', productForm.cost);
            formData.append('price', productForm.price);
            formData.append('quantity', productForm.quantity);
            formData.append('description', productForm.description);
            formData.append('is_active', productForm.is_active);
            productForm.categories.forEach(categoryId => {
                formData.append('categories', categoryId);
            });
            if (productForm.image) {
                formData.append('image', productForm.image);
            }
            await productService.updateProduct(editingProduct.id, formData);
            toast.success('Product updated successfully!');
            closeEditProductModal();
            loadProducts();
        } catch (err) {
            toast.error('Failed to update product. Please try again.');
            console.error('Error updating product:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await productService.deleteProduct(productToDelete.id);
            toast.success('Product deleted successfully!');
            closeDeleteModal();
            loadProducts();
        } catch (err) {
            toast.error('Failed to delete product. Please try again.');
            console.error('Error deleting product:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const refreshProducts = async () => {
        setIsRefreshing(true);
        await loadProducts();
        setIsRefreshing(false);
    };

    const exportProducts = () => {
        const csvContent = [
            ['Product Code', 'Name', 'Cost', 'Price', 'Quantity', 'Categories', 'Status', 'Created Date'],
            ...filteredProducts.map(product => [
                product.product_code,
                product.name,
                product.cost,
                product.price,
                product.quantity,
                product.categories ? product.categories.map(cat => cat.name).join('; ') : '',
                product.is_active ? 'Active' : 'Inactive',
                new Date(product.created_at || Date.now()).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.categories && product.categories.some(cat =>
                cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ));

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && product.is_active) ||
            (filterStatus === 'inactive' && !product.is_active) ||
            (filterStatus === 'low_stock' && product.quantity <= 10);

        const matchesCategory = filterCategory === 'all' ||
            (product.categories && product.categories.some(cat => cat.id.toString() === filterCategory));

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200';
    };

    const getStockStatusColor = (quantity) => {
        if (quantity === 0) return 'bg-red-100 text-red-800 border-red-200';
        if (quantity <= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStockStatusText = (quantity) => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity <= 10) return 'Low Stock';
        return 'In Stock';
    };

    const getCategoryColor = (index) => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-pink-100 text-pink-800 border-pink-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-cyan-100 text-cyan-800 border-cyan-200',
            'bg-teal-100 text-teal-800 border-teal-200'
        ];
        return colors[index % colors.length];
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = 'http://localhost:8000/api/';
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${baseUrl}${cleanPath}`;
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Products</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadProducts}
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
                            <Package className="h-8 w-8 text-amber-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                                <p className="text-sm text-gray-600">Manage hotel products and inventory</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshProducts}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportProducts}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                            <button
                                onClick={handleAddProduct}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
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
                                        <option value="all">All Products</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="low_stock">Low Stock</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <Tags className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Total: {filteredProducts.length} products</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading products...</p>
                            </div>
                        </div>
                    ) : currentProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-600">
                                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No products have been created yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-12 w-12">
                                                            {product.image ? (
                                                                <img
                                                                    className="h-12 w-12 rounded-lg object-cover"
                                                                    src={getImageUrl(product.image.replace(/^https?:\/\/[^/]+/, ''))}
                                                                    alt={product.name}
                                                                />
                                                            ) : (
                                                                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                                                    <Package className="h-6 w-6 text-amber-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.name}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {product.categories && product.categories.length > 0 ? (
                                                            product.categories.slice(0, 3).map((category, index) => (
                                                                <span
                                                                    key={category.id}
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(index)}`}
                                                                >
                                                                    <Tag className="h-3 w-3 mr-1" />
                                                                    {category.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No categories</span>
                                                        )}
                                                        {product.categories && product.categories.length > 3 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{product.categories.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <DollarSign className="h-3 w-3 mr-1 text-green-600" />
                                                            <span className="font-medium">${product.price}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Cost: ${product.cost}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <Box className="h-4 w-4 text-gray-400 mr-2" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {product.quantity}
                                                        </span>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getStockStatusColor(product.quantity)}`}>
                                                        {getStockStatusText(product.quantity)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(product.is_active)}`}>
                                                        {product.is_active ? (
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        {new Date(product.created_at || Date.now()).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium">
                                                    <div className="py-1 flex space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(product)}
                                                            className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />

                                                        </button>
                                                        <button
                                                            onClick={() => handleEditProduct(product)}
                                                            className="flex items-center w-full  text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />

                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product)}
                                                            className="flex items-center w-full 2 text-sm text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />

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
                                                Showing <span className="font-medium">{indexOfFirstProduct + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastProduct, filteredProducts.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredProducts.length}</span> results
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


            {showDetailModal && selectedProductDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center m">
                                {selectedProductDetail.image ? (
                                    <img
                                        className="h-12 w-12 rounded-lg object-cover mr-3"
                                        src={getImageUrl(selectedProductDetail.image.replace(/^https?:\/\/[^/]+/, ''))}
                                        alt={selectedProductDetail.name}
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mr-4">
                                        <Package className="h-6 w-6 text-amber-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {selectedProductDetail.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">Product Details</p>
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
                                        <h4 className="text-lg font-medium text-gray-900">Product Code: {selectedProductDetail.product_code}</h4>
                                        <p className="text-sm text-gray-600">Hotel Product</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProductDetail.is_active)}`}>
                                            {selectedProductDetail.is_active ? (
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                            ) : (
                                                <XCircle className="h-4 w-4 mr-2" />
                                            )}
                                            {selectedProductDetail.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStockStatusColor(selectedProductDetail.quantity)}`}>
                                            <Box className="h-4 w-4 mr-2" />
                                            {getStockStatusText(selectedProductDetail.quantity)}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Price</p>
                                        <p className="text-sm font-semibold text-gray-900">${selectedProductDetail.price}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <DollarSign className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Cost</p>
                                        <p className="text-sm font-semibold text-gray-900">${selectedProductDetail.cost}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Box className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Stock</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedProductDetail.quantity}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                        <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(selectedProductDetail.created_at || Date.now()).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Information Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Product Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Package className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Product Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</p>
                                            <div className="flex items-center mt-1">
                                                <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-900 font-mono">{selectedProductDetail.product_code}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</p>
                                            <p className="text-sm text-gray-900">{selectedProductDetail.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                                            <p className="text-sm text-gray-900">{selectedProductDetail.description || 'No description provided'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(selectedProductDetail.is_active)}`}>
                                                {selectedProductDetail.is_active ? (
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                )}
                                                {selectedProductDetail.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <DollarSign className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Pricing Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</p>
                                            <div className="flex items-center mt-1">
                                                <DollarSign className="h-4 w-4 text-amber-600 mr-2" />
                                                <p className="text-sm text-gray-900 font-semibold">${selectedProductDetail.cost}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</p>
                                            <div className="flex items-center mt-1">
                                                <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                                                <p className="text-sm text-gray-900 font-semibold">${selectedProductDetail.price}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin</p>
                                            <div className="flex items-center mt-1">
                                                <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                                                <p className="text-sm text-gray-900 font-semibold">
                                                    ${(parseFloat(selectedProductDetail.price) - parseFloat(selectedProductDetail.cost)).toFixed(2)}
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        ({(((parseFloat(selectedProductDetail.price) - parseFloat(selectedProductDetail.cost)) / parseFloat(selectedProductDetail.price)) * 100).toFixed(1)}%)
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Inventory Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Box className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Inventory Information</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</p>
                                            <div className="flex items-center mt-1">
                                                <Box className="h-4 w-4 text-blue-600 mr-2" />
                                                <p className="text-sm text-gray-900 font-semibold">{selectedProductDetail.quantity} units</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStockStatusColor(selectedProductDetail.quantity)}`}>
                                                <Box className="h-3 w-3 mr-1" />
                                                {getStockStatusText(selectedProductDetail.quantity)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</p>
                                            <div className="flex items-center mt-1">
                                                <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                                                <p className="text-sm text-gray-900 font-semibold">
                                                    ${(parseFloat(selectedProductDetail.price) * parseFloat(selectedProductDetail.quantity)).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Timeline */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Product Timeline</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedProductDetail.created_at || Date.now()).toLocaleDateString('en-US', {
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
                                                    {selectedProductDetail.updated_at
                                                        ? new Date(selectedProductDetail.updated_at).toLocaleDateString('en-US', {
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
                                            <div className={`w-2 h-2 rounded-full mr-3 ${selectedProductDetail.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</p>
                                                <p className="text-sm text-gray-900">{selectedProductDetail.is_active ? 'Active' : 'Inactive'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Image Section */}
                            {selectedProductDetail.image && (
                                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <ImageIcon className="h-5 w-5 text-amber-600 mr-2" />
                                        <h5 className="text-lg font-medium text-gray-900">Product Image</h5>
                                    </div>
                                    <div className="flex justify-center">
                                        <img
                                            src={selectedProductDetail.image}
                                            alt={selectedProductDetail.name}
                                            className="max-w-sm max-h-64 object-contain rounded-lg border border-gray-300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    Product Code: {selectedProductDetail.product_code} • Last viewed: {new Date().toLocaleString()}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleEditProduct(selectedProductDetail)}
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
            )}

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Plus className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
                            </div>
                            <button
                                onClick={closeAddProductModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProduct} className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={productForm.name}
                                        onChange={handleProductFormChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter product name"
                                    />
                                    {productFormErrors.name && <p className="text-red-500 text-xs mt-1">{productFormErrors.name}</p>}
                                </div>

                                {/* Categories Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categories
                                    </label>
                                    <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                                        {categories.length > 0 ? (
                                            <div className="space-y-2">
                                                {categories.map((category) => (
                                                    <label key={category.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={productForm.categories.includes(category.id)}
                                                            onChange={() => handleCategoryChange(category.id)}
                                                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No categories available</p>
                                        )}
                                    </div>
                                    {productForm.categories.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {productForm.categories.map((categoryId) => {
                                                const category = categories.find(cat => cat.id === categoryId);
                                                return category ? (
                                                    <span
                                                        key={categoryId}
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                                                    >
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        {category.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cost Price
                                        </label>
                                        <input
                                            type="number"
                                            name="cost"
                                            value={productForm.cost}
                                            onChange={handleProductFormChange}
                                            step="0.01"
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.cost ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0.00"
                                        />
                                        {productFormErrors.cost && <p className="text-red-500 text-xs mt-1">{productFormErrors.cost}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Selling Price
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={productForm.price}
                                            onChange={handleProductFormChange}
                                            step="0.01"
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.price ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0.00"
                                        />
                                        {productFormErrors.price && <p className="text-red-500 text-xs mt-1">{productFormErrors.price}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Initial Quantity
                                        </label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={productForm.quantity}
                                            onChange={handleProductFormChange}
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.quantity ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0"
                                        />
                                        {productFormErrors.quantity && <p className="text-red-500 text-xs mt-1">{productFormErrors.quantity}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={productForm.is_active}
                                                onChange={handleProductFormChange}
                                                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">
                                                Active Product
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Image
                                    </label>
                                    <input
                                        type="file"
                                        name="image"
                                        onChange={handleProductFormChange}
                                        accept="image/*"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload an image for the product (optional)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={productForm.description}
                                        onChange={handleProductFormChange}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Enter product description (optional)"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeAddProductModal}
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
                                        'Create Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditProductModal && editingProduct && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <Edit className="h-6 w-6 text-amber-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
                            </div>
                            <button
                                onClick={closeEditProductModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProduct} className="p-6">
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Code
                                    </label>
                                    <div className="flex items-center">
                                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm font-mono text-gray-900">{editingProduct.product_code}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={productForm.name}
                                        onChange={handleProductFormChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter product name"
                                    />
                                    {productFormErrors.name && <p className="text-red-500 text-xs mt-1">{productFormErrors.name}</p>}
                                </div>

                                {/* Categories Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categories
                                    </label>
                                    <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                                        {categories.length > 0 ? (
                                            <div className="space-y-2">
                                                {categories.map((category) => (
                                                    <label key={category.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={productForm.categories.includes(category.id)}
                                                            onChange={() => handleCategoryChange(category.id)}
                                                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No categories available</p>
                                        )}
                                    </div>
                                    {productForm.categories.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {productForm.categories.map((categoryId) => {
                                                const category = categories.find(cat => cat.id === categoryId);
                                                return category ? (
                                                    <span
                                                        key={categoryId}
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                                                    >
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        {category.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cost Price
                                        </label>
                                        <input
                                            type="number"
                                            name="cost"
                                            value={productForm.cost}
                                            onChange={handleProductFormChange}
                                            step="0.01"
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.cost ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0.00"
                                        />
                                        {productFormErrors.cost && <p className="text-red-500 text-xs mt-1">{productFormErrors.cost}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Selling Price
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={productForm.price}
                                            onChange={handleProductFormChange}
                                            step="0.01"
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.price ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0.00"
                                        />
                                        {productFormErrors.price && <p className="text-red-500 text-xs mt-1">{productFormErrors.price}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={productForm.quantity}
                                            onChange={handleProductFormChange}
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${productFormErrors.quantity ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0"
                                        />
                                        {productFormErrors.quantity && <p className="text-red-500 text-xs mt-1">{productFormErrors.quantity}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={productForm.is_active}
                                                onChange={handleProductFormChange}
                                                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">
                                                Active Product
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Image
                                    </label>
                                    {editingProduct.image && (
                                        <div className="mb-2">
                                            <img
                                                src={getImageUrl(editingProduct.image.replace(/^https?:\/\/[^/]+/, ''))}
                                                alt={editingProduct.name}
                                                className="h-20 w-20 object-cover rounded-md border border-gray-300"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Current image</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="image"
                                        onChange={handleProductFormChange}
                                        accept="image/*"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload a new image to replace the current one (optional)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={productForm.description}
                                        onChange={handleProductFormChange}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Enter product description (optional)"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeEditProductModal}
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
                                        'Update Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && productToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div className="flex items-center">
                                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                            </div>
                            <button
                                onClick={closeDeleteModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                {productToDelete.image ? (
                                    <img
                                        className="h-12 w-12 rounded-lg object-cover mr-4"
                                        src={getImageUrl(productToDelete.image.replace(/^https?:\/\/[^/]+/, ''))}
                                        alt={productToDelete.name}
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mr-4">
                                        <Package className="h-6 w-6 text-amber-600" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900">{productToDelete.name}</h4>
                                    <p className="text-sm text-gray-500">Code: {productToDelete.product_code}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <div className="flex">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-700">
                                        <p className="font-medium">Warning:</p>
                                        <p>Deleting this product will remove all associated data and cannot be recovered.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteProduct}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <div className="flex items-center">
                                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                        Deleting...
                                    </div>
                                ) : (
                                    'Delete Product'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagementPage;

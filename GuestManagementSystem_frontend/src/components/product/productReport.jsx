import React, { useState, useEffect } from 'react';
import { Package, Download, Filter, Calendar, DollarSign, TrendingUp, BarChart3, Search, RefreshCw, AlertTriangle, CheckCircle, Clock, Calculator, Layers, Target, PieChart, Box, Tag, ShoppingCart, Star, Building, Zap, Activity, Archive, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { productService, categoryService } from '../../api';

const ProductReportPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all', // active, inactive
        priceRange: 'all',
        stockLevel: 'all', // in-stock, low-stock, out-of-stock
        dateFrom: '',
        dateTo: '',
        searchTerm: '',
        sortBy: 'name' // name, price, cost, quantity, profit
    });

    // Company info for branding
    const companyInfo = {
        name: 'ESSENCIA KIVU HOTEL',
        logo: '🏢',
        address: 'RWANDA, RUSIZI',
        phone: '+250 787 645 645',
        email: 'support@ESSENCIA-KIVU-HOTEL.com'
    };

    // Load products from API
    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productService.getProducts();
            console.log('Products response:', response);
            const productsData = response.data || response;
            setProducts(productsData);
            setFilteredProducts(productsData);
        } catch (err) {
            console.error('Error loading products:', err);
            setError('Failed to load products. Please try again.');
            toast.error('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load categories from API
    const loadCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            console.log('Categories response:', response);
            const categoriesData = response.data || response;
            setCategories(categoriesData);
        } catch (err) {
            console.error('Error loading categories:', err);
            toast.error('Failed to load categories.');
        }
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    // Apply filters to products
    useEffect(() => {
        let filtered = products.filter(product => {
            // Category filter
            if (filters.category !== 'all') {
                const productCategories = product.categories || [];
                const hasCategory = Array.isArray(productCategories)
                    ? productCategories.includes(parseInt(filters.category))
                    : productCategories.some(cat => cat.id === parseInt(filters.category));
                if (!hasCategory) return false;
            }

            // Status filter
            if (filters.status !== 'all') {
                if (filters.status === 'active' && !product.is_active) return false;
                if (filters.status === 'inactive' && product.is_active) return false;
            }

            // Stock level filter
            if (filters.stockLevel !== 'all') {
                const quantity = product.quantity || 0;
                if (filters.stockLevel === 'out-of-stock' && quantity > 0) return false;
                if (filters.stockLevel === 'low-stock' && (quantity === 0 || quantity > 10)) return false;
                if (filters.stockLevel === 'in-stock' && quantity <= 10) return false;
            }

            // Price range filter
            if (filters.priceRange !== 'all') {
                const price = parseFloat(product.price || 0);
                if (filters.priceRange === 'under-10000' && price >= 10000) return false;
                if (filters.priceRange === '10000-50000' && (price < 10000 || price > 50000)) return false;
                if (filters.priceRange === 'over-50000' && price <= 50000) return false;
            }

            // Date range filter
            if (filters.dateFrom || filters.dateTo) {
                const productDate = new Date(product.created_at);
                if (filters.dateFrom && productDate < new Date(filters.dateFrom)) {
                    return false;
                }
                if (filters.dateTo && productDate > new Date(filters.dateTo + 'T23:59:59')) {
                    return false;
                }
            }

            // Search filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                return (
                    product.name?.toLowerCase().includes(searchLower) ||
                    product.product_code?.toLowerCase().includes(searchLower) ||
                    product.description?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'price':
                    return (parseFloat(b.price || 0) - parseFloat(a.price || 0));
                case 'cost':
                    return (parseFloat(b.cost || 0) - parseFloat(a.cost || 0));
                case 'quantity':
                    return (b.quantity || 0) - (a.quantity || 0);
                case 'profit':
                    const profitA = (parseFloat(a.price || 0) - parseFloat(a.cost || 0));
                    const profitB = (parseFloat(b.price || 0) - parseFloat(b.cost || 0));
                    return profitB - profitA;
                default:
                    return 0;
            }
        });

        setFilteredProducts(filtered);
    }, [products, filters]);

    const toSafeFloat = (value) => {
        const cleaned = String(value || '0').replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const calculateAnalytics = () => {
        const analytics = {
            // Basic metrics
            totalProducts: filteredProducts.length,
            activeProducts: filteredProducts.filter(p => p.is_active).length,
            inactiveProducts: filteredProducts.filter(p => !p.is_active).length,

            // Inventory metrics
            totalInventoryValue: filteredProducts.reduce((sum, product) => {
                return sum + (toSafeFloat(product.cost) * (product.quantity || 0));
            }, 0),
            totalRetailValue: filteredProducts.reduce((sum, product) => {
                return sum + (toSafeFloat(product.price) * (product.quantity || 0));
            }, 0),
            totalQuantity: filteredProducts.reduce((sum, product) => sum + (product.quantity || 0), 0),

            // Profit calculations
            totalPotentialProfit: filteredProducts.reduce((sum, product) => {
                const profit = toSafeFloat(product.price) - toSafeFloat(product.cost);
                return sum + (profit * (product.quantity || 0));
            }, 0),
            averagePrice: filteredProducts.length > 0
                ? filteredProducts.reduce((sum, product) => sum + toSafeFloat(product.price), 0) / filteredProducts.length
                : 0,
            averageCost: filteredProducts.length > 0
                ? filteredProducts.reduce((sum, product) => sum + toSafeFloat(product.cost), 0) / filteredProducts.length
                : 0,

            // Stock level breakdown
            stockLevels: {
                outOfStock: filteredProducts.filter(p => (p.quantity || 0) === 0).length,
                lowStock: filteredProducts.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10).length,
                inStock: filteredProducts.filter(p => (p.quantity || 0) > 10).length
            },

            // Category breakdown
            categoryBreakdown: categories.map(category => {
                const categoryProducts = filteredProducts.filter(product => {
                    const productCategories = product.categories || [];
                    return Array.isArray(productCategories)
                        ? productCategories.includes(category.id)
                        : productCategories.some(cat => cat.id === category.id);
                });

                return {
                    id: category.id,
                    name: category.name,
                    productCount: categoryProducts.length,
                    totalValue: categoryProducts.reduce((sum, product) => {
                        return sum + (toSafeFloat(product.price) * (product.quantity || 0));
                    }, 0),
                    totalQuantity: categoryProducts.reduce((sum, product) => sum + (product.quantity || 0), 0)
                };
            }).filter(cat => cat.productCount > 0),

            // Top products by various metrics
            topProductsByValue: [...filteredProducts]
                .map(product => ({
                    ...product,
                    totalValue: toSafeFloat(product.price) * (product.quantity || 0)
                }))
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 5),

            topProductsByQuantity: [...filteredProducts]
                .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
                .slice(0, 5),

            topProductsByProfit: [...filteredProducts]
                .map(product => ({
                    ...product,
                    unitProfit: toSafeFloat(product.price) - toSafeFloat(product.cost),
                    totalProfit: (toSafeFloat(product.price) - toSafeFloat(product.cost)) * (product.quantity || 0)
                }))
                .sort((a, b) => b.totalProfit - a.totalProfit)
                .slice(0, 5)
        };

        // Calculate average profit margin
        analytics.averageProfitMargin = analytics.averagePrice > 0
            ? ((analytics.averagePrice - analytics.averageCost) / analytics.averagePrice) * 100
            : 0;

        return analytics;
    };

    const analytics = calculateAnalytics();

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Enhanced RWF currency formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0).replace('RWF', 'RWF ');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStockLevelColor = (quantity) => {
        if (quantity === 0) return 'bg-red-100 text-red-800';
        if (quantity <= 10) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getStockLevelText = (quantity) => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity <= 10) return 'Low Stock';
        return 'In Stock';
    };

    const getCurrentDateRange = () => {
        if (filters.dateFrom && filters.dateTo) {
            return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
        } else if (filters.dateFrom) {
            return `From ${formatDate(filters.dateFrom)}`;
        } else if (filters.dateTo) {
            return `Until ${formatDate(filters.dateTo)}`;
        }
        return 'All Time';
    };

    const getCategoryName = (categoryIds) => {
        if (!categoryIds || categoryIds.length === 0) return 'Uncategorized';

        if (Array.isArray(categoryIds)) {
            const categoryNames = categoryIds.map(id => {
                const category = categories.find(cat => cat.id === id);
                return category ? category.name : 'Unknown';
            });
            return categoryNames.join(', ');
        }

        return categoryIds.map(cat => cat.name || 'Unknown').join(', ');
    };

    // Enhanced PDF Report Generation
    const generatePDFReport = () => {
        setGeneratingPDF(true);
        try {
            toast.info('Creating PDF report...', { autoClose: 2000 });
            const printWindow = window.open('', '_blank');
            const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Product Analytics Report - ${companyInfo.name}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 20px;
                        color: #333;
                        line-height: 1.6;
                        background: #f8fafc;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .company-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                    }
                    .company-logo {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    .company-logo .logo {
                        font-size: 48px;
                    }
                    .company-info h1 {
                        margin: 0;
                        color: #1e293b;
                        font-size: 28px;
                        font-weight: 700;
                    }
                    .company-info p {
                        margin: 5px 0;
                        color: #64748b;
                        font-size: 14px;
                    }
                    .report-meta {
                        text-align: right;
                    }
                    .report-meta h2 {
                        margin: 0;
                        color: #3b82f6;
                        font-size: 24px;
                        font-weight: 700;
                    }
                    .report-meta p {
                        margin: 5px 0;
                        color: #64748b;
                        font-size: 14px;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 25px;
                        margin-bottom: 40px;
                    }
                    .stat-card {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 25px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                        position: relative;
                        overflow: hidden;
                    }
                    .stat-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 4px;
                        background: #3b82f6;
                    }
                    .stat-card h3 {
                        margin: 0 0 12px 0;
                        color: #475569;
                        font-size: 14px;
                        text-transform: uppercase;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .stat-card .value {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 8px;
                    }
                    .stat-card .subtitle {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                    }
                    .section-title {
                        font-size: 22px;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 40px 0 20px 0;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 13px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .table th, .table td {
                        border: 1px solid #e2e8f0;
                        padding: 12px;
                        text-align: left;
                    }
                    .table th {
                        background: #f1f5f9;
                        font-weight: 600;
                        color: #334155;
                        text-transform: uppercase;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                    }
                    .table tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    .table tr:hover {
                        background: #f1f5f9;
                    }
                    .stock-out { color: #dc2626; font-weight: 600; }
                    .stock-low { color: #d97706; font-weight: 600; }
                    .stock-good { color: #059669; font-weight: 600; }
                    .status-active { color: #059669; font-weight: 600; }
                    .status-inactive { color: #6b7280; font-weight: 600; }
                    .signature-section {
                        margin-top: 50px;
                        padding: 30px;
                        background: #f8fafc;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                    }
                    .signature-section h3 {
                        color: #1e293b;
                        margin: 0 0 25px 0;
                        font-size: 20px;
                        font-weight: 700;
                        text-align: center;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 50px;
                        margin-top: 30px;
                    }
                    .signature-box {
                        text-align: center;
                        padding: 20px;
                        background: white;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                    }
                    .signature-line {
                        border-bottom: 2px solid #334155;
                        height: 60px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        padding-bottom: 10px;
                    }
                    .signature-label {
                        font-weight: 600;
                        color: #1e293b;
                        margin-bottom: 8px;
                    }
                    .signature-title {
                        font-size: 14px;
                        color: #64748b;
                        font-weight: 500;
                    }
                    .signature-date {
                        font-size: 12px;
                        color: #64748b;
                        margin-top: 10px;
                    }
                    @media print {
                        body { background: white; }
                        .container { box-shadow: none; }
                        .stat-card { box-shadow: none; }
                        .table { box-shadow: none; }
                        .signature-section { background: white; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="company-header">
                        <div class="company-logo">
                            <div class="company-info">
                                <h1>${companyInfo.name}</h1>
                                <p>📍 ${companyInfo.address}</p>
                                <p>📞 ${companyInfo.phone} | 📧 ${companyInfo.email}</p>
                            </div>
                        </div>
                        <div class="report-meta">
                            <h2>📦 Product Analytics Report</h2>
                            <p><strong>Report Period:</strong> ${getCurrentDateRange()}</p>
                            <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
                            <p><strong>Total Products:</strong> ${analytics.totalProducts}</p>
                        </div>
                    </div>

                    <h2 class="section-title">📊 Key Metrics</h2>
                    

                    <h2 class="section-title">📦 Product Inventory</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Product Code</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Cost (RWF)</th>
                                <th>Price (RWF)</th>
                                <th>Quantity</th>
                                <th>Stock Status</th>
                                <th>Total Value (RWF)</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${filteredProducts.slice(0, 50).map((product) => {
                const stockClass = product.quantity === 0 ? 'stock-out' : product.quantity <= 10 ? 'stock-low' : 'stock-good';
                const totalValue = toSafeFloat(product.price) * (product.quantity || 0);
                return `
                                <tr>
                                    <td><strong>${product.product_code || 'N/A'}</strong></td>
                                    <td>
                                        <div style="font-weight: 600;">${product.name || 'N/A'}</div>
                                        
                                    </td>
                                    <td>${getCategoryName(product.categories)}</td>
                                    <td style="font-weight: 600;">${formatCurrency(product.cost)}</td>
                                    <td style="font-weight: 600; color: #059669;">${formatCurrency(product.price)}</td>
                                    <td style="font-weight: 700;">${product.quantity || 0}</td>
                                    <td><span class="${stockClass}">${getStockLevelText(product.quantity || 0)}</span></td>
                                    <td style="font-weight: 700; color: #059669;">${formatCurrency(totalValue)}</td>
                                </tr>
                            `;
            }).join('')}
                        </tbody>
                    </table>
                    ${filteredProducts.length > 50 ? `
                    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; color: #92400e;">
                        <strong>Note:</strong> Showing first 50 products of ${filteredProducts.length} total products.
                        Use filters to narrow down results for complete data.
                    </div>
                    ` : ''}

                    <div class="signature-section">
                        <h3>✍️ Report Authorization & Approval</h3>
                        <div class="signature-grid">
                            <div class="signature-box">
                                <div class="signature-label">Prepared By</div>
                                <div class="signature-line"></div>
                                <div class="signature-title">Inventory Management Team</div>
                                <div class="signature-title">Product Analytics Department</div>
                                <div class="signature-date">Date: _______________</div>
                            </div>
                            <div class="signature-box">
                                <div class="signature-label">Reviewed & Approved By</div>
                                <div class="signature-line"></div>
                                <div class="signature-title">Operations Manager</div>
                                <div class="signature-title">Inventory Controller</div>
                                <div class="signature-date">Date: _______________</div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

            printWindow.document.write(reportHTML);
            printWindow.document.close();

            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
                toast.success('📄 PDF report generated successfully!', {
                    autoClose: 4000,
                    position: "top-right"
                });
                setGeneratingPDF(false);
            }, 1000);
        } catch (error) {
            console.error('Error generating PDF report:', error);
            toast.error(`❌ Failed to generate PDF: ${error.message}`, {
                autoClose: 5000,
                position: "top-right"
            });
            setGeneratingPDF(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-blue-100/50 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-13 h-13 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                    <BarChart3 className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                                    Product Analytics Report
                                </h1>
                                <p className="text-gray-600 text-sm font-medium">Comprehensive inventory analysis with detailed product metrics</p>
                            </div>
                        </div>
                        <button
                            onClick={generatePDFReport}
                            disabled={generatingPDF || loading}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generatingPDF ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    <span>Download PDF Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Filters Section */}
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 mb-8 overflow-hidden">
                    <div className="p-6 border-b border-gray-100/50">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Filter className="w-5 h-5 mr-2 text-blue-600" />
                            Report Filters
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={filters.searchTerm}
                                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Stock Level</label>
                                <select
                                    value={filters.stockLevel}
                                    onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                >
                                    <option value="all">All Stock Levels</option>
                                    <option value="in-stock">✅ In Stock</option>
                                    <option value="low-stock">⚠️ Low Stock</option>
                                    <option value="out-of-stock">❌ Out of Stock</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Price Range</label>
                                <select
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                >
                                    <option value="all">All Prices</option>
                                    <option value="under-10000">Under 10,000 RWF</option>
                                    <option value="10000-50000">10,000 - 50,000 RWF</option>
                                    <option value="over-50000">Over 50,000 RWF</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Sort By</label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                >
                                    <option value="name">Name</option>
                                    <option value="price">Price (High to Low)</option>
                                    <option value="cost">Cost (High to Low)</option>
                                    <option value="quantity">Quantity (High to Low)</option>
                                    <option value="profit">Profit (High to Low)</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Range Filters - Second Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Date From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Date To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Quick Date Filters</label>
                                <select
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const today = new Date();
                                        if (value === 'today') {
                                            const todayStr = today.toISOString().split('T')[0];
                                            handleFilterChange('dateFrom', todayStr);
                                            handleFilterChange('dateTo', todayStr);
                                        } else if (value === 'this-week') {
                                            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                                            const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                                            handleFilterChange('dateFrom', weekStart.toISOString().split('T')[0]);
                                            handleFilterChange('dateTo', weekEnd.toISOString().split('T')[0]);
                                        } else if (value === 'this-month') {
                                            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                                            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                            handleFilterChange('dateFrom', monthStart.toISOString().split('T')[0]);
                                            handleFilterChange('dateTo', monthEnd.toISOString().split('T')[0]);
                                        } else if (value === 'last-30-days') {
                                            const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
                                            const todayStr = new Date().toISOString().split('T')[0];
                                            handleFilterChange('dateFrom', thirtyDaysAgo.toISOString().split('T')[0]);
                                            handleFilterChange('dateTo', todayStr);
                                        } else if (value === 'clear') {
                                            handleFilterChange('dateFrom', '');
                                            handleFilterChange('dateTo', '');
                                        }
                                        e.target.value = ''; // Reset select
                                    }}
                                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                >
                                    <option value="">Quick Select...</option>
                                    <option value="today">📅 Today</option>
                                    <option value="this-week">📅 This Week</option>
                                    <option value="this-month">📅 This Month</option>
                                    <option value="last-30-days">📅 Last 30 Days</option>
                                    <option value="clear">🔄 Clear Dates</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Clear All Filters</label>
                                <button
                                    onClick={() => {
                                        setFilters({
                                            category: 'all',
                                            status: 'all',
                                            priceRange: 'all',
                                            stockLevel: 'all',
                                            dateFrom: '',
                                            dateTo: '',
                                            searchTerm: '',
                                            sortBy: 'name'
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg transition-all duration-300 font-medium"
                                >
                                    🔄 Clear All
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-600">
                                Showing {filteredProducts.length} products of {products.length} total • {getCurrentDateRange()}
                            </div>
                            <button
                                onClick={() => {
                                    loadProducts();
                                    loadCategories();
                                }}
                                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <span className="ml-4 text-gray-600 font-medium">Loading product data...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Report</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={() => {
                                loadProducts();
                                loadCategories();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    /* Report Dashboard */
                    <div className="space-y-8">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-2xl">📦</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-800 mb-1">
                                    {analytics.totalProducts}
                                </div>
                                <div className="text-sm text-blue-600 font-medium">Total Products</div>
                                <div className="text-xs text-blue-500 mt-1">
                                    {analytics.activeProducts} active • {analytics.inactiveProducts} inactive
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-2xl">💰</span>
                                </div>
                                <div className="text-2xl font-bold text-green-800 mb-1">
                                    {formatCurrency(analytics.totalRetailValue)}
                                </div>
                                <div className="text-sm text-green-600 font-medium">Retail Value</div>
                                <div className="text-xs text-green-500 mt-1">
                                    At current prices
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-2xl">📈</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-800 mb-1">
                                    {formatCurrency(analytics.totalPotentialProfit)}
                                </div>
                                <div className="text-sm text-purple-600 font-medium">Potential Profit</div>
                                <div className="text-xs text-purple-500 mt-1">
                                    {analytics.averageProfitMargin.toFixed(1)}% avg margin
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                        <Box className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-2xl">📊</span>
                                </div>
                                <div className="text-2xl font-bold text-orange-800 mb-1">
                                    {analytics.totalQuantity}
                                </div>
                                <div className="text-sm text-orange-600 font-medium">Total Stock Units</div>
                                <div className="text-xs text-orange-500 mt-1">
                                    Across all products
                                </div>
                            </div>
                        </div>

                        {/* Stock Level Analysis */}
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Activity className="w-6 h-6 mr-2 text-blue-600" />
                                Stock Level Analysis
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                                    <div className="text-4xl mb-2">✅</div>
                                    <div className="text-3xl font-bold text-green-700 mb-2">
                                        {analytics.stockLevels.inStock}
                                    </div>
                                    <div className="text-sm text-green-600 font-medium">In Stock</div>
                                    <div className="text-xs text-green-500 mt-1">
                                        {analytics.totalProducts > 0 ? ((analytics.stockLevels.inStock / analytics.totalProducts) * 100).toFixed(1) : 0}% of products
                                    </div>
                                </div>
                                <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                                    <div className="text-4xl mb-2">⚠️</div>
                                    <div className="text-3xl font-bold text-yellow-700 mb-2">
                                        {analytics.stockLevels.lowStock}
                                    </div>
                                    <div className="text-sm text-yellow-600 font-medium">Low Stock</div>
                                    <div className="text-xs text-yellow-500 mt-1">
                                        {analytics.totalProducts > 0 ? ((analytics.stockLevels.lowStock / analytics.totalProducts) * 100).toFixed(1) : 0}% of products
                                    </div>
                                </div>
                                <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
                                    <div className="text-4xl mb-2">❌</div>
                                    <div className="text-3xl font-bold text-red-700 mb-2">
                                        {analytics.stockLevels.outOfStock}
                                    </div>
                                    <div className="text-sm text-red-600 font-medium">Out of Stock</div>
                                    <div className="text-xs text-red-500 mt-1">
                                        {analytics.totalProducts > 0 ? ((analytics.stockLevels.outOfStock / analytics.totalProducts) * 100).toFixed(1) : 0}% of products
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                                Financial Summary (RWF)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="text-3xl font-bold text-blue-700 mb-2">
                                        {formatCurrency(analytics.totalInventoryValue)}
                                    </div>
                                    <div className="text-sm text-blue-600 font-medium">Inventory Cost Value</div>
                                    <div className="text-xs text-blue-500 mt-1">
                                        Avg Cost: {formatCurrency(analytics.averageCost)}
                                    </div>
                                </div>
                                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                                    <div className="text-3xl font-bold text-green-700 mb-2">
                                        {formatCurrency(analytics.totalRetailValue)}
                                    </div>
                                    <div className="text-sm text-green-600 font-medium">Retail Value</div>
                                    <div className="text-xs text-green-500 mt-1">
                                        Avg Price: {formatCurrency(analytics.averagePrice)}
                                    </div>
                                </div>
                                <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
                                    <div className="text-3xl font-bold text-purple-700 mb-2">
                                        {analytics.averageProfitMargin.toFixed(2)}%
                                    </div>
                                    <div className="text-sm text-purple-600 font-medium">Average Profit Margin</div>
                                    <div className="text-xs text-purple-500 mt-1">
                                        Potential: {formatCurrency(analytics.totalPotentialProfit)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        {analytics.categoryBreakdown.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Tag className="w-6 h-6 mr-2 text-blue-600" />
                                    Category Breakdown
                                </h3>
                                <div className="space-y-4">
                                    {analytics.categoryBreakdown.map((category, index) => (
                                        <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{category.name}</div>
                                                    <div className="text-sm text-gray-500">{category.productCount} products</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(category.totalValue)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {category.totalQuantity} units
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Products by Value */}
                        {analytics.topProductsByValue.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Star className="w-6 h-6 mr-2 text-blue-600" />
                                    Top Products by Inventory Value
                                </h3>
                                <div className="space-y-4">
                                    {analytics.topProductsByValue.map((product, index) => (
                                        <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                                    <div className="text-sm text-gray-500">{product.product_code}</div>
                                                    <div className="text-xs text-gray-400">{getCategoryName(product.categories)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(product.totalValue)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {product.quantity} units × {formatCurrency(product.price)}
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStockLevelColor(product.quantity)}`}>
                                                    {getStockLevelText(product.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Products by Profit */}
                        {analytics.topProductsByProfit.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                                    Most Profitable Products
                                </h3>
                                <div className="space-y-4">
                                    {analytics.topProductsByProfit.map((product, index) => (
                                        <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        Unit Profit: {formatCurrency(product.unitProfit)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Margin: {product.price > 0 ? ((product.unitProfit / product.price) * 100).toFixed(1) : 0}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-purple-600">
                                                    {formatCurrency(product.totalProfit)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Total Potential Profit
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStockLevelColor(product.quantity)}`}>
                                                    {product.quantity} units
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product List Preview */}
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Package className="w-6 h-6 mr-2 text-blue-600" />
                                Product Inventory ({filteredProducts.length} products)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cost (RWF)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price (RWF)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Value (RWF)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredProducts.slice(0, 10).map((product) => {
                                            const totalValue = toSafeFloat(product.price) * (product.quantity || 0);
                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                <div className="text-xs text-gray-500">{product.product_code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getCategoryName(product.categories)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatCurrency(product.cost)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                        {formatCurrency(product.price)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                        {product.quantity || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockLevelColor(product.quantity || 0)}`}>
                                                            {getStockLevelText(product.quantity || 0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                        {formatCurrency(totalValue)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredProducts.length > 10 && (
                                    <div className="mt-4 text-center text-sm text-gray-500">
                                        Showing first 10 products of {filteredProducts.length} total products. Download PDF for complete data.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PDF Generation Loading Overlay */}
            {generatingPDF && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating PDF Report</h3>
                            <p className="text-gray-600">Creating your comprehensive product analytics report...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReportPage;
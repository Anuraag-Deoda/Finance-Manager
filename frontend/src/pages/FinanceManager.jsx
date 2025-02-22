import React, { useState, useEffect, useMemo } from "react";
import MonthPlanner from "../components/MonthPlanner";
import api from '../services/api'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    Plus, Wallet, PieChart as PieChartIcon, TrendingUp, Calendar,
    Users, Pencil, Trash2, Receipt, Search, X, Calendar as CalendarIcon
} from "lucide-react";
import {
    categories, incomeCategories, familyMembers, TRANSACTION_TYPES,
    budgetStatus, chartColors, dateRanges
} from "../utils/constants";

const FinanceManager = () => {
    // Core state management
    const [transactions, setTransactions] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState(dateRanges.MONTHLY);
    const [customDateRange, setCustomDateRange] = useState({
        start: new Date().toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        income: 0,
        expenses: 0,
        balance: 0,
        familyIncome: 0,
        familyExpenses: 0,
        familyBalance: 0
    });

    // Form and UI state
    const [newTransaction, setNewTransaction] = useState({
        type: TRANSACTION_TYPES.EXPENSE,
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        familyMember: "",
        isRecurring: false,
    });

    const [transactionFilter, setTransactionFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [groupingOption, setGroupingOption] = useState("none");
    const [currentPage, setCurrentPage] = useState(1);
    const [activeView, setActiveView] = useState("dashboard");
    const [selectedMonthPlan, setSelectedMonthPlan] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const itemsPerPage = 10;

    // API Integration - Fetch Transactions
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/transactions', {
                params: {
                    month: selectedMonthPlan,
                    type: transactionFilter !== 'all' ? transactionFilter : undefined
                }
            });
            setTransactions(response.data);
        } catch (err) {
            setError('Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Dashboard Data
    const fetchDashboardData = async () => {
        try {
            const [dashboardResponse, familyDashboardResponse] = await Promise.all([
                api.get('/dashboard'),
                api.get('/family-dashboard')
            ]);

            setDashboardData({
                ...dashboardResponse.data,
                ...familyDashboardResponse.data
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to fetch dashboard data');
        }
    };

    // Initial Data Loading
    useEffect(() => {
        fetchTransactions();
        fetchDashboardData();
    }, [selectedMonthPlan, transactionFilter]);

    // Memoized filtered transactions for current month
    const monthTransactions = useMemo(() => {
        return transactions.filter(transaction => 
            transaction.date.startsWith(selectedMonthPlan)
        );
    }, [transactions, selectedMonthPlan]);

    // Transaction CRUD Operations
    const handleAddTransaction = async () => {
        const errors = validateTransaction(newTransaction);
        if (Object.keys(errors).length > 0) return;

        try {
            setLoading(true);
            const response = await api.post('/transactions', newTransaction);

            setTransactions(prev => [...prev, { ...newTransaction, id: response.data.id }]);
            setShowAddModal(false);
            setNewTransaction({
                type: TRANSACTION_TYPES.EXPENSE,
                amount: "",
                category: "",
                description: "",
                date: new Date().toISOString().split("T")[0],
                familyMember: "",
                isRecurring: false,
            });

            fetchDashboardData();
        } catch (err) {
            setError('Failed to add transaction');
            console.error('Error adding transaction:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditTransaction = async (transaction) => {
        try {
            setLoading(true);
            await api.put(`/transactions/${transaction.id}`, transaction);

            setTransactions(prev =>
                prev.map(t => t.id === transaction.id ? transaction : t)
            );

            fetchDashboardData();
        } catch (err) {
            setError('Failed to update transaction');
            console.error('Error updating transaction:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (id) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;

        try {
            setLoading(true);
            await api.delete(`/transactions/${id}`);

            setTransactions(prev => prev.filter(t => t.id !== id));
            fetchDashboardData();
        } catch (err) {
            setError('Failed to delete transaction');
            console.error('Error deleting transaction:', err);
        } finally {
            setLoading(false);
        }
    };

    // Monthly Plan Integration
    const fetchMonthlyPlan = async (month) => {
        try {
            const response = await api.get(`/monthly-plans/${month}`);
            setMonthPlan(response.data);
        } catch (err) {
            console.error('Error fetching monthly plan:', err);
            setError('Failed to fetch monthly plan');
        }
    };

    const handleSavePlan = async (plan) => {
        try {
            setLoading(true);
            await api.put(`/monthly-plans/${plan.month}`, plan);
            setMonthPlan(plan);
        } catch (err) {
            setError('Failed to save plan');
            console.error('Failed to save plan:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === 'planner') {
            fetchMonthlyPlan(selectedMonthPlan);
        }
    }, [activeView, selectedMonthPlan]);

    // Utility Functions
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Form Validation
    const validateTransaction = (transaction) => {
        const errors = {};
        if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
            errors.amount = "Please enter a valid amount";
        }
        if (!transaction.category) {
            errors.category = "Please select a category";
        }
        if (!transaction.familyMember) {
            errors.familyMember = "Please select a family member";
        }
        if (!transaction.date) {
            errors.date = "Please select a date";
        }
        return errors;
    };

    // Filter and Data Processing Functions
    const filterTransactions = (transactions) => {
        return transactions
            .filter((t) => {
                if (transactionFilter !== 'all' && t.type !== transactionFilter) return false;

                const searchLower = searchQuery.toLowerCase();
                return (
                    t.category.toLowerCase().includes(searchLower) ||
                    t.description?.toLowerCase().includes(searchLower) ||
                    t.amount.toString().includes(searchLower) ||
                    t.familyMember.toLowerCase().includes(searchLower)
                );
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const getFilteredTransactions = useMemo(() => {
        const today = new Date();
        const startDate = new Date();

        switch (selectedDateRange) {
            case dateRanges.DAILY:
                startDate.setHours(0, 0, 0, 0);
                break;
            case dateRanges.WEEKLY:
                startDate.setDate(today.getDate() - today.getDay());
                break;
            case dateRanges.MONTHLY:
                startDate.setDate(1);
                break;
            case dateRanges.QUARTERLY:
                startDate.setMonth(Math.floor(today.getMonth() / 3) * 3, 1);
                break;
            case dateRanges.YEARLY:
                startDate.setMonth(0, 1);
                break;
            case dateRanges.CUSTOM:
                return transactions.filter((t) => {
                    const transDate = new Date(t.date);
                    return (
                        transDate >= new Date(customDateRange.start) &&
                        transDate <= new Date(customDateRange.end)
                    );
                });
            default:
                return transactions;
        }

        return transactions.filter((t) => new Date(t.date) >= startDate);
    }, [transactions, selectedDateRange, customDateRange]);

    // Calculate totals and prepare chart data
    const calculateTotal = (type) => {
        return getFilteredTransactions
            .filter((t) => t.type === type)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    };

    const calculateCategoryTotal = (category) => {
        return getFilteredTransactions
            .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && t.category === category)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    };

    const calculateFamilyMemberTotal = (memberName) => {
        return getFilteredTransactions
            .filter((t) => t.familyMember === memberName)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    };

    // Chart Data Preparation
    const prepareCategoryData = useMemo(() => {
        const categoryTotals = {};
        getFilteredTransactions
            .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
            .forEach((t) => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
            });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name,
                value,
                color: categories[name]?.primary || "#8E8E93",
            }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [getFilteredTransactions]);

    const prepareTimelineData = useMemo(() => {
        const timeline = {};
        getFilteredTransactions.forEach((t) => {
            const date = t.date;
            if (!timeline[date]) {
                timeline[date] = { date, income: 0, expense: 0 };
            }
            if (t.type === TRANSACTION_TYPES.INCOME) {
                timeline[date].income += parseFloat(t.amount);
            } else {
                timeline[date].expense += parseFloat(t.amount);
            }
        });

        return Object.values(timeline).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [getFilteredTransactions]);

    const prepareFamilyData = useMemo(() => {
        return familyMembers
            .map((member) => {
                const expenses = getFilteredTransactions
                    .filter((t) => t.familyMember === member.name && t.type === TRANSACTION_TYPES.EXPENSE)
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                const income = getFilteredTransactions
                    .filter((t) => t.familyMember === member.name && t.type === TRANSACTION_TYPES.INCOME)
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                return {
                    name: member.name,
                    expenses,
                    income,
                    color: member.color,
                    icon: member.icon,
                };
            })
            .filter((item) => item.expenses > 0 || item.income > 0);
    }, [getFilteredTransactions]);

    const prepareDailyAverages = useMemo(() => {
        const dailyTotals = {};
        const dayCount = {};

        getFilteredTransactions.forEach((t) => {
            const dayOfWeek = new Date(t.date).toLocaleDateString("en-US", {
                weekday: "long",
            });

            if (!dailyTotals[dayOfWeek]) {
                dailyTotals[dayOfWeek] = { expenses: 0, count: 0 };
            }

            if (t.type === TRANSACTION_TYPES.EXPENSE) {
                dailyTotals[dayOfWeek].expenses += parseFloat(t.amount);
                dailyTotals[dayOfWeek].count += 1;
            }
        });

        return Object.entries(dailyTotals)
            .map(([day, data]) => ({
                day,
                average: data.count > 0 ? data.expenses / data.count : 0,
                total: data.expenses,
                transactions: data.count,
            }))
            .sort((a, b) => {
                const days = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ];
                return days.indexOf(a.day) - days.indexOf(b.day);
            });
    }, [getFilteredTransactions]);

    // Computed values for pagination
    const filteredTransactions = filterTransactions(getFilteredTransactions);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Group transactions by selected option
    const groupTransactions = (transactions) => {
        if (groupingOption === "none") {
            return [{
                title: "All Transactions",
                transactions: transactions,
            }];
        }

        const groups = {};
        transactions.forEach((t) => {
            let groupKey;
            let icon = null;

            switch (groupingOption) {
                case "category":
                    groupKey = t.category;
                    icon = t.type === TRANSACTION_TYPES.INCOME
                        ? incomeCategories[t.category]?.icon
                        : categories[t.category]?.icon;
                    break;
                case "date":
                    groupKey = formatDate(t.date);
                    break;
                case "family":
                    groupKey = t.familyMember;
                    icon = familyMembers.find((m) => m.name === t.familyMember)?.icon;
                    break;
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    title: groupKey,
                    icon,
                    transactions: [],
                    total: 0,
                };
            }
            groups[groupKey].transactions.push(t);
            groups[groupKey].total += parseFloat(t.amount);
        });

        return Object.values(groups).sort((a, b) => b.total - a.total);
    };

    const groupedTransactions = useMemo(() => {
        return groupTransactions(paginatedTransactions);
    }, [paginatedTransactions, groupingOption]);

    // Date range handlers
    const handleDateRangeChange = (range) => {
        setSelectedDateRange(range);
        if (range !== dateRanges.CUSTOM) {
            setCustomDateRange({
                start: new Date().toISOString().split("T")[0],
                end: new Date().toISOString().split("T")[0],
            });
        }
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // Search and filter handlers
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleFilterChange = (filter) => {
        setTransactionFilter(filter);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleGroupingChange = (e) => {
        setGroupingOption(e.target.value);
    };

    // Modal handlers
    const handleShowAddModal = () => {
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setNewTransaction({
            type: TRANSACTION_TYPES.EXPENSE,
            amount: "",
            category: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
            familyMember: "",
            isRecurring: false,
        });
    };

    // Form handlers
    const handleTransactionTypeChange = (type) => {
        setNewTransaction(prev => ({
            ...prev,
            type,
            category: "", // Reset category when type changes
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTransaction(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // View handlers
    const handleViewChange = (view) => {
        setActiveView(view);
        if (view === 'planner') {
            fetchMonthlyPlan(selectedMonthPlan);
        }
    };

    const handleMonthChange = (month) => {
        setSelectedMonthPlan(month);
        if (activeView === 'planner') {
            fetchMonthlyPlan(month);
        }
    };

    // Error handlers
    const handleError = (error) => {
        setError(error.message || 'An error occurred');
        // Optionally show error in UI or toast notification
        setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    };

    // Loading indicator handler
    const renderLoading = () => {
        if (!loading) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Modified Header Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Wallet className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Finance Manager
                                </h1>
                                <p className="text-gray-500">Track your family expenses</p>
                            </div>
                        </div>

                        {/* Add Navigation Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveView("dashboard")}
                                className={`px-4 py-2 rounded-xl transition-all duration-200 ${activeView === "dashboard"
                                        ? "bg-blue-100 text-blue-600 font-medium"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setActiveView("planner")}
                                className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${activeView === "planner"
                                        ? "bg-blue-100 text-blue-600 font-medium"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <CalendarIcon className="w-4 h-4" />
                                Month Planner
                            </button>
                        </div>
                    </div>

                    {/* Add Month Selector when in planner view */}
                    {activeView === "planner" && (
                        <div className="mt-4 flex justify-end">
                            <input
                                type="month"
                                value={selectedMonthPlan}
                                onChange={(e) => setSelectedMonthPlan(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
                {activeView === "dashboard" ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Balance Card */}
                            <div
                                className="group bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                        hover:shadow-lg transition-all duration-300 cursor-pointer
                        relative overflow-hidden"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Balance
                                        </h3>
                                        <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
                                            <Wallet className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 mb-1">
                                        {formatCurrency(
                                            calculateTotal(TRANSACTION_TYPES.INCOME) -
                                            calculateTotal(TRANSACTION_TYPES.EXPENSE)
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">Current Balance</p>
                                </div>
                            </div>

                            {/* Income Card */}
                            <div
                                className="group bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                        hover:shadow-lg transition-all duration-300 cursor-pointer
                        relative overflow-hidden"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Income
                                        </h3>
                                        <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-green-500 mb-1">
                                        {formatCurrency(calculateTotal(TRANSACTION_TYPES.INCOME))}
                                    </p>
                                    <p className="text-sm text-gray-500">Total Income</p>
                                </div>
                            </div>

                            {/* Expense Card */}
                            <div
                                className="group bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                        hover:shadow-lg transition-all duration-300 cursor-pointer
                        relative overflow-hidden"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Expenses
                                        </h3>
                                        <div className="p-2 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors duration-300">
                                            <PieChartIcon className="w-5 h-5 text-red-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-red-500 mb-1">
                                        {formatCurrency(calculateTotal(TRANSACTION_TYPES.EXPENSE))}
                                    </p>
                                    <p className="text-sm text-gray-500">Total Expenses</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Category Distribution */}
                            <div
                                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                         hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Expense by Category
                                    </h3>
                                    <div className="p-2 bg-purple-100 rounded-xl">
                                        <PieChartIcon className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={prepareCategoryData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }) =>
                                                    `${name} (${(percent * 100).toFixed(0)}%)`
                                                }
                                            >
                                                {prepareCategoryData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        className="hover:opacity-80 transition-opacity duration-300"
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    borderRadius: "12px",
                                                    padding: "8px",
                                                    border: "1px solid #e5e7eb",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Timeline Chart */}
                            <div
                                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                         hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Income vs Expenses
                                    </h3>
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={prepareTimelineData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                stroke="#9ca3af"
                                            />
                                            <YAxis
                                                tickFormatter={(value) => formatCurrency(value)}
                                                stroke="#9ca3af"
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                labelFormatter={formatDate}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    borderRadius: "12px",
                                                    padding: "8px",
                                                    border: "1px solid #e5e7eb",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="income"
                                                stroke={chartColors.income}
                                                strokeWidth={2}
                                                dot={false}
                                                name="Income"
                                                activeDot={{ r: 6, fill: chartColors.income }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="expense"
                                                stroke={chartColors.expense}
                                                strokeWidth={2}
                                                dot={false}
                                                name="Expenses"
                                                activeDot={{ r: 6, fill: chartColors.expense }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Family Expenses */}
                            <div
                                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                         hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Family Summary
                                    </h3>
                                    <div className="p-2 bg-amber-100 rounded-xl">
                                        <Users className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareFamilyData} layout="vertical">
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f0f0f0"
                                                horizontal={false}
                                            />
                                            <XAxis
                                                type="number"
                                                tickFormatter={(value) => formatCurrency(value)}
                                            />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={100}
                                                tick={({ x, y, payload }) => (
                                                    <g transform={`translate(${x},${y})`}>
                                                        <text
                                                            x={-10}
                                                            y={0}
                                                            dy={4}
                                                            textAnchor="end"
                                                            fill="#666"
                                                        >
                                                            {payload.value}{" "}
                                                            {
                                                                familyMembers.find(
                                                                    (m) => m.name === payload.value
                                                                )?.icon
                                                            }
                                                        </text>
                                                    </g>
                                                )}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    borderRadius: "12px",
                                                    padding: "8px",
                                                    border: "1px solid #e5e7eb",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="expenses"
                                                name="Expenses"
                                                fill={chartColors.expense}
                                                radius={[0, 4, 4, 0]}
                                            />
                                            <Bar
                                                dataKey="income"
                                                name="Income"
                                                fill={chartColors.income}
                                                radius={[0, 4, 4, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            {/* Daily Average Spending */}
                            <div
                                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100
                       hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Daily Patterns
                                    </h3>
                                    <div className="p-2 bg-indigo-100 rounded-xl">
                                        <Calendar className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepareDailyAverages}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="day" stroke="#9ca3af" />
                                            <YAxis
                                                tickFormatter={(value) => formatCurrency(value)}
                                                stroke="#9ca3af"
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    borderRadius: "12px",
                                                    padding: "8px",
                                                    border: "1px solid #e5e7eb",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="average"
                                                name="Average Spending"
                                                fill={chartColors.primary}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Add Transaction Modal */}
                        {showAddModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <h2 className="text-xl font-semibold mb-6">
                                        Add Transaction
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Transaction Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Type
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 
                              transition-all duration-200 ${newTransaction.type ===
                                                            TRANSACTION_TYPES.EXPENSE
                                                            ? "bg-red-100 text-red-600 border-2 border-red-200"
                                                            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                                                        }`}
                                                    onClick={() =>
                                                        setNewTransaction((prev) => ({
                                                            ...prev,
                                                            type: TRANSACTION_TYPES.EXPENSE,
                                                            category: "",
                                                        }))
                                                    }
                                                >
                                                    <PieChartIcon className="w-4 h-4" />
                                                    Expense
                                                </button>
                                                <button
                                                    className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 
                              transition-all duration-200 ${newTransaction.type === TRANSACTION_TYPES.INCOME
                                                            ? "bg-green-100 text-green-600 border-2 border-green-200"
                                                            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                                                        }`}
                                                    onClick={() =>
                                                        setNewTransaction((prev) => ({
                                                            ...prev,
                                                            type: TRANSACTION_TYPES.INCOME,
                                                            category: "",
                                                        }))
                                                    }
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                    Income
                                                </button>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Amount
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200"
                                                    value={newTransaction.amount}
                                                    onChange={(e) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            amount: e.target.value,
                                                        })
                                                    }
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Category
                                            </label>
                                            <select
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                                                value={newTransaction.category}
                                                onChange={(e) =>
                                                    setNewTransaction({
                                                        ...newTransaction,
                                                        category: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">Select category</option>
                                                {Object.entries(
                                                    newTransaction.type === TRANSACTION_TYPES.INCOME
                                                        ? incomeCategories
                                                        : categories
                                                ).map(([name, cat]) => (
                                                    <option key={name} value={name}>
                                                        {cat.icon} {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Family Member */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Family Member
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {familyMembers.map((member) => (
                                                    <button
                                                        key={member.id}
                                                        className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 
                                transition-all duration-200 ${newTransaction.familyMember === member.name
                                                                ? "bg-blue-100 text-blue-600 border-2 border-blue-200"
                                                                : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                                                            }`}
                                                        onClick={() =>
                                                            setNewTransaction((prev) => ({
                                                                ...prev,
                                                                familyMember: member.name,
                                                            }))
                                                        }
                                                    >
                                                        <span>{member.icon}</span>
                                                        <span>{member.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                                                value={newTransaction.description}
                                                onChange={(e) =>
                                                    setNewTransaction({
                                                        ...newTransaction,
                                                        description: e.target.value,
                                                    })
                                                }
                                                placeholder="Add a description"
                                            />
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                                                value={newTransaction.date}
                                                onChange={(e) =>
                                                    setNewTransaction({
                                                        ...newTransaction,
                                                        date: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-4 mt-6">
                                            <button
                                                className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-xl
                           hover:bg-blue-600 transition-colors duration-200
                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                onClick={handleAddTransaction}
                                            >
                                                Add Transaction
                                            </button>
                                            <button
                                                className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl
                           hover:bg-gray-200 transition-colors duration-200"
                                                onClick={() => setShowAddModal(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transaction List Section */}
                        {/* Transaction List Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <div className="flex flex-col gap-4 mb-6">
                                {/* Header and Filters */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Transaction History
                                    </h3>

                                    {/* Transaction Type Filter */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTransactionFilter("all")}
                                            className={`px-4 py-2 rounded-xl transition-all duration-200 ${transactionFilter === "all"
                                                    ? "bg-blue-100 text-blue-600 font-medium"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setTransactionFilter("expense")}
                                            className={`px-4 py-2 rounded-xl transition-all duration-200 ${transactionFilter === "expense"
                                                    ? "bg-red-100 text-red-600 font-medium"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            Expenses
                                        </button>
                                        <button
                                            onClick={() => setTransactionFilter("income")}
                                            className={`px-4 py-2 rounded-xl transition-all duration-200 ${transactionFilter === "income"
                                                    ? "bg-green-100 text-green-600 font-medium"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            Income
                                        </button>
                                    </div>
                                </div>

                                {/* Search and Group Controls */}
                                <div className="flex flex-wrap gap-4">
                                    {/* Search Bar */}
                                    <div className="flex-1 min-w-[300px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by amount, category, or description..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Grouping Options */}
                                    <select
                                        value={groupingOption}
                                        onChange={(e) => setGroupingOption(e.target.value)}
                                        className="px-4 py-2 rounded-xl border border-gray-200 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
                                    >
                                        <option value="none">No Grouping</option>
                                        <option value="category">Group by Category</option>
                                        <option value="date">Group by Date</option>
                                        <option value="family">Group by Family Member</option>
                                    </select>
                                </div>
                            </div>

                            {/* Transaction List */}
                            <div className="space-y-6">
                                {groupedTransactions.map((group) => (
                                    <div key={group.title} className="space-y-2">
                                        {/* Group Header */}
                                        {groupingOption !== "none" && (
                                            <div className="flex items-center justify-between py-2">
                                                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                                    {group.icon && <span>{group.icon}</span>}
                                                    {group.title}
                                                </h4>
                                                <span className="text-sm text-gray-500">
                                                    {formatCurrency(group.total)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Group Transactions */}
                                        <div className="divide-y divide-gray-100">
                                            {group.transactions.map((transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="py-4 group hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            {/* Category Icon */}
                                                            <div
                                                                className={`p-3 rounded-xl ${transaction.type === TRANSACTION_TYPES.INCOME
                                                                        ? "bg-green-100"
                                                                        : "bg-red-100"
                                                                    }`}
                                                            >
                                                                {transaction.type === TRANSACTION_TYPES.INCOME
                                                                    ? incomeCategories[transaction.category]?.icon
                                                                    : categories[transaction.category]?.icon}
                                                            </div>

                                                            {/* Transaction Details */}
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">
                                                                    {transaction.category}
                                                                </h4>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <span>{formatDate(transaction.date)}</span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        {
                                                                            familyMembers.find(
                                                                                (m) =>
                                                                                    m.name === transaction.familyMember
                                                                            )?.icon
                                                                        }
                                                                        {transaction.familyMember}
                                                                    </span>
                                                                </div>
                                                                {transaction.description && (
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {transaction.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <span
                                                                className={`font-medium ${transaction.type === TRANSACTION_TYPES.INCOME
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                    }`}
                                                            >
                                                                {transaction.type === TRANSACTION_TYPES.INCOME
                                                                    ? "+"
                                                                    : "-"}
                                                                {formatCurrency(transaction.amount)}
                                                            </span>

                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditTransaction(transaction)
                                                                    }
                                                                    className="p-2 hover:bg-gray-200 rounded-full"
                                                                >
                                                                    <Pencil className="w-4 h-4 text-gray-600" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteTransaction(transaction.id)
                                                                    }
                                                                    className="p-2 hover:bg-red-100 rounded-full"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                    {Math.min(
                                        currentPage * itemsPerPage,
                                        filteredTransactions.length
                                    )}{" "}
                                    of {filteredTransactions.length} transactions
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) => Math.max(1, prev - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-xl transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                        (page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-4 py-2 rounded-xl transition-all duration-200 ${currentPage === page
                                                        ? "bg-blue-100 text-blue-600 font-medium"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-xl transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <MonthPlanner
                        selectedMonth={selectedMonthPlan}
                        actualTransactions={monthTransactions}
                        onSavePlan={handleSavePlan}
                    />
                )}

                {/* Floating Action Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 
                   hover:bg-blue-600 text-white shadow-lg flex items-center 
                   justify-center transition-all duration-200 hover:scale-110"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default FinanceManager;

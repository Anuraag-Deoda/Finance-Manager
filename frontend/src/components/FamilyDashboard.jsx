/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    getFamilyMembers,
    inviteFamilyMember,
    removeFamilyMember
} from '../redux/authSlice';
import api from '../services/api';
import {
    Users, AlertTriangle, TrendingUp, PieChart,
    UserPlus, Trash2, Mail
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const FamilyDashboard = () => {
    // Redux
    const dispatch = useDispatch();
    const { family, user } = useSelector(state => state.auth);

    // State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [familyStats, setFamilyStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        memberContributions: {},
        categoryBreakdown: {}
    });
    const [dateRange, setDateRange] = useState('month'); // month, quarter, year

    // Initial data loading
    useEffect(() => {
        const loadFamilyData = async () => {
            setLoading(true);
            try {
                await dispatch(getFamilyMembers()).unwrap();
                await fetchFamilyTransactions();
            } catch (err) {
                setError('Failed to load family data');
            } finally {
                setLoading(false);
            }
        };

        if (family.id) {
            loadFamilyData();
        }
    }, [family.id, dispatch]);

    // Fetch family transactions
    const fetchFamilyTransactions = async () => {
        try {
            const response = await api.get('/family/transactions', {
                params: { dateRange }
            });
            setTransactions(response.data);
            calculateFamilyStats(response.data);
        } catch (err) {
            setError('Failed to fetch family transactions');
        }
    };

    // Calculate family statistics
    const calculateFamilyStats = (transactionData) => {
        const stats = {
            totalIncome: 0,
            totalExpenses: 0,
            memberContributions: {},
            categoryBreakdown: {}
        };

        transactionData.forEach(transaction => {
            const amount = parseFloat(transaction.amount);

            // Update totals
            if (transaction.type === 'income') {
                stats.totalIncome += amount;
            } else {
                stats.totalExpenses += amount;
            }

            // Update member contributions
            if (!stats.memberContributions[transaction.familyMember]) {
                stats.memberContributions[transaction.familyMember] = {
                    income: 0,
                    expenses: 0
                };
            }
            stats.memberContributions[transaction.familyMember][transaction.type] += amount;

            // Update category breakdown
            if (transaction.type === 'expense') {
                if (!stats.categoryBreakdown[transaction.category]) {
                    stats.categoryBreakdown[transaction.category] = 0;
                }
                stats.categoryBreakdown[transaction.category] += amount;
            }
        });

        setFamilyStats(stats);
    };

    // Handle date range change
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        fetchFamilyTransactions();
    };

    // Handle member invite
    const handleInviteMember = async () => {
        if (!inviteEmail) return;

        try {
            await dispatch(inviteFamilyMember(inviteEmail)).unwrap();
            setInviteEmail('');
            setShowInviteModal(false);
        } catch (err) {
            setError('Failed to send invitation');
        }
    };

    // Handle member removal
    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this family member?')) {
            return;
        }

        try {
            await dispatch(removeFamilyMember(memberId)).unwrap();
        } catch (err) {
            setError('Failed to remove family member');
        }
    };

    // Memoized data for charts
    const chartData = useMemo(() => {
        // Member contributions chart data
        const memberData = Object.entries(familyStats.memberContributions).map(([member, data]) => ({
            name: member,
            income: data.income,
            expenses: data.expenses,
            balance: data.income - data.expenses
        }));

        // Category breakdown chart data
        const categoryData = Object.entries(familyStats.categoryBreakdown).map(([category, amount]) => ({
            name: category,
            value: amount
        }));

        // Timeline data
        const timelineData = transactions.reduce((acc, transaction) => {
            const date = transaction.date;
            if (!acc[date]) {
                acc[date] = { date, income: 0, expenses: 0 };
            }
            if (transaction.type === 'income') {
                acc[date].income += parseFloat(transaction.amount);
            } else {
                acc[date].expenses += parseFloat(transaction.amount);
            }
            return acc;
        }, {});

        return {
            memberData,
            categoryData,
            timelineData: Object.values(timelineData).sort((a, b) => new Date(a.date) - new Date(b.date))
        };
    }, [familyStats, transactions]);

    // Format currency helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate member stats
    const getMemberStats = (memberId) => {
        const memberTransactions = transactions.filter(t => t.userId === memberId);
        return {
            totalIncome: memberTransactions.reduce((sum, t) =>
                t.type === 'income' ? sum + parseFloat(t.amount) : sum, 0
            ),
            totalExpenses: memberTransactions.reduce((sum, t) =>
                t.type === 'expense' ? sum + parseFloat(t.amount) : sum, 0
            ),
            transactions: memberTransactions
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Family Finance</h1>
                                <p className="text-gray-500">Manage your familys finances together</p>
                            </div>
                        </div>
                        {family.isAdmin && (
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                Invite Member
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Family Income</h3>
                            <div className="p-2 bg-green-100 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(familyStats.totalIncome)}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Family Expenses</h3>
                            <div className="p-2 bg-red-100 rounded-xl">
                                <PieChart className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(familyStats.totalExpenses)}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Net Balance</h3>
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{formatCurrency(familyStats.totalIncome - familyStats.totalExpenses)}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Member Contributions</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.memberData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={formatCurrency} />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip formatter={formatCurrency} />
                                    <Legend />
                                    <Bar dataKey="income" name="Income" fill="#22C55E" />
                                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Income vs Expenses</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.timelineData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={formatCurrency} />
                                    <Tooltip formatter={formatCurrency} />
                                    <Legend />
                                    <Line type="monotone" dataKey="income" name="Income" stroke="#22C55E" />
                                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Family Members</h3>
                    <div className="divide-y divide-gray-100">
                        {family.members.map((member) => (
                            <div key={member.id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-xl">
                                        <Users className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                                        <p className="text-sm text-gray-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-900">
                                        {formatCurrency(getMemberStats(member.id).totalIncome - getMemberStats(member.id).totalExpenses)}
                                    </span>
                                    {family.isAdmin && member.id !== user.id && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 hover:bg-red-100 rounded-xl transition-colors duration-200"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Invite Family Member</h3>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full px-4 py-2 border rounded-xl mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleInviteMember}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                >
                                    Send Invite
                                </button>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="fixed bottom-4 right-4 bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );

};

export default FamilyDashboard;
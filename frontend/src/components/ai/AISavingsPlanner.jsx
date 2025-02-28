import React, { useState, useEffect } from 'react';
import { Target, Calendar, DollarSign, Calculator } from 'lucide-react';
import api from '../../services/api';

const AISavingsPlanner = ({ income, expenses }) => {
    const [goal, setGoal] = useState({
        name: '',
        amount: '',
        targetDate: ''
    });
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generatePlan = async () => {
        if (!goal.name || !goal.amount || !goal.targetDate) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/ai/savings-plan', {
                goal: {
                    name: goal.name,
                    amount: parseFloat(goal.amount),
                    targetDate: goal.targetDate
                },
                income,
                expenses
            });
            setPlan(response.data.plan);
        } catch (err) {
            console.error('Error generating savings plan:', err);
            setError('Failed to generate savings plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">AI Savings Planner</h3>
                <div className="p-2 bg-green-100 rounded-xl">
                    <Target className="w-5 h-5 text-green-600" />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="mb-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Savings Goal Name
                        </label>
                        <input
                            type="text"
                            value={goal.name}
                            onChange={(e) => setGoal({ ...goal, name: e.target.value })}
                            placeholder="e.g., New Laptop, Vacation, Emergency Fund"
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Amount
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="number"
                                value={goal.amount}
                                onChange={(e) => setGoal({ ...goal, amount: e.target.value })}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="date"
                                value={goal.targetDate}
                                onChange={(e) => setGoal({ ...goal, targetDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <button
                        onClick={generatePlan}
                        disabled={loading}
                        className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:bg-green-300"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Generating Plan...
                            </>
                        ) : (
                            <>
                                <Calculator className="w-5 h-5" />
                                Generate Savings Plan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {plan && (
                <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-medium text-gray-800 mb-2">Your Savings Plan</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-white rounded-lg">
                            <div className="text-sm text-gray-500">Monthly Savings</div>
                            <div className="text-xl font-bold text-green-600">{plan.monthlySavings}</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                            <div className="text-sm text-gray-500">Total Months</div>
                            <div className="text-xl font-bold text-gray-800">{plan.totalMonths}</div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Recommendations</h5>
                        <ul className="space-y-2">
                            {plan.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <div className="min-w-[6px] h-[6px] mt-[6px] rounded-full bg-green-500" />
                                    <span className="text-gray-700">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AISavingsPlanner;
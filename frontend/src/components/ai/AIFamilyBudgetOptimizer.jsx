import React, { useState } from 'react';
import { Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';

const AIFamilyBudgetOptimizer = ({ familyMembers, currentAllocations, totalBudget, onApplyOptimization }) => {
    const [optimizedBudget, setOptimizedBudget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const optimizeBudget = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/ai/family/optimize-budget', {
                familyMembers,
                currentAllocations,
                totalBudget
            });
            setOptimizedBudget(response.data.optimizedBudget);
        } catch (err) {
            console.error('Error optimizing family budget:', err);
            setError('Failed to optimize family budget');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-purple-600">Optimizing family budget...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 rounded-xl p-4">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Family Budget Optimizer</h3>
                <div className="p-2 bg-purple-100 rounded-xl">
                    <Users className="w-5 h-5 text-purple-600" />
                </div>
            </div>
            
            {!optimizedBudget ? (
                <div className="text-center p-6">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Optimize Your Family Budget</h4>
                    <p className="text-gray-500 mb-4">AI will analyze spending patterns and suggest a fair budget allocation for all family members</p>
                    <button
                        onClick={optimizeBudget}
                        className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200"
                    >
                        Optimize Budget with AI
                    </button>
                </div>
            ) : (
                <div>
                    <div className="p-4 bg-purple-50 rounded-xl mb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-medium text-gray-800">AI Suggested Budget</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {optimizedBudget.summary}
                                </p>
                            </div>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="p-2 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                            >
                                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                        </div>
                        
                        {expanded && (
                            <div className="mt-4 space-y-3">
                                {optimizedBudget.allocations.map((allocation, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                                style={{ backgroundColor: allocation.color + '33' }}
                                            >
                                                {allocation.icon}
                                            </div>
                                            <div>
                                                <div className="font-medium">{allocation.name}</div>
                                                <div className="text-xs text-gray-500">{allocation.role}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-right">{allocation.amount}</div>
                                            <div className="text-xs text-gray-500 text-right">{allocation.percentage}% of budget</div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="pt-3 border-t border-gray-200">
                                    <h5 className="font-medium text-gray-700 mb-2">Optimization Reasoning</h5>
                                    <ul className="space-y-1">
                                        {optimizedBudget.reasoning.map((reason, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <div className="min-w-[6px] h-[6px] mt-[6px] rounded-full bg-purple-500" />
                                                <span className="text-gray-700">{reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => onApplyOptimization(optimizedBudget.allocations)}
                        className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200"
                    >
                        Apply Optimized Budget
                    </button>
                </div>
            )}
        </div>
    );
};

export default AIFamilyBudgetOptimizer;
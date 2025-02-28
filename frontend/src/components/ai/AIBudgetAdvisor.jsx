import React, { useState, useEffect } from 'react';
import { BrainCircuit, ArrowRight, Check, Loading } from 'lucide-react';
import api from '../../services/api';

const AIBudgetAdvisor = ({ currentBudget, monthlyIncome, onApplyRecommendation }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (monthlyIncome > 0 && currentBudget) {
            fetchRecommendations();
        }
    }, [currentBudget, monthlyIncome]);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/ai/budget/recommendations', {
                currentBudget,
                monthlyIncome
            });
            setRecommendations(response.data.recommendations);
        } catch (err) {
            console.error('Error fetching budget recommendations:', err);
            setError('Failed to load AI budget recommendations');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-600">Analyzing your budget...</span>
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

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                    <BrainCircuit className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-gray-800">AI Budget Recommendation</h3>
                    <p className="text-gray-600 text-sm mt-1">
                        {recommendations[0]?.summary || "I've analyzed your finances and have some budget suggestions."}
                    </p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200"
                        >
                            {showDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                        
                        <button
                            onClick={() => onApplyRecommendation(recommendations[0]?.budget)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            Apply Recommendation
                        </button>
                    </div>

                    {showDetails && (
                        <div className="mt-4 space-y-3">
                            <h4 className="font-medium text-gray-700">Suggested Changes:</h4>
                            {recommendations[0]?.changes.map((change, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${change.direction === 'increase' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-gray-700">{change.category}:</span>
                                    <span className={change.direction === 'increase' ? 'text-green-600' : 'text-red-600'}>
                                        {change.direction === 'increase' ? '+' : '-'}{change.amount}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-700">{change.reason}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIBudgetAdvisor;
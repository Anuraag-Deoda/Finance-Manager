import React, { useState, useEffect, useMemo } from "react";
import { Users, Sparkles, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const AIInsightsPanel = ({ transactions }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (transactions.length > 0) {
            fetchInsights();
        }
    }, [transactions]);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/ai/insights', { transactions });
            setInsights(response.data.insights);
        } catch (err) {
            console.error('Error fetching AI insights:', err);
            setError('Failed to load AI insights');
        } finally {
            setLoading(false);
        }
    };

    const renderInsightIcon = (type) => {
        switch (type) {
            case 'trend':
                return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 'alert':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'tip':
                return <Lightbulb className="w-5 h-5 text-amber-500" />;
            case 'positive':
                return <ArrowUpRight className="w-5 h-5 text-green-500" />;
            case 'negative':
                return <ArrowDownRight className="w-5 h-5 text-red-500" />;
            default:
                return <Lightbulb className="w-5 h-5 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                    <div className="h-24 bg-gray-100 rounded-xl"></div>
                    <div className="h-24 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Insights</h3>
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Insights</h3>
            
            {insights.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    <Lightbulb className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Not enough transaction data to generate insights</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {insights.map((insight, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white">
                                    {renderInsightIcon(insight.type)}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">{insight.title}</h4>
                                    <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                                    
                                    {insight.action && (
                                        <button 
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => insight.actionHandler && insight.actionHandler()}
                                        >
                                            {insight.action}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIInsightsPanel;

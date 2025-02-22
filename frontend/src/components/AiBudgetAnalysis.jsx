/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lightbulb, TrendingUp, PieChart, RefreshCcw, MessageSquare } from 'lucide-react';
import api from '../services/api';

const AiBudgetAnalysis = ({ transactions, monthlyPlan }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chatQuestion, setChatQuestion] = useState('');
    const [chatResponse, setChatResponse] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);

    // Insight type configurations
    const insightTypes = {
        spending: {
            icon: <PieChart className="w-5 h-5" />,
            color: 'text-blue-600',
            bgLight: 'bg-blue-50',
            bgDark: 'bg-blue-100'
        },
        savings: {
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-green-600',
            bgLight: 'bg-green-50',
            bgDark: 'bg-green-100'
        },
        alert: {
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'text-red-600',
            bgLight: 'bg-red-50',
            bgDark: 'bg-red-100'
        },
        suggestion: {
            icon: <Lightbulb className="w-5 h-5" />,
            color: 'text-amber-600',
            bgLight: 'bg-amber-50',
            bgDark: 'bg-amber-100'
        }
    };

    // Fetch insights when transactions change
    useEffect(() => {
        if (transactions.length > 0) {
            fetchInsights();
        }
    }, [transactions]);

    // Fetch AI insights
    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/ai/analyze', {
                transactions,
                monthlyPlan
            });
            setInsights(response.data.insights);
        } catch (err) {
            setError('Failed to fetch AI insights. Please try again later.');
            console.error('AI Analysis Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle chat with AI
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatQuestion.trim()) return;

        setChatLoading(true);
        try {
            const response = await api.post('/ai/chat', {
                question: chatQuestion,
                context: {
                    transactions,
                    monthlyPlan,
                    insights
                }
            });
            setChatResponse(response.data.response);
            setChatQuestion('');
        } catch (err) {
            setError('Failed to get AI response. Please try again.');
            console.error('AI Chat Error:', err);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">AI Budget Analysis</h3>
                <button
                    onClick={fetchInsights}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    disabled={loading}
                >
                    <RefreshCcw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-3 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Insights Grid */}
            <div className="grid grid-cols-1 gap-4 mb-6">
                {insights.map((insight, index) => {
                    const type = insightTypes[insight.type];
                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-xl ${type.bgLight} transition-all duration-200`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${type.bgDark}`}>
                                    {type.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-medium ${type.color}`}>
                                        {insight.title}
                                    </h4>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {insight.summary}
                                    </p>

                                    {/* Detailed Analysis */}
                                    <div className="mt-4 space-y-2">
                                        {insight.details?.map((detail, i) => (
                                            <div key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                <span className="min-w-[6px] h-[6px] mt-[6px] rounded-full bg-gray-400" />
                                                <span>{detail}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recommendation */}
                                    {insight.recommendation && (
                                        <div className="mt-4 p-3 bg-white rounded-lg border border-amber-100">
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <Lightbulb className="w-4 h-4" />
                                                <span className="font-medium">Recommendation</span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">
                                                {insight.recommendation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* AI Chat Interface */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Ask AI Assistant</h4>
                </div>

                {/* Chat Response */}
                {chatResponse && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                        <p className="text-gray-700 text-sm">{chatResponse}</p>
                    </div>
                )}

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        placeholder="Ask about your spending, savings goals, or get specific advice..."
                        className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                        disabled={chatLoading}
                    />
                    <button
                        type="submit"
                        disabled={chatLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300"
                    >
                        {chatLoading ? 'Processing...' : 'Ask AI'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiBudgetAnalysis;
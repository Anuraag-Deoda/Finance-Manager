/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  PieChart, 
  RefreshCw, 
  MessageSquare, 
  Users, 
  Target, 
  ArrowRight, 
  Send, 
  BrainCircuit,
  Sparkles,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader
} from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const AiBudgetAnalysis = ({ 
  transactions, 
  monthlyIncome, 
  monthlyExpenses, 
  categories, 
  onApplyRecommendation 
}) => {
  // States for different AI features
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your finance AI assistant. Ask me anything about your finances or budget!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState({ name: '', amount: '', targetDate: '' });
  const [savingsPlan, setSavingsPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('insights'); // insights, advisor, planner
  const [expandedSection, setExpandedSection] = useState(null);
  
  const chatEndRef = useRef(null);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current && showChat) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);
  
  // Fetch insights when transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      fetchInsights();
    }
  }, [transactions]);
  
  // Fetch budget recommendations when income or expenses change
  useEffect(() => {
    if (monthlyIncome > 0) {
      fetchBudgetRecommendations();
    }
  }, [monthlyIncome, monthlyExpenses]);
  
  // Fetch AI insights
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await api.ai.getInsights(transactions);
      if (response.data && response.data.insights) {
        setInsights(response.data.insights);
      } else {
        setInsights([
          {
            type: 'tip',
            title: 'Start tracking your expenses',
            description: 'Add more transactions to get personalized insights about your spending habits.'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setInsights([
        {
          type: 'alert',
          title: 'Could not analyze your transactions',
          description: 'We encountered an error while analyzing your transactions. Please try again later.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch budget recommendations
  const fetchBudgetRecommendations = async () => {
    try {
      const currentBudget = categories.reduce((acc, category) => {
        acc[category.name] = category.budget || 0;
        return acc;
      }, {});
      
      const response = await api.ai.getBudgetRecommendations(currentBudget, monthlyIncome);
      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching budget recommendations:', error);
    }
  };
  
  // Send message to AI chat
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await api.ai.chat(chatInput);
      if (response.data && response.data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't process your request. Please try again." 
        }]);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again later." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };
  
  // Generate savings plan
  const generateSavingsPlan = async () => {
    if (!savingsGoal.name || !savingsGoal.amount || !savingsGoal.targetDate) {
      toast.error('Please fill in all fields for your savings goal');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.ai.getSavingsPlan({
        goal: savingsGoal.name,
        amount: parseFloat(savingsGoal.amount),
        targetDate: savingsGoal.targetDate
      });
      
      if (response.data && response.data.plan) {
        setSavingsPlan(response.data.plan);
        toast.success('Savings plan generated successfully!');
      }
    } catch (error) {
      console.error('Error generating savings plan:', error);
      toast.error('Failed to generate savings plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply a budget recommendation
  const applyRecommendation = (recommendation) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(recommendation);
      toast.success('Budget recommendation applied!');
    }
  };
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Render insight icon based on type
  const renderInsightIcon = (type) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };
  
  // Loading state
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
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'insights'
              ? 'bg-blue-100 text-blue-600 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          AI Insights
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`px-4 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'advisor'
              ? 'bg-blue-100 text-blue-600 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Budget Advisor
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'planner'
              ? 'bg-blue-100 text-blue-600 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Target className="w-4 h-4" />
          Savings Planner
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'insights' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
              <button 
                onClick={fetchInsights}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
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
            
            {/* AI Chat */}
            <div className="mt-6">
              <button
                onClick={() => setShowChat(!showChat)}
                className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                {showChat ? 'Hide AI Chat' : 'Ask AI About Your Finances'}
              </button>
              
              {showChat && (
                <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="h-64 overflow-y-auto p-4 bg-gray-50">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`mb-3 ${
                          msg.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div 
                          className={`inline-block p-3 rounded-xl ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your finances..."
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      disabled={chatLoading}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={chatLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      {chatLoading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'advisor' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">AI Budget Advisor</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Monthly Income: ${monthlyIncome}</span>
                <button 
                  onClick={fetchBudgetRecommendations}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  disabled={loading}
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {recommendations.length === 0 ? (
              <div className="text-center p-6 text-gray-500">
                <BrainCircuit className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p>No budget recommendations available yet</p>
                <p className="text-sm mt-2">Add more transactions or update your income to get personalized recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{rec.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{rec.description}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-500">Current: ${rec.currentAmount}</span>
                            <span className="mx-2">→</span>
                            <span className="text-sm font-medium text-green-600">Recommended: ${rec.recommendedAmount}</span>
                          </div>
                          
                          <button 
                            onClick={() => applyRecommendation(rec)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                          >
                            Apply
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Family Budget Optimization */}
            <div className="mt-6">
              <button
                onClick={() => toggleSection('familyBudget')}
                className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Family Budget Optimization</span>
                </div>
                {expandedSection === 'familyBudget' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {expandedSection === 'familyBudget' && (
                <div className="mt-4 p-4 border border-gray-200 rounded-xl">
                  <p className="text-gray-600 mb-4">
                    Our AI can help optimize your family budget to ensure fair distribution of expenses among family members.
                  </p>
                  
                  <button
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Optimize Family Budget
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'planner' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Savings Planner</h3>
            
            <div className="p-4 bg-gray-50 rounded-xl mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Set Your Savings Goal</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={savingsGoal.name}
                    onChange={(e) => setSavingsGoal({ ...savingsGoal, name: e.target.value })}
                    placeholder="e.g., New Laptop, Vacation, Emergency Fund"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={savingsGoal.amount}
                      onChange={(e) => setSavingsGoal({ ...savingsGoal, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={savingsGoal.targetDate}
                    onChange={(e) => setSavingsGoal({ ...savingsGoal, targetDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={generateSavingsPlan}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      Generate Savings Plan
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {savingsPlan && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Your AI-Generated Savings Plan
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Monthly Savings Target</span>
                    </div>
                    <span className="text-lg font-semibold text-green-600">${savingsPlan.monthlySavingsTarget}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Time to Goal</span>
                    </div>
                    <span className="font-medium">{savingsPlan.timeToGoal}</span>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg">
                    <h5 className="font-medium mb-2">Recommendations</h5>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {savingsPlan.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiBudgetAnalysis;
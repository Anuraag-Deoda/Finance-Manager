import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const AIChatComponent = () => {
    const { family } = useSelector(state => state.auth);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m your finance AI assistant. Ask me anything about your finances!' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await api.post('/ai/chat', {
                message: inputValue,
                messageHistory: messages.slice(-10), // Send last 10 messages for context
                familyId: family.id,
                familyMembers: family.members
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
        } catch (err) {
            console.error('Error getting AI response:', err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error. Please try again later.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating chat button */}
            <button
                onClick={() => setShowChat(!showChat)}
                className={`fixed bottom-6 right-6 z-40 p-4 rounded-full transition-all duration-300 ${
                    showChat ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white shadow-lg flex items-center justify-center`}
            >
                {showChat ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Chat window */}
            {showChat && (
                <div className="fixed bottom-20 right-6 w-80 md:w-96 h-96 bg-white rounded-xl shadow-xl z-30 flex flex-col border border-gray-200 overflow-hidden">
                    {/* Chat header */}
                    <div className="p-4 bg-blue-500 text-white flex items-center">
                        <Bot className="mr-2" size={20} />
                        <h3 className="font-semibold">Finance AI Assistant</h3>
                    </div>

                    {/* Chat messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`mb-3 ${
                                    msg.role === 'user' ? 'ml-auto' : 'mr-auto'
                                } max-w-[80%]`}
                            >
                                <div className={`p-3 rounded-lg ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-500 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center space-x-2 text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat input */}
                    <div className="p-3 border-t border-gray-200 bg-white">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask about your finances..."
                                className="flex-1 px-4 py-2 border rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-r-xl hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatComponent;
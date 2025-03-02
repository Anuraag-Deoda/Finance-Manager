import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunks
export const fetchAINotifications = createAsyncThunk(
    'ai/fetchNotifications',
    async () => {
        const response = await api.ai.getNotifications();
        return response.data.notifications;
    }
);

export const markNotificationRead = createAsyncThunk(
    'ai/markNotificationRead',
    async (notificationId) => {
        await api.ai.markNotificationRead(notificationId);
        return notificationId;
    }
);

export const getAIInsights = createAsyncThunk(
    'ai/getInsights',
    async (transactions) => {
        const response = await api.ai.getInsights(transactions);
        return response.data.insights;
    }
);

export const getBudgetRecommendations = createAsyncThunk(
    'ai/getBudgetRecommendations',
    async ({ currentBudget, monthlyIncome }) => {
        const response = await api.ai.getBudgetRecommendations(currentBudget, monthlyIncome);
        return response.data.recommendations;
    }
);

export const generateAIReport = createAsyncThunk(
    'ai/generateReport',
    async ({ startDate, endDate }) => {
        const response = await api.ai.generateReport(startDate, endDate);
        return response.data.report;
    }
);

const initialState = {
    notifications: {
        items: [],
        unreadCount: 0,
        loading: false,
        error: null
    },
    insights: {
        data: null,
        loading: false,
        error: null
    },
    budgetRecommendations: {
        data: null,
        loading: false,
        error: null
    },
    report: {
        data: null,
        loading: false,
        error: null
    },
    chatHistory: []
};

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        addChatMessage: (state, action) => {
            state.chatHistory.push(action.payload);
        },
        clearChatHistory: (state) => {
            state.chatHistory = [];
        }
    },
    extraReducers: (builder) => {
        // Notifications
        builder
            .addCase(fetchAINotifications.pending, (state) => {
                state.notifications.loading = true;
                state.notifications.error = null;
            })
            .addCase(fetchAINotifications.fulfilled, (state, action) => {
                state.notifications.loading = false;
                state.notifications.items = action.payload;
                state.notifications.unreadCount = action.payload.filter(n => !n.read).length;
            })
            .addCase(fetchAINotifications.rejected, (state, action) => {
                state.notifications.loading = false;
                state.notifications.error = action.error.message;
            })
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const notification = state.notifications.items.find(n => n.id === action.payload);
                if (notification && !notification.read) {
                    notification.read = true;
                    state.notifications.unreadCount--;
                }
            })
            
            // Insights
            .addCase(getAIInsights.pending, (state) => {
                state.insights.loading = true;
                state.insights.error = null;
            })
            .addCase(getAIInsights.fulfilled, (state, action) => {
                state.insights.loading = false;
                state.insights.data = action.payload;
            })
            .addCase(getAIInsights.rejected, (state, action) => {
                state.insights.loading = false;
                state.insights.error = action.error.message;
            })
            
            // Budget Recommendations
            .addCase(getBudgetRecommendations.pending, (state) => {
                state.budgetRecommendations.loading = true;
                state.budgetRecommendations.error = null;
            })
            .addCase(getBudgetRecommendations.fulfilled, (state, action) => {
                state.budgetRecommendations.loading = false;
                state.budgetRecommendations.data = action.payload;
            })
            .addCase(getBudgetRecommendations.rejected, (state, action) => {
                state.budgetRecommendations.loading = false;
                state.budgetRecommendations.error = action.error.message;
            })
            
            // AI Report
            .addCase(generateAIReport.pending, (state) => {
                state.report.loading = true;
                state.report.error = null;
            })
            .addCase(generateAIReport.fulfilled, (state, action) => {
                state.report.loading = false;
                state.report.data = action.payload;
            })
            .addCase(generateAIReport.rejected, (state, action) => {
                state.report.loading = false;
                state.report.error = action.error.message;
            });
    }
});

export const { addChatMessage, clearChatHistory } = aiSlice.actions;

export default aiSlice.reducer; 
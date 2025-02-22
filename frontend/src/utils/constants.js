// src/utils/constants.js

export const categories = {
    EMI: {
      primary: '#FF6B6B',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8787 100%)',
      hover: '#FF8787',
      icon: '💰',
      description: 'Loan payments and EMIs',
      suggestedLimit: 0.3 // 30% of income
    },
    Hospital: {
      primary: '#FF4757',
      gradient: 'linear-gradient(135deg, #FF4757 0%, #FF6B81 100%)',
      hover: '#FF6B81',
      icon: '🏥',
      description: 'Medical expenses and healthcare',
      suggestedLimit: 0.1
    },
    'Emergency Fund and Targets': {
      primary: '#FFA502',
      gradient: 'linear-gradient(135deg, #FFA502 0%, #FFBE76 100%)',
      hover: '#FFBE76',
      icon: '🚨',
      description: 'Emergency savings and unexpected expenses',
      suggestedLimit: 0.1
    },
    Rent: {
      primary: '#4ECDC4',
      gradient: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7E7 100%)',
      hover: '#6EE7E7',
      icon: '🏠',
      description: 'Housing and rent expenses',
      suggestedLimit: 0.35
    },
    Shopping: {
      primary: '#A78BFA',
      gradient: 'linear-gradient(135deg, #A78BFA 0%, #C4B5FD 100%)',
      hover: '#C4B5FD',
      icon: '🛍️',
      description: 'Personal and retail shopping',
      suggestedLimit: 0.15
    },
    Travel: {
      primary: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      hover: '#FBBF24',
      icon: '✈️',
      description: 'Travel and transportation expenses',
      suggestedLimit: 0.1
    },
    Subscriptions: {
      primary: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      hover: '#F472B6',
      icon: '📱',
      description: 'Regular subscription services',
      suggestedLimit: 0.05
    },
    Household: {
      primary: '#96C93D',
      gradient: 'linear-gradient(135deg, #96C93D 0%, #B5E655 100%)',
      hover: '#B5E655',
      icon: '🏡',
      description: 'Household and utilities',
      suggestedLimit: 0.15
    },
    Food: {
      primary: '#FED766',
      gradient: 'linear-gradient(135deg, #FED766 0%, #FFE899 100%)',
      hover: '#FFE899',
      icon: '🍽️',
      description: 'Food and dining expenses',
      suggestedLimit: 0.15
    },
    Entertainment: {
      primary: '#A18CD1',
      gradient: 'linear-gradient(135deg, #A18CD1 0%, #BBA4E3 100%)',
      hover: '#BBA4E3',
      icon: '🎮',
      description: 'Entertainment and recreation',
      suggestedLimit: 0.1
    },
    Others: {
      primary: '#8E8E93',
      gradient: 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)',
      hover: '#AEAEB2',
      icon: '📌',
      description: 'Miscellaneous expenses',
      suggestedLimit: 0.05
    },
    Investments: {
      primary: '#27ae60',
      gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
      hover: '#2ecc71',
      icon: '📈',
      description:
        'Investments and target savings for major goals (e.g., Gold Chain, iPhone, Foreign Trip, Custom PC)',
      suggestedLimit: 0.15 // 15% of income
    }
  };
  
  export const incomeCategories = {
    Salary: {
      primary: '#22C55E',
      gradient: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
      hover: '#4ADE80',
      icon: '💵',
      description: 'Regular employment income'
    },
    Business: {
      primary: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      hover: '#A78BFA',
      icon: '💼',
      description: 'Business and self-employment income'
    },
    Freelance: {
      primary: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      hover: '#F472B6',
      icon: '💻',
      description: 'Freelance and contract work'
    },
    Rental: {
      primary: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      hover: '#FBBF24',
      icon: '🏠',
      description: 'Income from rental properties'
    },
    Others: {
      primary: '#6B7280',
      gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
      hover: '#9CA3AF',
      icon: '💰',
      description: 'Other sources of income'
    }
  };
  
  export const familyMembers = [
    
    {
      id: 1,
      name: 'Mummy',
      role: 'parent',
      icon: '👩',
      color: '#EC4899'
    },
    {
      id: 2,
      name: 'Anuraag',
      role: 'child',
      icon: '👦',
      color: '#10B981'
    },
  ];
  export const TRANSACTION_TYPES = {
    EXPENSE: 'expense',
    INCOME: 'income'
  };
  
  export const budgetStatus = {
    UNDER: 'under',
    NEAR: 'near',
    OVER: 'over'
  };
  
  export const chartColors = {
    income: '#22C55E',
    expense: '#EF4444',
    neutral: '#6B7280',
    primary: '#3B82F6'
  };
  
  export const dateRanges = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly',
    CUSTOM: 'custom'
  };
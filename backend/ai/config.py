"""
AI Service Configuration
"""

# OpenAI Configuration
OPENAI_MODEL = "gpt-4-turbo-preview"
OPENAI_TEMPERATURE = 0.7

# Budget Categories
NEEDS_CATEGORIES = [
    'Housing',
    'Utilities',
    'Groceries',
    'Transportation',
    'Insurance',
    'Healthcare'
]

WANTS_CATEGORIES = [
    'Entertainment',
    'Shopping',
    'Dining',
    'Hobbies',
    'Travel',
    'Personal Care'
]

SAVINGS_CATEGORIES = [
    'Savings',
    'Investments',
    'Debt Payment',
    'Emergency Fund',
    'Retirement'
]

# Budget Rules
BUDGET_RULES = {
    'needs_percentage': 0.5,  # 50% for needs
    'wants_percentage': 0.3,  # 30% for wants
    'savings_percentage': 0.2  # 20% for savings
}

# AI Analysis Settings
UNUSUAL_TRANSACTION_THRESHOLD = 2.0  # Z-score threshold for unusual transactions
MIN_MONTHS_FOR_PREDICTION = 3  # Minimum months of data needed for predictions
PREDICTION_MONTHS_AHEAD = 3  # Number of months to predict ahead

# Family Budget Settings
FAMILY_MEMBER_WEIGHTS = {
    'primary_earner': 1.2,
    'dependent': 0.8,
    'special_needs': 1.3
}

# AI Chat Settings
CHAT_SYSTEM_PROMPT = """You are a knowledgeable financial advisor AI. Use the provided context to give specific, 
actionable advice. Be concise but friendly. Always provide specific numbers and percentages when available.
Focus on helping users:
1. Understand their spending patterns
2. Make better financial decisions
3. Set and achieve financial goals
4. Optimize their budgets
5. Save money effectively"""

# Notification Settings
NOTIFICATION_PRIORITIES = {
    'high': ['budget_exceeded', 'unusual_transaction', 'goal_at_risk'],
    'medium': ['approaching_budget_limit', 'savings_opportunity'],
    'low': ['tip', 'insight', 'recommendation']
}

# Savings Plan Settings
DEFAULT_SAVINGS_PERCENTAGE = 0.2  # Default 20% savings rate
AGGRESSIVE_SAVINGS_PERCENTAGE = 0.4  # For accelerated goals
CONSERVATIVE_SAVINGS_PERCENTAGE = 0.1  # For more relaxed goals 
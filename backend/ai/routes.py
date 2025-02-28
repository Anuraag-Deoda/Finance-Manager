from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json
import re
import random

from models import db, User, Transaction, MonthlyPlan, AINotification

ai_bp = Blueprint('ai', __name__)

# AI Chat endpoint
@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    
    user_message = data['message']
    message_history = data.get('messageHistory', [])
    
    # For demo purposes, we'll use a simple rule-based response system
    # In production, this would be replaced by an actual LLM API call
    
    response = generate_ai_response(user_id, user_message, message_history)
    
    return jsonify({
        'response': response
    })

# AI Insights endpoint
@ai_bp.route('/insights', methods=['POST'])
@jwt_required()
def ai_insights():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'transactions' not in data:
        return jsonify({'error': 'Transactions data is required'}), 400
    
    transactions = data['transactions']
    
    # Generate insights based on transaction data
    insights = generate_ai_insights(user_id, transactions)
    
    return jsonify({
        'insights': insights
    })

# AI Budget Recommendations endpoint
@ai_bp.route('/budget/recommendations', methods=['POST'])
@jwt_required()
def ai_budget_recommendations():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'currentBudget' not in data or 'monthlyIncome' not in data:
        return jsonify({'error': 'Current budget and monthly income are required'}), 400
    
    current_budget = data['currentBudget']
    monthly_income = data['monthlyIncome']
    
    # Generate budget recommendations
    recommendations = generate_budget_recommendations(user_id, current_budget, monthly_income)
    
    return jsonify({
        'recommendations': recommendations
    })

# AI Report Generation endpoint
@ai_bp.route('/generate-report', methods=['POST'])
@jwt_required()
def generate_ai_report():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'startDate' not in data or 'endDate' not in data or 'transactionData' not in data:
        return jsonify({'error': 'Start date, end date, and transaction data are required'}), 400
    
    start_date = data['startDate']
    end_date = data['endDate']
    transaction_data = data['transactionData']
    
    # Generate financial report
    report = generate_financial_report(user_id, start_date, end_date, transaction_data)
    
    return jsonify({
        'report': report
    })

# AI Savings Plan endpoint
@ai_bp.route('/savings-plan', methods=['POST'])
@jwt_required()
def ai_savings_plan():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'goal' not in data or 'income' not in data or 'expenses' not in data:
        return jsonify({'error': 'Goal, income, and expenses are required'}), 400
    
    goal = data['goal']
    income = data['income']
    expenses = data['expenses']
    
    # Generate savings plan
    plan = generate_savings_plan(user_id, goal, income, expenses)
    
    return jsonify({
        'plan': plan
    })

# AI Family Budget Optimization endpoint
@ai_bp.route('/family/optimize-budget', methods=['POST'])
@jwt_required()
def ai_optimize_family_budget():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'familyMembers' not in data or 'currentAllocations' not in data or 'totalBudget' not in data:
        return jsonify({'error': 'Family members, current allocations, and total budget are required'}), 400
    
    family_members = data['familyMembers']
    current_allocations = data['currentAllocations']
    total_budget = data['totalBudget']
    
    # Generate optimized family budget
    optimized_budget = optimize_family_budget(user_id, family_members, current_allocations, total_budget)
    
    return jsonify({
        'optimizedBudget': optimized_budget
    })

# AI Notifications endpoint
@ai_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_ai_notifications():
    user_id = get_jwt_identity()
    
    # Get notifications for the user
    notifications = AINotification.query.filter_by(user_id=user_id).order_by(AINotification.created_at.desc()).all()
    
    return jsonify({
        'notifications': [
            {
                'id': notification.id,
                'type': notification.type,
                'message': notification.message,
                'priority': notification.priority,
                'read': notification.read,
                'timestamp': notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for notification in notifications
        ]
    })

# Mark AI Notification as read endpoint
@ai_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    
    notification = AINotification.query.filter_by(id=notification_id, user_id=user_id).first_or_404()
    notification.read = True
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Notification marked as read'
    })

# Helper functions for AI features
def generate_ai_response(user_id, message, message_history):
    """Generate AI response based on user message and history"""
    
    # Simple pattern matching - in production this would be an LLM
    message = message.lower()
    
    # Spending related questions
    if re.search(r'(spend|spent|spending)', message) and re.search(r'(month|week|day)', message):
        if 'food' in message or 'grocery' in message or 'groceries' in message:
            return "Based on your transactions, you spent $425 on groceries this month, which is about 15% of your total expenses. This is slightly higher than your average of $380 per month."
        
        if 'entertainment' in message:
            return "Your entertainment spending this month is $280, which is 10% of your monthly expenses. This is within your budget of $300."
            
        return "Your total spending this month is $2,800, with the largest categories being Housing ($1,200), Food ($425), and Transportation ($320)."
    
    # Budget related questions
    if re.search(r'(budget|save|saving)', message):
        return "Based on your income and spending patterns, I recommend a monthly budget of $3,500 with $1,200 for housing, $450 for food, $300 for entertainment, and $400 for savings. Would you like to see a detailed breakdown?"
    
    # Finance tips
    if re.search(r'(tip|advice|suggest|help|improve)', message):
        tips = [
            "I noticed you spend a lot on subscription services. Consider reviewing them monthly to eliminate ones you don't use regularly.",
            "Your restaurant spending is higher than average. Try meal prepping on weekends to reduce food expenses.",
            "Setting up automatic transfers to your savings account can help you reach your financial goals faster.",
            "Consider using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt payments."
        ]
        return random.choice(tips)
    
    # Goal related questions
    if re.search(r'(goal|target|saving for)', message):
        return "Based on your current saving rate of $400/month, you can reach your goal of $10,000 in approximately 25 months. If you increase your monthly savings by $200, you could reach your goal in just 17 months."
    
    # Default responses
    default_responses = [
        "I can analyze your spending patterns, suggest budget improvements, or help set financial goals. What would you like help with?",
        "I can help you track expenses, create a budget, or plan for future purchases. What are you interested in?",
        "I'd be happy to provide financial insights or answer questions about your spending habits. What would you like to know?"
    ]
    
    return random.choice(default_responses)

def generate_ai_insights(user_id, transactions):
    """Generate insights based on transaction data"""
    
    # In production, this would analyze transaction data in depth
    # For demo purposes, we'll return mock insights
    
    mock_insights = [
        {
            "type": "trend",
            "title": "Spending Increase",
            "description": "Your overall spending increased by 15% compared to last month, mainly in the Shopping category.",
            "action": "View Shopping Transactions"
        },
        {
            "type": "alert",
            "title": "Over Budget",
            "description": "You've exceeded your monthly Entertainment budget by $75 (25%).",
            "action": "Adjust Budget"
        },
        {
            "type": "tip",
            "title": "Potential Savings",
            "description": "Reducing your daily coffee purchases could save you approximately $95 per month based on your current habits."
        },
        {
            "type": "positive",
            "title": "Savings Goal Progress",
            "description": "You're on track to meet your Emergency Fund goal in 3 months at your current savings rate."
        }
    ]
    
    # Randomize which insights to show to simulate intelligent selection
    return random.sample(mock_insights, min(3, len(mock_insights)))

def generate_budget_recommendations(user_id, current_budget, monthly_income):
    """Generate budget recommendations based on current budget and monthly income"""
    
    # Mock budget recommendations
    recommended_budget = {
        "summary": "I've analyzed your spending patterns and optimized your budget to better align with the 50/30/20 rule.",
        "budget": {
            "Housing": 0.30 * monthly_income,
            "Food": 0.12 * monthly_income,
            "Transportation": 0.10 * monthly_income,
            "Entertainment": 0.08 * monthly_income,
            "Shopping": 0.05 * monthly_income,
            "Healthcare": 0.05 * monthly_income,
            "Utilities": 0.07 * monthly_income,
            "Savings": 0.20 * monthly_income,
            "Other": 0.03 * monthly_income
        },
        "changes": [
            {
                "category": "Food",
                "direction": "decrease",
                "amount": "$50",
                "reason": "Your food spending is higher than recommended (15% vs 12% recommended)"
            },
            {
                "category": "Savings",
                "direction": "increase",
                "amount": "$75",
                "reason": "Increasing your savings rate will help you reach your goals faster"
            },
            {
                "category": "Entertainment",
                "direction": "decrease",
                "amount": "$25",
                "reason": "Your entertainment spending could be optimized"
            }
        ]
    }
    
    return [recommended_budget]

def generate_financial_report(user_id, start_date, end_date, transaction_data):
    """Generate a financial report for the given period"""
    
    # Calculate date range string
    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
    date_str = f"{start_date_obj.strftime('%b %d')} - {end_date_obj.strftime('%b %d, %Y')}"
    
    # Mock report data
    report = {
        "title": "Financial Summary Report",
        "dateRange": date_str,
        "summary": {
            "totalIncome": "$4,500",
            "totalExpenses": "$3,200",
            "netSavings": "$1,300"
        },
        "keyInsights": [
            "Your saving rate this month was 29%, exceeding your goal of 20%",
            "Grocery spending decreased by 12% compared to last month",
            "Recurring subscription costs increased by $45 this month",
            "You stayed under budget in 6 out of 8 spending categories"
        ],
        "topCategories": [
            {"name": "Housing", "amount": "$1,200", "percentage": "37.5%"},
            {"name": "Food", "amount": "$480", "percentage": "15%"},
            {"name": "Transportation", "amount": "$350", "percentage": "10.9%"},
            {"name": "Entertainment", "amount": "$320", "percentage": "10%"}
        ],
        "recommendations": [
            "Consider setting up automatic transfers for your savings to maintain your current rate",
            "Review your subscription services for potential savings opportunities",
            "Your transportation costs are trending upward - consider carpooling or public transit options",
            "You're on track to meet your vacation saving goal in 3 months at your current rate"
        ]
    }
    
    return report

def generate_savings_plan(user_id, goal, income, expenses):
    """Generate a savings plan based on user's financial goal"""
    
    # Calculate basic parameters
    goal_amount = goal['amount']
    today = datetime.now()
    target_date = datetime.strptime(goal['targetDate'], '%Y-%m-%d')
    months_until_target = max(1, (target_date.year - today.year) * 12 + target_date.month - today.month)
    
    # Calculate monthly savings needed
    monthly_savings_needed = goal_amount / months_until_target
    
    # Placeholder for discretionary spending calculation
    # In production this would analyze actual transaction data
    discretionary_spending = income * 0.3  # Assuming 30% of income is discretionary
    
    # Generate recommendations based on the goal
    recommendations = []
    if monthly_savings_needed > (income - expenses) * 0.8:
        # If savings goal requires more than 80% of available income
        recommendations.append(f"Your goal of saving ${goal_amount} by {goal['targetDate']} is ambitious. Consider extending your timeline or adjusting the target amount.")
        recommendations.append(f"Reduce discretionary spending by ${min(discretionary_spending * 0.3, monthly_savings_needed * 0.5):.2f} per month to help reach your goal.")
    elif monthly_savings_needed > (income - expenses) * 0.5:
        # If savings goal requires more than 50% of available income
        recommendations.append(f"Set up an automatic transfer of ${monthly_savings_needed:.2f} at the beginning of each month to prioritize your goal.")
        recommendations.append(f"Reduce dining out expenses by approximately 25% to free up additional funds for your goal.")
    else:
        # If savings goal is reasonably achievable
        recommendations.append(f"Your goal is achievable at your current income level. Set up an automatic monthly transfer of ${monthly_savings_needed:.2f}.")
        recommendations.append(f"Consider putting any unexpected income (bonuses, tax refunds) toward this goal to reach it faster.")
    
    # Add a general recommendation based on the type of goal
    goal_name_lower = goal['name'].lower()
    if 'emergency' in goal_name_lower or 'fund' in goal_name_lower:
        recommendations.append("Keep your emergency fund in a high-yield savings account for easy access while earning interest.")
    elif 'vacation' in goal_name_lower or 'travel' in goal_name_lower:
        recommendations.append("Look for travel deals during off-peak seasons to make your budget go further.")
    elif 'house' in goal_name_lower or 'home' in goal_name_lower:
        recommendations.append("Consider setting up a separate high-yield savings account specifically for your home down payment.")
    
    # Build the plan response
    plan = {
        "monthlySavings": f"${monthly_savings_needed:.2f}",
        "totalMonths": months_until_target,
        "completionDate": target_date.strftime('%b %Y'),
        "feasibility": "High" if monthly_savings_needed < (income - expenses) * 0.5 else "Medium" if monthly_savings_needed < (income - expenses) * 0.8 else "Low",
        "recommendations": recommendations
    }
    
    return plan

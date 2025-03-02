from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json

from models import db, User, Transaction, MonthlyPlan, AINotification, Category
from .services import AIFinanceService

ai_bp = Blueprint('ai', __name__)
ai_service = AIFinanceService()

# AI Chat endpoint
@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
async def ai_chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    
    # Get user context
    user = User.query.get(user_id)
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    monthly_plan = MonthlyPlan.query.filter_by(user_id=user_id).first()
    categories = Category.query.filter_by(user_id=user_id).all()
    
    # Add family context if user is part of a family
    family_context = {}
    if user.family_id:
        family_transactions = Transaction.query.filter_by(family_id=user.family_id).all()
        family_monthly_plan = MonthlyPlan.query.filter_by(family_id=user.family_id).first()
        family_categories = Category.query.filter_by(family_id=user.family_id).all()
        
        family_context = {
            'family_transactions': [t.to_dict() for t in family_transactions],
            'family_monthly_plan': family_monthly_plan.to_dict() if family_monthly_plan else None,
            'family_categories': [c.to_dict() for c in family_categories]
        }
    
    context = {
        'user': {
            'name': user.name,
            'email': user.email,
            'monthly_income': monthly_plan.expected_income if monthly_plan else None
        },
        'recent_transactions': [t.to_dict() for t in transactions[-10:]],
        'monthly_plan': monthly_plan.to_dict() if monthly_plan else None,
        'categories': [c.to_dict() for c in categories],
        'family': family_context if user.family_id else None
    }
    
    response = await ai_service.get_ai_chat_response(data['message'], context)
    
    return jsonify({
        'response': response
    })

# AI Insights endpoint
@ai_bp.route('/analyze', methods=['POST'])
@jwt_required()
def ai_insights():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'transactions' not in data:
        return jsonify({'error': 'Transactions data is required'}), 400
    
    insights = ai_service.analyze_spending_patterns(data['transactions'])
    
    return jsonify({
        'insights': insights
    })

# AI Budget Recommendations endpoint
@ai_bp.route('/budget/recommendations', methods=['POST'])
@jwt_required()
def ai_budget_recommendations():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'monthlyIncome' not in data:
        return jsonify({'error': 'Monthly income is required'}), 400
    
    # Get user's expenses
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    expenses = [t.to_dict() for t in transactions]
    
    # Add family expenses if user is part of a family
    user = User.query.get(user_id)
    if user.family_id:
        family_transactions = Transaction.query.filter_by(family_id=user.family_id).all()
        expenses.extend([t.to_dict() for t in family_transactions])
    
    recommendations = ai_service.generate_budget_recommendations(
        data['monthlyIncome'],
        expenses
    )
    
    return jsonify({
        'recommendations': recommendations
    })

# AI Report Generation endpoint
@ai_bp.route('/generate-report', methods=['POST'])
@jwt_required()
def generate_ai_report():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'startDate' not in data or 'endDate' not in data:
        return jsonify({'error': 'Start date and end date are required'}), 400
    
    start_date = datetime.strptime(data['startDate'], '%Y-%m-%d')
    end_date = datetime.strptime(data['endDate'], '%Y-%m-%d')
    
    # Get user's transactions
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    
    # Add family transactions if user is part of a family
    user = User.query.get(user_id)
    if user.family_id:
        family_transactions = Transaction.query.filter(
            Transaction.family_id == user.family_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).all()
        transactions.extend(family_transactions)
    
    # Get spending patterns
    patterns = ai_service.analyze_spending_patterns([t.to_dict() for t in transactions])
    
    # Get future predictions
    predictions = ai_service.predict_future_expenses([t.to_dict() for t in transactions])
    
    report = {
        'spending_patterns': patterns,
        'predictions': predictions,
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        }
    }
    
    return jsonify({
        'report': report
    })

# AI Savings Plan endpoint
@ai_bp.route('/savings-plan', methods=['POST'])
@jwt_required()
def ai_savings_plan():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'goal' not in data:
        return jsonify({'error': 'Savings goal is required'}), 400
        
    try:
        # Extract and validate goal amount
        goal_amount = float(data['goal'].get('amount', 0) if isinstance(data['goal'], dict) else data['goal'])
        if goal_amount <= 0:
            return jsonify({'error': 'Goal amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid goal amount format'}), 400
    
    # Get user's current financial state
    monthly_plan = MonthlyPlan.query.filter_by(user_id=user_id).first()
    if not monthly_plan:
        return jsonify({'error': 'Monthly plan not found'}), 404
    
    # Calculate total income and savings from expected_income list
    try:
        total_income = sum(float(entry['amount']) for entry in monthly_plan.expected_income)
        savings = sum(float(entry['amount']) for entry in monthly_plan.expected_income 
                     if entry['category'].lower() in ['savings', 'investments', 'emergency fund'])
    except (KeyError, ValueError, TypeError):
        return jsonify({'error': 'Invalid income/savings data format in monthly plan'}), 500
    
    # Calculate current monthly expenses
    current_month_start = datetime.now().replace(day=1)
    expenses_query = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= current_month_start
    )
    
    # Add family expenses if user is part of a family
    user = User.query.get(user_id)
    if user.family_id:
        expenses_query = expenses_query.union(
            Transaction.query.filter(
                Transaction.family_id == user.family_id,
                Transaction.date >= current_month_start
            )
        )
    
    current_month_expenses = sum(t.amount for t in expenses_query.all())
    target_date = datetime.strptime(data.get('targetDate'), '%Y-%m-%d') if data.get('targetDate') else None
    
    try:
        plan = ai_service.generate_savings_plan(
            goal_amount=goal_amount,
            current_savings=savings,
            monthly_income=total_income,
            monthly_expenses=current_month_expenses,
            target_date=target_date
        )
    except Exception as e:
        return jsonify({'error': f'Error generating savings plan: {str(e)}'}), 500
    
    return jsonify({
        'plan': plan
    })

# AI Family Budget Optimization endpoint
@ai_bp.route('/family/optimize-budget', methods=['POST'])
@jwt_required()
def ai_optimize_family_budget():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'familyMembers' not in data or 'totalBudget' not in data:
        return jsonify({'error': 'Family members and total budget are required'}), 400
    
    optimized_budget = ai_service.optimize_family_budget(
        data['familyMembers'],
        data['totalBudget']
    )
    
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

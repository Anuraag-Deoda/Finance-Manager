from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging

from models import db, User, MonthlyPlan

logger = logging.getLogger(__name__)
monthly_plans_bp = Blueprint('monthly_plans', __name__)

@monthly_plans_bp.route('/<month>', methods=['GET'])
@jwt_required()
def get_monthly_plan(month):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            logger.error(f"User not found for ID: {user_id}")
            return jsonify({'message': 'User not found'}), 401
        
        # First try to get user's personal monthly plan
        monthly_plan = MonthlyPlan.query.filter_by(user_id=user_id, month=month).first()
        
        # If user has a family and no personal plan, try to get family plan
        if not monthly_plan and user.family_id:
            monthly_plan = MonthlyPlan.query.filter_by(family_id=user.family_id, month=month).first()
        
        if not monthly_plan:
            # Return empty plan structure if no plan exists
            return jsonify({
                'month': month,
                'expectedIncome': [],
                'expectedExpenses': [],
                'notes': '',
                'is_family_plan': user.family_id is not None
            })
        
        return jsonify(monthly_plan.to_dict())
        
    except Exception as e:
        logger.error(f"Error in get_monthly_plan: {str(e)}", exc_info=True)
        return jsonify({'message': 'Failed to get monthly plan', 'error': str(e)}), 500

@monthly_plans_bp.route('/<month>', methods=['POST'])
@jwt_required()
def create_monthly_plan(month):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            logger.error(f"User not found for ID: {user_id}")
            return jsonify({'message': 'User not found'}), 401
            
        data = request.get_json()
        
        # Check if plan already exists
        existing_plan = MonthlyPlan.query.filter_by(user_id=user_id, month=month).first()
        if existing_plan:
            return jsonify({'message': 'Monthly plan already exists for this month'}), 400
        
        # Create new plan
        monthly_plan = MonthlyPlan(
            user_id=user_id,
            family_id=user.family_id,  # Will be None if user not in family
            month=month,
            expected_income=data.get('expectedIncome', []),
            expected_expenses=data.get('expectedExpenses', []),
            notes=data.get('notes', '')
        )
        
        db.session.add(monthly_plan)
        db.session.commit()
        
        return jsonify(monthly_plan.to_dict()), 201
        
    except Exception as e:
        logger.error(f"Error in create_monthly_plan: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'message': 'Failed to create monthly plan', 'error': str(e)}), 500

@monthly_plans_bp.route('/<month>', methods=['PUT'])
@jwt_required()
def update_monthly_plan(month):
    try:
        logger.info(f"\n=== Updating Monthly Plan ===")
        user_id = get_jwt_identity()
        logger.info(f"User ID: {user_id}")
        
        user = User.query.get(user_id)
        if not user:
            logger.error(f"User not found for ID: {user_id}")
            return jsonify({'message': 'User not found'}), 401
            
        logger.info(f"User found: {user.email}")
        
        data = request.get_json()
        logger.info(f"Received data: {data}")
        
        # Get existing plan
        monthly_plan = MonthlyPlan.query.filter_by(user_id=user_id, month=month).first()
        logger.info(f"Personal plan found: {monthly_plan is not None}")
        
        # If no personal plan but user has family, try to get family plan
        if not monthly_plan and user.family_id:
            logger.info(f"No personal plan found, checking family plan. Family ID: {user.family_id}")
            monthly_plan = MonthlyPlan.query.filter_by(family_id=user.family_id, month=month).first()
            logger.info(f"Family plan found: {monthly_plan is not None}")
        
        if not monthly_plan:
            logger.info("No plan found, creating new one")
            monthly_plan = MonthlyPlan(
                user_id=user_id,
                family_id=user.family_id,
                month=month,
                expected_income=data.get('expectedIncome', []),
                expected_expenses=data.get('expectedExpenses', []),
                notes=data.get('notes', '')
            )
            db.session.add(monthly_plan)
            logger.info("New plan created and added to session")
        else:
            logger.info("Updating existing plan")
            monthly_plan.expected_income = data.get('expectedIncome', monthly_plan.expected_income)
            monthly_plan.expected_expenses = data.get('expectedExpenses', monthly_plan.expected_expenses)
            monthly_plan.notes = data.get('notes', monthly_plan.notes)
            logger.info(f"Updated plan data - Income: {monthly_plan.expected_income}, Expenses: {monthly_plan.expected_expenses}")
        
        db.session.commit()
        logger.info("Changes committed to database")
        
        return jsonify(monthly_plan.to_dict())
        
    except Exception as e:
        logger.error(f"Error updating monthly plan: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'message': 'Failed to update monthly plan', 'error': str(e)}), 500

@monthly_plans_bp.route('/<month>', methods=['DELETE'])
@jwt_required()
def delete_monthly_plan(month):
    user_id = get_jwt_identity()
    
    # Get existing plan
    monthly_plan = MonthlyPlan.query.filter_by(user_id=user_id, month=month).first()
    
    if not monthly_plan:
        return jsonify({'message': 'Monthly plan not found'}), 404
    
    db.session.delete(monthly_plan)
    db.session.commit()
    
    return jsonify({'message': 'Monthly plan deleted successfully'})

# Helper method to convert MonthlyPlan to dict
def monthly_plan_to_dict(plan):
    if not plan:
        return None
    return {
        'id': plan.id,
        'month': plan.month,
        'expected_income': plan.expected_income,
        'expected_expenses': plan.expected_expenses,
        'notes': plan.notes,
        'is_family_plan': plan.family_id is not None
    } 
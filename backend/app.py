from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_mail import Mail, Message
from config import Config
from models import db, User, Transaction, MonthlyPlan, Family, Invitation
import random
import string
from datetime import datetime, timedelta
import bcrypt
from functools import wraps

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
jwt = JWTManager(app)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],  # Your frontend URL
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"\n=== JWT Invalid Token Error ===")
    print(f"Error: {error}")
    return jsonify({
        'message': 'Invalid token',
        'error': 'invalid_token'
    }), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    print(f"\n=== JWT Expired Token Error ===")
    print(f"Header: {jwt_header}")
    print(f"Data: {jwt_data}")
    return jsonify({
        'message': 'Token has expired',
        'error': 'token_expired'
    }), 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print(f"\n=== JWT Unauthorized Error ===")
    print(f"Error: {error}")
    return jsonify({
        'message': 'Missing Authorization Header',
        'error': 'authorization_header_missing'
    }), 401

mail = Mail(app)

# Error handling decorator
def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Error in {f.__name__}: {str(e)}")
            return jsonify({'message': 'An error occurred', 'error': str(e)}), 500
    return decorated_function

# Helper Functions
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Authentication Routes
@app.route('/api/register', methods=['POST'])
@handle_errors
def register():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'message': 'Missing required fields'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400

        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        user = User(
            email=data['email'],
            password=hashed_password,
            role='user'  # Default role
        )
        db.session.add(user)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'user': {'id': user.id, 'email': user.email}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
@handle_errors
def login():
    print("\n=== POST /api/login ===")
    try:
        data = request.get_json()
        print(f"Login attempt for email: {data.get('email')}")
        
        user = User.query.filter_by(email=data['email']).first()
        if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password):
            print(f"Failed login attempt for email: {data.get('email')}")
            return jsonify({'message': 'Invalid credentials'}), 401

        token = create_access_token(identity=str(user.id))
        print(f"Created token for user ID: {user.id}")
        print(f"Successful login for user: {user.email}")
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email
            }
        }), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
@jwt_required()
@handle_errors
def logout():
    # JWT tokens are stateless, so we just return success
    return jsonify({'message': 'Logout successful'}), 200

# Transaction Routes
@app.route('/api/transactions', methods=['GET'])
@jwt_required()
@handle_errors
def get_transactions():
    try:
        # Add debug logging
        auth_header = request.headers.get('Authorization')
        print(f"\n=== GET /api/transactions ===")
        print(f"Auth header: {auth_header}")
        
        user_id = get_jwt_identity()
        print(f"User ID from token: {user_id}")
        print(f"Request args: {request.args}")
        
        if not user_id:
            print("Error: Invalid token - no user_id")
            return jsonify({'message': 'Invalid token'}), 401

        user_id = int(user_id)
        month = request.args.get('month')
        query = Transaction.query.filter_by(user_id=user_id)
        
        if month:
            print(f"Filtering by month: {month}")
            query = query.filter(Transaction.date.startswith(month))
        
        transactions = query.all()
        print(f"Found {len(transactions)} transactions")
        
        result = [{
            'id': t.id,
            'type': t.type,
            'amount': float(t.amount),
            'category': t.category,
            'description': t.description,
            'date': t.date.strftime('%Y-%m-%d'),
            'familyMember': t.family_member,
            'isRecurring': t.is_recurring
        } for t in transactions]
        
        print("Successfully returning transactions")
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_transactions: {str(e)}")
        return jsonify({'message': 'Failed to fetch transactions', 'error': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
@jwt_required()
@handle_errors
def add_transaction():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        required_fields = ['type', 'amount', 'category', 'date', 'familyMember']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        transaction = Transaction(
            user_id=int(user_id),
            type=data['type'],
            amount=float(data['amount']),
            category=data['category'],
            description=data.get('description', ''),
            date=datetime.strptime(data['date'], '%Y-%m-%d'),
            family_member=data['familyMember'],
            is_recurring=data.get('isRecurring', False)
        )
        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            'message': 'Transaction added',
            'id': transaction.id,
            'transaction': {
                'id': transaction.id,
                'type': transaction.type,
                'amount': float(transaction.amount),
                'category': transaction.category,
                'description': transaction.description,
                'date': transaction.date.strftime('%Y-%m-%d'),
                'familyMember': transaction.family_member,
                'isRecurring': transaction.is_recurring
            }
        }), 201
    except ValueError as e:
        return jsonify({'message': f'Invalid data: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to add transaction', 'error': str(e)}), 500

@app.route('/api/transactions/<int:id>', methods=['PUT'])
@jwt_required()
@handle_errors
def update_transaction(id):
    try:
        user_id = get_jwt_identity()
        transaction = Transaction.query.get_or_404(id)
        
        if transaction.user_id != int(user_id):
            return jsonify({'message': 'Unauthorized'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        # Update fields if provided
        if 'type' in data:
            transaction.type = data['type']
        if 'amount' in data:
            transaction.amount = float(data['amount'])
        if 'category' in data:
            transaction.category = data['category']
        if 'description' in data:
            transaction.description = data['description']
        if 'date' in data:
            transaction.date = datetime.strptime(data['date'], '%Y-%m-%d')
        if 'familyMember' in data:
            transaction.family_member = data['familyMember']
        if 'isRecurring' in data:
            transaction.is_recurring = data['isRecurring']

        db.session.commit()

        return jsonify({
            'message': 'Transaction updated',
            'transaction': {
                'id': transaction.id,
                'type': transaction.type,
                'amount': float(transaction.amount),
                'category': transaction.category,
                'description': transaction.description,
                'date': transaction.date.strftime('%Y-%m-%d'),
                'familyMember': transaction.family_member,
                'isRecurring': transaction.is_recurring
            }
        })
    except ValueError as e:
        return jsonify({'message': f'Invalid data: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update transaction', 'error': str(e)}), 500

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_transaction(id):
    try:
        user_id = get_jwt_identity()
        transaction = Transaction.query.get_or_404(id)
        
        if transaction.user_id != int(user_id):
            return jsonify({'message': 'Unauthorized'}), 403

        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Transaction deleted', 'id': id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete transaction', 'error': str(e)}), 500

# Dashboard Routes
@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
@handle_errors
def get_dashboard():
    try:
        print("\n=== GET /api/dashboard ===")
        user_id = get_jwt_identity()
        print(f"User ID from token: {user_id}")
        
        if not user_id:
            print("Error: Invalid token in dashboard route")
            return jsonify({'message': 'Invalid token'}), 401

        user_id = int(user_id)
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        print(f"Found {len(transactions)} transactions for dashboard")
        
        income = sum(float(t.amount) for t in transactions if t.type == 'income')
        expenses = sum(float(t.amount) for t in transactions if t.type == 'expense')
        
        print(f"Dashboard stats - Income: {income}, Expenses: {expenses}")
        return jsonify({
            'income': income,
            'expenses': expenses,
            'balance': income - expenses
        })
    except Exception as e:
        print(f"Error in dashboard: {str(e)}")
        return jsonify({'message': 'Failed to fetch dashboard data', 'error': str(e)}), 500

@app.route('/api/family-dashboard', methods=['GET'])
@jwt_required()
@handle_errors
def get_family_dashboard():
    try:
        print("\n=== GET /api/family-dashboard ===")
        user_id = get_jwt_identity()
        print(f"Getting family dashboard for user_id: {user_id}")
        
        if not user_id:
            print("Error: Invalid token in family dashboard route")
            return jsonify({'message': 'Invalid token'}), 401

        user_id = int(user_id)
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        print(f"Found {len(transactions)} transactions for family dashboard")

        # Process family transactions
        family_income = sum(float(t.amount) for t in transactions if t.type == 'income')
        family_expenses = sum(float(t.amount) for t in transactions if t.type == 'expense')
        
        print(f"Family stats - Income: {family_income}, Expenses: {family_expenses}")
        return jsonify({
            'familyIncome': family_income,
            'familyExpenses': family_expenses,
            'familyBalance': family_income - family_expenses
        })
    except Exception as e:
        print(f"Error in family dashboard: {str(e)}")
        return jsonify({'message': 'Failed to fetch family dashboard data', 'error': str(e)}), 500

# Monthly Plan Routes
@app.route('/api/monthly-plans/<month>', methods=['GET'])
@jwt_required()
@handle_errors
def get_monthly_plan(month):
    try:
        user_id = get_jwt_identity()
        plan = MonthlyPlan.query.filter_by(month=month, user_id=int(user_id)).first()
        
        if not plan:
            return jsonify({
                'month': month,
                'expectedIncome': [],
                'expectedExpenses': [],
                'notes': ''
            })

        return jsonify({
            'month': plan.month,
            'expectedIncome': plan.expected_income,
            'expectedExpenses': plan.expected_expenses,
            'notes': plan.notes
        })
    except Exception as e:
        return jsonify({'message': 'Failed to fetch monthly plan', 'error': str(e)}), 500

@app.route('/api/monthly-plans/<month>', methods=['PUT'])
@jwt_required()
@handle_errors
def save_monthly_plan(month):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        plan = MonthlyPlan.query.filter_by(month=month, user_id=int(user_id)).first()
        if not plan:
            plan = MonthlyPlan(
                month=month,
                user_id=int(user_id),
                expected_income=data.get('expectedIncome', []),
                expected_expenses=data.get('expectedExpenses', []),
                notes=data.get('notes', '')
            )
            db.session.add(plan)
        else:
            plan.expected_income = data.get('expectedIncome', plan.expected_income)
            plan.expected_expenses = data.get('expectedExpenses', plan.expected_expenses)
            plan.notes = data.get('notes', plan.notes)

        db.session.commit()
        return jsonify({'message': 'Plan saved successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to save monthly plan', 'error': str(e)}), 500

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'message': 'Internal server error'}), 500

# Initialize Database
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
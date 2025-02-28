from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_mail import Mail, Message
from config import Config
from models import db, User, Transaction, MonthlyPlan, Family, Invitation, FamilyMember, Category
import random
import string
from datetime import datetime, timedelta
import bcrypt
from functools import wraps
import logging
from ai.routes import ai_bp

# Register the blueprint

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
jwt = JWTManager(app)
app.register_blueprint(ai_bp, url_prefix='/api/ai')


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# User Profile Routes
@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
@handle_errors
def get_user_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'profile_image': user.profile_image,
        'role': user.role
    })

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
@handle_errors
def update_user_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        data = request.get_json()

        if 'name' in data:
            user.name = data['name']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'profile_image': user.profile_image
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_user_profile: {str(e)}")
        return jsonify({'message': 'Failed to update profile'}), 500

import os
from werkzeug.utils import secure_filename
from datetime import datetime

# Add these configurations to your app
UPLOAD_FOLDER = 'static/profile_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/user/profile/image', methods=['POST'])
@jwt_required()
@handle_errors
def upload_profile_image():
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)

        if 'image' not in request.files:
            return jsonify({'message': 'No image file provided'}), 400
            
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            # Create unique filename
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{user_id}_{timestamp}_{filename}"
            
            # Save file
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            # Update user profile
            # Delete old profile image if exists
            if user.profile_image:
                old_filepath = os.path.join(app.root_path, user.profile_image.lstrip('/'))
                if os.path.exists(old_filepath):
                    os.remove(old_filepath)
            
            # Update database with new image path
            user.profile_image = f'/static/profile_images/{unique_filename}'
            db.session.commit()
            
            return jsonify({
                'message': 'Profile image updated successfully',
                'profile_image': user.profile_image
            })
        
        return jsonify({'message': 'Invalid file type'}), 400
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in upload_profile_image: {str(e)}")
        return jsonify({'message': 'Failed to upload profile image'}), 500

# Category Routes
@app.route('/api/categories', methods=['GET'])
@jwt_required()
@handle_errors
def get_categories():
    user_id = get_jwt_identity()
    categories = Category.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': cat.id,
        'name': cat.name,
        'type': cat.type,
        'icon': cat.icon,
        'color': cat.color,
        'description': cat.description,
        'suggested_limit': cat.suggested_limit
    } for cat in categories])

@app.route('/api/categories', methods=['POST'])
@jwt_required()
@handle_errors
def add_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    category = Category(
        name=data['name'],
        type=data['type'],
        icon=data['icon'],
        color=data['color'],
        description=data.get('description', ''),
        suggested_limit=data.get('suggested_limit'),
        user_id=user_id
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'id': category.id,
        'name': category.name,
        'type': category.type,
        'icon': category.icon,
        'color': category.color,
        'description': category.description,
        'suggested_limit': category.suggested_limit
    }), 201

@app.route('/api/categories/<int:id>', methods=['PUT'])
@jwt_required()
@handle_errors
def update_category(id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json()
    
    category.name = data.get('name', category.name)
    category.icon = data.get('icon', category.icon)
    category.color = data.get('color', category.color)
    category.description = data.get('description', category.description)
    category.suggested_limit = data.get('suggested_limit', category.suggested_limit)
    
    db.session.commit()
    return jsonify({'message': 'Category updated successfully'})

@app.route('/api/categories/<int:id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_category(id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'})

# Family Member Routes
@app.route('/api/family/members', methods=['GET'])
@jwt_required()
@handle_errors
def get_family_members():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    family_members = FamilyMember.query.filter_by(family_id=user.family_id).all()
    return jsonify([{
        'id': member.id,
        'name': member.name,
        'role': member.role,
        'icon': member.icon,
        'color': member.color
    } for member in family_members])

@app.route('/api/family/members/<int:id>', methods=['PUT'])
@jwt_required()
@handle_errors
def update_family_member(id):
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    member = FamilyMember.query.filter_by(id=id, family_id=user.family_id).first_or_404()
    data = request.get_json()
    
    member.name = data.get('name', member.name)
    member.role = data.get('role', member.role)
    member.icon = data.get('icon', member.icon)
    member.color = data.get('color', member.color)
    
    db.session.commit()
    return jsonify({'message': 'Family member updated successfully'})

@app.route('/api/family/members/<int:id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_family_member(id):
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    member = FamilyMember.query.filter_by(id=id, family_id=user.family_id).first_or_404()
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Family member deleted successfully'})

# Family Invitation Routes
@app.route('/api/family/invite', methods=['POST'])
@jwt_required()
@handle_errors
def invite_family_member():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if not user.family_id:
        return jsonify({'message': 'You are not part of a family'}), 400
        
    invitation = Invitation(
        email=data['email'],
        family_id=user.family_id,
        otp=generate_otp(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.session.add(invitation)
    db.session.commit()
    
    # Send invitation email
    try:
        msg = Message(
            'Family Finance Tracker Invitation',
            sender=app.config['MAIL_USERNAME'],
            recipients=[data['email']]
        )
        msg.body = f'''You have been invited to join a family on Finance Tracker.
        Your invitation code is: {invitation.otp}
        This code will expire in 7 days.'''
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        
    return jsonify({'message': 'Invitation sent successfully'})

@app.route('/api/family/users/search', methods=['GET'])
@jwt_required()
@handle_errors
def search_users():
    """Search for users by email to add to family"""
    query = request.args.get('query', '').lower()
    if not query:
        return jsonify([])
        
    users = User.query.filter(User.email.ilike(f'%{query}%')).limit(5).all()
    return jsonify([{
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'profile_image': user.profile_image
    } for user in users])

@app.route('/api/family/create', methods=['POST'])
@jwt_required()
@handle_errors
def create_family():
    """Create a new family"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if user.family_id:
        return jsonify({'message': 'You are already part of a family'}), 400

    family = Family(
        name=data['name'],
        created_by=user_id
    )
    db.session.add(family)
    db.session.flush()  # Get family ID

    # Set user as family admin
    user.family_id = family.id
    user.is_family_admin = True

    # Create initial family member entry for the creator
    member = FamilyMember(
        name=user.name or 'Family Admin',
        role=data.get('role', 'Parent'),
        icon=data.get('icon', '👤'),
        color=data.get('color', '#4ECDC4'),
        family_id=family.id,
        user_id=user_id
    )
    db.session.add(member)
    db.session.commit()

    return jsonify({
        'message': 'Family created successfully',
        'family_id': family.id
    }), 201

@app.route('/api/family/members/invite', methods=['POST'])
@jwt_required()
@handle_errors
def invite_to_family():
    """Invite a user to join the family"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if not user.family_id:
        return jsonify({'message': 'You are not part of a family'}), 400

    # Check if user is authorized to send invites
    if not user.is_family_admin:
        return jsonify({'message': 'Only family admins can send invitations'}), 403

    # Check if user is already in a family
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user and existing_user.family_id:
        return jsonify({'message': 'User is already part of a family'}), 400

    # Create invitation
    invitation = Invitation(
        email=data['email'],
        family_id=user.family_id,
        invited_by=user_id,
        role=data.get('role', 'member'),
        otp=generate_otp(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.session.add(invitation)
    db.session.commit()

    # Send invitation email
    try:
        msg = Message(
            'Family Finance Tracker Invitation',
            sender=app.config['MAIL_USERNAME'],
            recipients=[data['email']]
        )
        msg.body = f'''You have been invited to join {user.name}'s family on Finance Tracker.
        Your invitation code is: {invitation.otp}
        This code will expire in 7 days.'''
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send email: {str(e)}")

    return jsonify({'message': 'Invitation sent successfully'})

@app.route('/api/family/members/add', methods=['POST'])
@jwt_required()
@handle_errors
def add_family_member():
    """Add an existing user to the family"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if not user.family_id or not user.is_family_admin:
        return jsonify({'message': 'Unauthorized'}), 403

    member_user = User.query.get_or_404(data['user_id'])
    if member_user.family_id:
        return jsonify({'message': 'User is already part of a family'}), 400

    # Add user to family
    member_user.family_id = user.family_id

    # Create family member entry
    member = FamilyMember(
        name=member_user.name or member_user.email,
        role=data['role'],
        icon=data.get('icon', '👤'),
        color=data.get('color', '#4ECDC4'),
        family_id=user.family_id,
        user_id=member_user.id
    )
    db.session.add(member)
    db.session.commit()

    return jsonify({
        'message': 'Family member added successfully',
        'member': {
            'id': member.id,
            'name': member.name,
            'role': member.role,
            'icon': member.icon,
            'color': member.color
        }
    })

@app.route('/api/family/members/join', methods=['POST'])
@jwt_required()
@handle_errors
def join_family():
    """Join a family using invitation code"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if user.family_id:
        return jsonify({'message': 'You are already part of a family'}), 400

    invitation = Invitation.query.filter_by(
        email=user.email,
        otp=data['otp'],
        status='pending'
    ).first_or_404()

    if invitation.expires_at < datetime.utcnow():
        return jsonify({'message': 'Invitation has expired'}), 400

    # Add user to family
    user.family_id = invitation.family_id

    # Create family member entry
    member = FamilyMember(
        name=user.name or user.email,
        role=invitation.role,
        icon=data.get('icon', '👤'),
        color=data.get('color', '#4ECDC4'),
        family_id=invitation.family_id,
        user_id=user_id
    )
    db.session.add(member)

    # Update invitation status
    invitation.status = 'accepted'
    db.session.commit()

    return jsonify({
        'message': 'Successfully joined family',
        'family_id': invitation.family_id
    })

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
        user = User.query.get(user_id)
        
        if not user.family_id:
            logger.error(f"User {user_id} does not belong to a family")
            return jsonify({'message': 'User does not belong to a family'}), 400
            
        logger.info(f"Fetching monthly plan for user {user_id}, family {user.family_id}, month {month}")
        
        plan = MonthlyPlan.query.filter_by(
            month=month,
            family_id=user.family_id
        ).first()
        
        if not plan:
            logger.info(f"No plan found for month {month}, creating default response")
            return jsonify({
                'month': month,
                'expectedIncome': [],
                'expectedExpenses': [],
                'notes': ''
            })

        logger.info(f"Successfully retrieved plan for month {month}")
        return jsonify({
            'month': plan.month,
            'expectedIncome': plan.expected_income,
            'expectedExpenses': plan.expected_expenses,
            'notes': plan.notes
        })
    except Exception as e:
        logger.error(f"Error in get_monthly_plan: {str(e)}", exc_info=True)
        return jsonify({'message': 'Failed to fetch monthly plan', 'error': str(e)}), 500

@app.route('/api/monthly-plans/<month>', methods=['PUT'])
@jwt_required()
@handle_errors
def save_monthly_plan(month):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        
        if not user.family_id:
            logger.error(f"User {user_id} does not belong to a family")
            return jsonify({'message': 'User does not belong to a family'}), 400
            
        if not data:
            logger.error("No data provided in request")
            return jsonify({'message': 'No data provided'}), 400

        logger.info(f"Saving monthly plan for user {user_id}, family {user.family_id}, month {month}")
        
        plan = MonthlyPlan.query.filter_by(
            month=month,
            family_id=user.family_id
        ).first()
        
        if not plan:
            logger.info("Creating new monthly plan")
            plan = MonthlyPlan(
                month=month,
                family_id=user.family_id,
                created_by=user_id,
                expected_income=data.get('expectedIncome', []),
                expected_expenses=data.get('expectedExpenses', []),
                notes=data.get('notes', '')
            )
            db.session.add(plan)
        else:
            logger.info("Updating existing monthly plan")
            plan.expected_income = data.get('expectedIncome', plan.expected_income)
            plan.expected_expenses = data.get('expectedExpenses', plan.expected_expenses)
            plan.notes = data.get('notes', plan.notes)

        db.session.commit()
        logger.info("Successfully saved monthly plan")
        return jsonify({'message': 'Plan saved successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in save_monthly_plan: {str(e)}", exc_info=True)
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
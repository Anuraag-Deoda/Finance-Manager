from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)  # Made nullable since we're not using it
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.LargeBinary, nullable=False)  # Store bcrypt hash as binary
    name = db.Column(db.String(100))
    profile_image = db.Column(db.String(255))
    role = db.Column(db.String(20), default='member')  # 'admin' or 'member'
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=True)
    is_family_admin = db.Column(db.Boolean, default=False)  # Whether user is family admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        print(f"\n=== Creating User Object ===")
        print(f"Initializing user with data: {kwargs}")
        if 'password' in kwargs:
            print("Password found in kwargs, storing as bcrypt hash")
            self.password = kwargs.pop('password')  # Password should already be hashed by bcrypt
        super(User, self).__init__(**kwargs)
        print("User object initialized")

    def __repr__(self):
        return f'<User {self.email}>'

    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    categories = db.relationship('Category', backref='user', lazy=True)
    monthly_plans = db.relationship('MonthlyPlan', backref='user', lazy=True)
    family_member = db.relationship('FamilyMember', backref=db.backref('user_profile', lazy=True), lazy=True)

    def to_dict(self):
        print(f"\n=== Converting User to Dict ===")
        print(f"User ID: {self.id}")
        result = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'family_id': self.family_id,
            'is_family_admin': self.is_family_admin,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        print(f"User dict created: {result}")
        return result

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Family(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    members = db.relationship('FamilyMember', backref='family', lazy=True)
    transactions = db.relationship('Transaction', backref='family', lazy=True)
    categories = db.relationship('Category', backref='family', lazy=True)
    monthly_plans = db.relationship('MonthlyPlan', backref='family', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'members': [member.to_dict() for member in self.members],
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class FamilyMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    transactions = db.relationship('Transaction', backref='family_member', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'family_id': self.family_id,
            'user_id': self.user_id,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    icon = db.Column(db.String(10), nullable=False)
    color = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(200))
    suggested_limit = db.Column(db.Float)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'icon': self.icon,
            'color': self.color,
            'description': self.description,
            'suggested_limit': self.suggested_limit,
            'user_id': self.user_id,
            'family_id': self.family_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=True)
    type = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    description = db.Column(db.String(200))
    date = db.Column(db.Date, nullable=False)
    family_member_id = db.Column(db.Integer, db.ForeignKey('family_member.id'), nullable=True)
    is_recurring = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    category = db.relationship('Category', backref='transactions', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'family_id': self.family_id,
            'type': self.type,
            'amount': self.amount,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'description': self.description,
            'date': self.date.strftime('%Y-%m-%d'),
            'family_member_id': self.family_member_id,
            'is_recurring': self.is_recurring,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class MonthlyPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=True)
    month = db.Column(db.String(7), nullable=False)  # YYYY-MM
    expected_income = db.Column(db.JSON, nullable=False, default=list)
    expected_expenses = db.Column(db.JSON, nullable=False, default=list)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        print(f"\n=== Creating MonthlyPlan Object ===")
        print(f"Initializing with data: {kwargs}")
        
        # Ensure expected_income and expected_expenses are lists
        if 'expected_income' in kwargs:
            kwargs['expected_income'] = kwargs['expected_income'] or []
        if 'expected_expenses' in kwargs:
            kwargs['expected_expenses'] = kwargs['expected_expenses'] or []
            
        super(MonthlyPlan, self).__init__(**kwargs)
        print("MonthlyPlan object initialized")

    def to_dict(self):
        print(f"\n=== Converting MonthlyPlan to Dict ===")
        print(f"Plan ID: {self.id}, Month: {self.month}")
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'family_id': self.family_id,
            'month': self.month,
            'expectedIncome': self.expected_income or [],
            'expectedExpenses': self.expected_expenses or [],
            'notes': self.notes or '',
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_family_plan': self.family_id is not None
        }
        print(f"MonthlyPlan dict created: {result}")
        return result

class Invitation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=False)
    invited_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Role in the family
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined
    otp = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AINotification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # alert, warning, tip, info
    message = db.Column(db.String(255), nullable=False)
    priority = db.Column(db.String(10), default='normal')  # high, normal, low
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AISavingsGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)
    target_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # active, completed, cancelled
    ai_recommendations = db.Column(db.JSON, nullable=True)

class AIBudgetRecommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    month = db.Column(db.String(7), nullable=False)  # YYYY-MM
    recommendations = db.Column(db.JSON, nullable=False)
    applied = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AIInsight(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # trend, alert, tip, positive, negative
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


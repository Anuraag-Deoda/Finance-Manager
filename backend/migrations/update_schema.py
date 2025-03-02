from flask import Flask
from models import db, User, Family, FamilyMember, Category, Transaction, MonthlyPlan
import os

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance_tracker.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def update_schema():
    app = create_app()
    with app.app_context():
        # Drop existing tables
        db.drop_all()
        
        # Create new tables with updated schema
        db.create_all()
        
        print("Database schema updated successfully!")

if __name__ == '__main__':
    update_schema() 
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, User, Family, FamilyMember, Category, Transaction, MonthlyPlan
from flask import Flask
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app

def update_schema():
    app = create_app()
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("Dropped all existing tables")

        # Create all tables with the new schema
        db.create_all()
        print("Created all tables with the new schema")

if __name__ == '__main__':
    update_schema()
    print("Database schema update completed successfully!") 
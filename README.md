# Family Finance Manager

A comprehensive family finance tracking application built with React (frontend) and Flask (backend). Track expenses, incomes, and plan monthly budgets for your entire family.

## Features

### 1. Core Financial Management
- **Multi-account Income & Expense Tracking**
  - Categorized transactions
  - Family member association
  - Recurring transaction support
  - Detailed transaction history
  - AI-powered transaction categorization

### 2. User Management
- **Family System**
  - Create and manage family groups
  - Invite family members
  - Role-based access control
  - Profile management with image upload

### 3. Dashboard Visualizations
- **Income vs Expenses Timeline**
  - Interactive line charts using Recharts
  - Daily, weekly, monthly, and yearly views
  
- **Category Distribution**
  - Pie charts showing expense distribution
  - Color-coded categories with icons
  
- **Family Member Analysis**
  - Individual spending patterns
  - Income contribution tracking
  
- **Daily Patterns**
  - Average spending by day of week
  - Spending trend analysis

### 4. Monthly Budget Planner
- **Budget Setting**
  - Expected income and expense planning
  - Category-wise budget allocation
  - Family member budget assignment
  
- **Progress Tracking**
  - Real-time budget vs actual comparison
  - Visual progress indicators
  - Variance analysis

### 5. Data Management
- **Filtering & Search**
  - Multi-criteria search
  - Date range filtering
  - Category and family member filters
  
- **Grouping Options**
  - Group by category
  - Group by date
  - Group by family member

## Technologies Used

### Frontend
- **Framework**
  - React 18.2.0
  - Vite.js (build tool)

- **UI Components & Styling**
  - TailwindCSS
  - Lucide React (icons)
  - Custom components

- **State Management**
  - React Hooks
  - Context API
  - Local Storage

- **Data Visualization**
  - Recharts library

### Backend
- **Framework**
  - Flask
  - SQLAlchemy (ORM)
  - Flask-JWT-Extended (Authentication)
  - Flask-Mail (Email notifications)

- **Database**
  - SQLite (development)
  - PostgreSQL (production)

- **AI Integration**
  - Custom AI routes for transaction analysis
  - Category prediction

## Project Structure

### Frontend
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── redux/              # State management
│   ├── services/           # API services
│   └── utils/              # Helper functions
├── public/                 # Static assets
└── package.json           # Dependencies
```

### Backend
```
backend/
├── ai/                    # AI-related functionality
├── routes/                # API route handlers
├── static/               # Static files & uploads
├── app.py               # Main application file
├── config.py            # Configuration
├── models.py            # Database models
└── requirements.txt     # Python dependencies
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Git

### Backend Setup
1. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables
```bash
cp .env.template .env
# Edit .env with your configurations
```

4. Initialize database
```bash
flask db upgrade
```

5. Run development server
```bash
flask run
```

### Frontend Setup
1. Install dependencies
```bash
cd frontend
npm install
```

2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. Run development server
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout

### User Management
- GET `/api/user/profile` - Get user profile
- PUT `/api/user/profile` - Update user profile
- POST `/api/user/profile/image` - Upload profile image

### Family Management
- POST `/api/family/create` - Create new family
- POST `/api/family/invite` - Invite member
- POST `/api/family/join` - Join family
- GET `/api/family/members` - List family members

### Transactions
- GET `/api/transactions` - List transactions
- POST `/api/transactions` - Add transaction
- PUT `/api/transactions/<id>` - Update transaction
- DELETE `/api/transactions/<id>` - Delete transaction

### Monthly Plans
- GET `/api/monthly-plans/<month>` - Get monthly plan
- POST `/api/monthly-plans/<month>` - Save monthly plan

### Categories
- GET `/api/categories` - List categories
- POST `/api/categories` - Add category
- PUT `/api/categories/<id>` - Update category
- DELETE `/api/categories/<id>` - Delete category

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# Family Finance Manager

A comprehensive family finance tracking application built with React and modern web technologies. Track expenses, incomes, and plan monthly budgets for your entire family.

## Features

### 1. Core Financial Management
- **Multi-account Income & Expense Tracking**
  - Categorized transactions
  - Family member association
  - Recurring transaction support
  - Detailed transaction history

### 2. Dashboard Visualizations
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

### 3. Monthly Budget Planner
- **Budget Setting**
  - Expected income and expense planning
  - Category-wise budget allocation
  - Family member budget assignment
  
- **Progress Tracking**
  - Real-time budget vs actual comparison
  - Visual progress indicators
  - Variance analysis

### 4. Data Management
- **Filtering & Search**
  - Multi-criteria search
  - Date range filtering
  - Category and family member filters
  
- **Grouping Options**
  - Group by category
  - Group by date
  - Group by family member

## Technologies Used

### Frontend Framework
- React 18.2.0
- Vite.js (build tool)

### UI Components & Styling
- TailwindCSS - Utility-first CSS framework
- Lucide React - Icon library
- Custom components with modern design principles

### Data Visualization
- Recharts - Composable charting library
  - Line Charts
  - Bar Charts
  - Pie Charts
  - Composed Charts

### State Management
- React Hooks
- Context API for global state
- Local Storage for data persistence

### Data Processing
- Memoized calculations using useMemo
- Date manipulation
- Number formatting

## Project Structure

```
src/
├── components/
│   ├── FinanceManager.jsx    # Main component
│   ├── MonthPlanner.jsx      # Budget planning
│   ├── Login.jsx             # Authentication
│   └── Register.jsx          # User registration
├── utils/
│   └── constants.js          # Configuration & constants
├── services/
│   └── api.js               # API service layer
├── contexts/
│   └── AuthContext.jsx      # Authentication context
└── App.jsx                  # Root component
```

## Development Process

### Phase 1: Core Setup
1. Project initialization with Vite
2. TailwindCSS setup and configuration
3. Basic component structure

### Phase 2: Features Implementation
1. Transaction management
2. Data visualization
3. Monthly planning
4. Search and filtering

### Phase 3: UI/UX Refinement
1. Responsive design
2. Interactive animations
3. Error handling
4. Loading states

## Getting Started

1. Clone the repository
```bash
git clone <repository-url>
```

2. Install dependencies
```bash
npm install
```

3. Run development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Design Decisions

### 1. Component Architecture
- Modular components for maintainability
- Separation of concerns between data and presentation
- Reusable utility functions

### 2. State Management
- Component-level state for UI interactions
- Context for global state (auth, theme)
- Local storage for data persistence

### 3. Performance Optimization
- Memoized calculations
- Lazy loading of components
- Efficient re-rendering strategies

## Key Features Implementation

### Transaction Management
```javascript
const handleAddTransaction = async () => {
  // Validation
  const errors = validateTransaction(newTransaction);
  if (Object.keys(errors).length > 0) return;

  // Processing
  const transactionToAdd = {
    ...newTransaction,
    id: Date.now(),
    amount: parseFloat(newTransaction.amount),
  };

  // State update
  setTransactions(prev => [...prev, transactionToAdd]);
};
```

### Data Visualization
```javascript
const prepareCategoryData = useMemo(() => {
  const categoryTotals = {};
  getFilteredTransactions
    .filter(t => t.type === TRANSACTION_TYPES.EXPENSE)
    .forEach(t => {
      categoryTotals[t.category] = 
        (categoryTotals[t.category] || 0) + parseFloat(t.amount);
    });

  return Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      color: categories[name]?.primary || "#8E8E93",
    }));
}, [getFilteredTransactions]);
```

### Budget Planning
```javascript
const calculateTotals = useMemo(() => {
  const expected = {
    income: monthPlan.expectedIncome.reduce((sum, item) => 
      sum + parseFloat(item.amount), 0),
    expenses: monthPlan.expectedExpenses.reduce((sum, item) => 
      sum + parseFloat(item.amount), 0)
  };
  
  return { expected, actual, variance };
}, [monthPlan, actualTransactions]);
```

## Future Improvements

1. **Enhanced Features**
   - Multi-currency support
   - Receipt scanning
   - Export functionality
   - Advanced reports

2. **Technical Improvements**
   - Unit testing implementation
   - Performance optimization
   - PWA capabilities
   - Offline support

3. **UI/UX Enhancements**
   - Dark mode
   - Custom themes
   - More visualization options
   - Mobile responsiveness improvements 
   
#Finance-Manager
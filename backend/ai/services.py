from typing import List, Dict, Any, Optional
import os
from datetime import datetime, timedelta
import numpy as np
from sklearn.preprocessing import StandardScaler
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv

from .config import (
    OPENAI_MODEL, OPENAI_TEMPERATURE, NEEDS_CATEGORIES, WANTS_CATEGORIES,
    SAVINGS_CATEGORIES, BUDGET_RULES, UNUSUAL_TRANSACTION_THRESHOLD,
    MIN_MONTHS_FOR_PREDICTION, PREDICTION_MONTHS_AHEAD, FAMILY_MEMBER_WEIGHTS,
    CHAT_SYSTEM_PROMPT, DEFAULT_SAVINGS_PERCENTAGE, AGGRESSIVE_SAVINGS_PERCENTAGE,
    CONSERVATIVE_SAVINGS_PERCENTAGE
)

load_dotenv()

class AIFinanceService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name=OPENAI_MODEL,
            temperature=OPENAI_TEMPERATURE,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.scaler = StandardScaler()

    def analyze_spending_patterns(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze spending patterns using ML and AI."""
        # Extract amounts and dates
        amounts = [t['amount'] for t in transactions]
        dates = [datetime.strptime(t['date'], '%Y-%m-%d') for t in transactions]
        categories = [t['category'] for t in transactions]

        # Basic statistical analysis
        total_spent = sum(amounts)
        avg_per_transaction = np.mean(amounts)
        category_totals = {}
        
        for amount, category in zip(amounts, categories):
            category_totals[category] = category_totals.get(category, 0) + amount

        # Identify unusual transactions using configured threshold
        scaled_amounts = self.scaler.fit_transform(np.array(amounts).reshape(-1, 1))
        unusual_indices = np.where(abs(scaled_amounts) > UNUSUAL_TRANSACTION_THRESHOLD)[0]
        unusual_transactions = [transactions[i] for i in unusual_indices]

        return {
            'total_spent': total_spent,
            'average_per_transaction': avg_per_transaction,
            'category_breakdown': category_totals,
            'unusual_transactions': unusual_transactions
        }

    async def get_ai_chat_response(self, user_message: str, context: Dict[str, Any]) -> str:
        """Get AI response using LangChain."""
        prompt = ChatPromptTemplate.from_messages([
            ("system", CHAT_SYSTEM_PROMPT),
            ("user", "{user_message}\n\nContext: {context}")
        ])

        chain = prompt | self.llm | StrOutputParser()
        response = await chain.ainvoke({
            "user_message": user_message,
            "context": str(context)
        })
        return response

    def generate_budget_recommendations(self, income: float, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate smart budget recommendations."""
        total_expenses = sum(e['amount'] for e in expenses)
        savings_rate = (income - total_expenses) / income

        # Calculate category percentages using configured categories
        category_expenses = {}
        for expense in expenses:
            category = expense['category']
            amount = expense['amount']
            category_expenses[category] = category_expenses.get(category, 0) + amount

        # Calculate current allocations using configured categories
        current_allocations = {
            'needs': sum(category_expenses.get(cat, 0) for cat in NEEDS_CATEGORIES) / income,
            'wants': sum(category_expenses.get(cat, 0) for cat in WANTS_CATEGORIES) / income,
            'savings': sum(category_expenses.get(cat, 0) for cat in SAVINGS_CATEGORIES) / income
        }

        recommendations = {
            'current_allocations': current_allocations,
            'recommended_allocations': BUDGET_RULES,
            'specific_recommendations': []
        }

        # Generate specific recommendations based on budget rules
        if current_allocations['needs'] > BUDGET_RULES['needs_percentage']:
            recommendations['specific_recommendations'].append({
                'category': 'Needs',
                'message': f'Your essential expenses are {current_allocations["needs"]*100:.1f}% of income. '
                          f'Try to reduce them to {BUDGET_RULES["needs_percentage"]*100}% by finding cheaper alternatives.'
            })

        if current_allocations['wants'] > BUDGET_RULES['wants_percentage']:
            recommendations['specific_recommendations'].append({
                'category': 'Wants',
                'message': f'Your discretionary spending is {current_allocations["wants"]*100:.1f}% of income. '
                          f'Consider reducing it to {BUDGET_RULES["wants_percentage"]*100}% to increase savings.'
            })

        if current_allocations['savings'] < BUDGET_RULES['savings_percentage']:
            recommendations['specific_recommendations'].append({
                'category': 'Savings',
                'message': f'Your savings rate is {current_allocations["savings"]*100:.1f}%. '
                          f'Try to increase it to {BUDGET_RULES["savings_percentage"]*100}% by reducing discretionary spending.'
            })

        return recommendations

    def predict_future_expenses(self, historical_transactions: List[Dict[str, Any]], months_ahead: int = PREDICTION_MONTHS_AHEAD) -> Dict[str, Any]:
        """Predict future expenses using simple time series analysis."""
        # Group transactions by category and month
        category_monthly_totals = {}
        
        for transaction in historical_transactions:
            date = datetime.strptime(transaction['date'], '%Y-%m-%d')
            month_key = f"{date.year}-{date.month}"
            category = transaction['category']
            
            if category not in category_monthly_totals:
                category_monthly_totals[category] = {}
            
            if month_key not in category_monthly_totals[category]:
                category_monthly_totals[category][month_key] = 0
                
            category_monthly_totals[category][month_key] += transaction['amount']

        # Calculate trends and make predictions
        predictions = {}
        for category, monthly_data in category_monthly_totals.items():
            amounts = list(monthly_data.values())
            if len(amounts) >= MIN_MONTHS_FOR_PREDICTION:
                trend = np.polyfit(range(len(amounts)), amounts, 1)[0]  # Linear trend
                last_amount = amounts[-1]
                
                predictions[category] = {
                    'current_monthly': last_amount,
                    'trend': trend,
                    'predicted_next_months': [
                        max(0, last_amount + trend * i) for i in range(1, months_ahead + 1)
                    ]
                }

        return predictions

    def optimize_family_budget(self, family_members: List[Dict[str, Any]], total_budget: float) -> Dict[str, Any]:
        """Optimize budget allocation for family members."""
        # Calculate weights based on member attributes using configured weights
        member_weights = {}
        total_weight = 0
        
        for member in family_members:
            weight = 1.0  # Base weight
            
            # Apply configured weights based on role
            if member.get('role') == 'primary_earner':
                weight *= FAMILY_MEMBER_WEIGHTS['primary_earner']
            elif member.get('role') == 'dependent':
                weight *= FAMILY_MEMBER_WEIGHTS['dependent']
                
            # Apply special needs weight if applicable
            if member.get('special_needs'):
                weight *= FAMILY_MEMBER_WEIGHTS['special_needs']
                
            member_weights[member['id']] = weight
            total_weight += weight

        # Calculate allocations
        allocations = {}
        for member_id, weight in member_weights.items():
            allocation = (weight / total_weight) * total_budget
            allocations[member_id] = round(allocation, 2)

        return {
            'allocations': allocations,
            'explanation': {
                'weights': member_weights,
                'total_budget': total_budget
            }
        }

    def generate_savings_plan(self, goal_amount: float, current_savings: float, 
                            monthly_income: float, monthly_expenses: float,
                            target_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Generate a personalized savings plan."""
        available_monthly = monthly_income - monthly_expenses
        amount_needed = goal_amount - current_savings

        if target_date:
            months_until_target = (target_date - datetime.now()).days / 30
            required_monthly = amount_needed / months_until_target
            is_feasible = required_monthly <= available_monthly
            
            # Determine appropriate savings rate based on timeline
            if months_until_target < 12:  # Short-term goal
                suggested_rate = AGGRESSIVE_SAVINGS_PERCENTAGE
            elif months_until_target > 36:  # Long-term goal
                suggested_rate = CONSERVATIVE_SAVINGS_PERCENTAGE
            else:  # Medium-term goal
                suggested_rate = DEFAULT_SAVINGS_PERCENTAGE
        else:
            required_monthly = available_monthly * DEFAULT_SAVINGS_PERCENTAGE
            months_until_target = amount_needed / required_monthly
            is_feasible = True
            suggested_rate = DEFAULT_SAVINGS_PERCENTAGE

        # Generate recommendations for increasing savings
        recommendations = []
        if not is_feasible:
            potential_savings = self._find_potential_savings(monthly_expenses)
            recommendations.extend(potential_savings)

        return {
            'current_savings': current_savings,
            'goal_amount': goal_amount,
            'required_monthly_savings': required_monthly,
            'suggested_savings_rate': suggested_rate,
            'is_feasible': is_feasible,
            'months_to_goal': months_until_target,
            'recommendations': recommendations
        }

    def _find_potential_savings(self, monthly_expenses: float) -> List[Dict[str, Any]]:
        """Find potential areas for savings."""
        # This would be more sophisticated in production
        return [
            {
                'category': 'Subscriptions',
                'potential_savings': monthly_expenses * 0.05,
                'suggestion': 'Review and cancel unused subscriptions'
            },
            {
                'category': 'Dining Out',
                'potential_savings': monthly_expenses * 0.1,
                'suggestion': 'Cook more meals at home'
            },
            {
                'category': 'Utilities',
                'potential_savings': monthly_expenses * 0.03,
                'suggestion': 'Implement energy-saving measures'
            }
        ] 
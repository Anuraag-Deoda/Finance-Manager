/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  PlusCircle,
  MinusCircle,
  Calendar,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  categories,
  incomeCategories,
  familyMembers,
  TRANSACTION_TYPES,
} from "../utils/constants";

const MonthPlanner = ({ selectedMonth, actualTransactions, onSavePlan }) => {
  // Core state management
  const [monthPlan, setMonthPlan] = useState({
    expectedIncome: [],
    expectedExpenses: [],
    notes: "",
  });
  // Also add initial load effect
  useEffect(() => {
    // Load saved plan when month changes
    const loadSavedPlan = () => {
      try {
        const savedPlans = JSON.parse(
          localStorage.getItem("monthlyPlans") || "{}"
        );
        const savedPlan = savedPlans[selectedMonth];

        if (savedPlan) {
          setMonthPlan({
            expectedIncome: savedPlan.expectedIncome || [],
            expectedExpenses: savedPlan.expectedExpenses || [],
            notes: savedPlan.notes || "",
          });
        }
      } catch (error) {
        console.error("Error loading saved plan:", error);
      }
    };

    loadSavedPlan();
  }, [selectedMonth]);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newEntry, setNewEntry] = useState({
    category: "",
    amount: "",
    description: "",
    familyMember: "",
  });

  // Utility function for currency formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleNotesChange = (e) => {
    const updatedPlan = {
      ...monthPlan,
      notes: e.target.value,
    };

    setMonthPlan(updatedPlan);

    // Save to localStorage immediately after update
    onSavePlan({
      month: selectedMonth,
      ...updatedPlan,
    });
  };
  // Entry management functions
  const handleAddEntry = (type) => {
    if (!newEntry.category || !newEntry.amount || !newEntry.familyMember)
      return;

    let updatedPlan;
    if (type === TRANSACTION_TYPES.INCOME) {
      updatedPlan = {
        ...monthPlan,
        expectedIncome: [
          ...monthPlan.expectedIncome,
          { ...newEntry, id: Date.now() },
        ],
      };
      setMonthPlan(updatedPlan);
      setShowAddIncome(false);
    } else {
      updatedPlan = {
        ...monthPlan,
        expectedExpenses: [
          ...monthPlan.expectedExpenses,
          { ...newEntry, id: Date.now() },
        ],
      };
      setMonthPlan(updatedPlan);
      setShowAddExpense(false);
    }

    // Save to localStorage immediately after update
    onSavePlan({
      month: selectedMonth,
      ...updatedPlan,
    });

    setNewEntry({
      category: "",
      amount: "",
      description: "",
      familyMember: "",
    });
  };

  const removeEntry = (id, type) => {
    let updatedPlan;
    if (type === TRANSACTION_TYPES.INCOME) {
      updatedPlan = {
        ...monthPlan,
        expectedIncome: monthPlan.expectedIncome.filter(
          (entry) => entry.id !== id
        ),
      };
    } else {
      updatedPlan = {
        ...monthPlan,
        expectedExpenses: monthPlan.expectedExpenses.filter(
          (entry) => entry.id !== id
        ),
      };
    }

    setMonthPlan(updatedPlan);

    // Save to localStorage immediately after update
    onSavePlan({
      month: selectedMonth,
      ...updatedPlan,
    });
  };
  // Add this effect in MonthPlanner component
  // useEffect(() => {
  //   // Save whenever monthPlan changes
  //   onSavePlan({
  //     month: selectedMonth,
  //     expectedIncome: monthPlan.expectedIncome,
  //     expectedExpenses: monthPlan.expectedExpenses,
  //     notes: monthPlan.notes,
  //   });
  // }, [monthPlan, onSavePlan, selectedMonth]);

  // Also add initial load effect
  useEffect(() => {
    // Load saved plan when month changes
    const loadSavedPlan = () => {
      try {
        const savedPlans = JSON.parse(
          localStorage.getItem("monthlyPlans") || "{}"
        );
        const savedPlan = savedPlans[selectedMonth];

        if (savedPlan) {
          setMonthPlan({
            expectedIncome: savedPlan.expectedIncome || [],
            expectedExpenses: savedPlan.expectedExpenses || [],
            notes: savedPlan.notes || "",
          });
        }
      } catch (error) {
        console.error("Error loading saved plan:", error);
      }
    };

    loadSavedPlan();
  }, [selectedMonth]);

  // Calculation functions
  const calculateTotals = useMemo(() => {
    const expected = {
      income: monthPlan.expectedIncome.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      ),
      expenses: monthPlan.expectedExpenses.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      ),
    };

    const actual = {
      income: actualTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      expenses: actualTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    };

    return {
      expected,
      actual,
      variance: {
        income: actual.income - expected.income,
        expenses: actual.expenses - expected.expenses,
      },
    };
  }, [monthPlan, actualTransactions]);

  // Data preparation for visualizations
  const prepareComparisonData = useMemo(() => {
    const categoryData = {};

    // Expected expenses
    monthPlan.expectedExpenses.forEach((expense) => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = {
          category: expense.category,
          expected: 0,
          actual: 0,
        };
      }
      categoryData[expense.category].expected += parseFloat(expense.amount);
    });

    // Actual expenses
    actualTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .forEach((expense) => {
        if (!categoryData[expense.category]) {
          categoryData[expense.category] = {
            category: expense.category,
            expected: 0,
            actual: 0,
          };
        }
        categoryData[expense.category].actual += parseFloat(expense.amount);
      });

    return Object.values(categoryData);
  }, [monthPlan.expectedExpenses, actualTransactions]);

  const prepareFamilyBudgetData = useMemo(() => {
    return familyMembers.map((member) => {
      const expectedExpenses = monthPlan.expectedExpenses
        .filter((e) => e.familyMember === member.name)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const actualExpenses = actualTransactions
        .filter(
          (t) =>
            t.familyMember === member.name &&
            t.type === TRANSACTION_TYPES.EXPENSE
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        name: member.name,
        icon: member.icon,
        expected: expectedExpenses,
        actual: actualExpenses,
        variance: actualExpenses - expectedExpenses,
      };
    });
  }, [monthPlan.expectedExpenses, actualTransactions]);

  const prepareSavingsProjection = useMemo(() => {
    const projectedSavings =
      calculateTotals.expected.income - calculateTotals.expected.expenses;
    const actualSavings =
      calculateTotals.actual.income - calculateTotals.actual.expenses;
    const savingsGoal = calculateTotals.expected.income * 0.2; // 20% of expected income

    return {
      projected: projectedSavings,
      actual: actualSavings,
      goal: savingsGoal,
      progress: (actualSavings / savingsGoal) * 100,
    };
  }, [calculateTotals]);

  // Income vs Expense Timeline
  const prepareMonthlyTimeline = useMemo(() => {
    const dates = [
      ...new Set([
        ...monthPlan.expectedExpenses.map((e) => e.date),
        ...actualTransactions.map((t) => t.date),
      ]),
    ].sort();

    return dates.map((date) => ({
      date,
      expectedExpense: monthPlan.expectedExpenses
        .filter((e) => e.date === date)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
      actualExpense: actualTransactions
        .filter((t) => t.date === date && t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      expectedIncome: monthPlan.expectedIncome
        .filter((e) => e.date === date)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
      actualIncome: actualTransactions
        .filter((t) => t.date === date && t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    }));
  }, [monthPlan, actualTransactions]);

  // Family Member Budget Distribution
  const prepareFamilyDistribution = useMemo(() => {
    return familyMembers.map((member) => {
      const expectedTotal = monthPlan.expectedExpenses
        .filter((e) => e.familyMember === member.name)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const actualTotal = actualTransactions
        .filter(
          (t) =>
            t.familyMember === member.name &&
            t.type === TRANSACTION_TYPES.EXPENSE
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        name: member.name,
        icon: member.icon,
        expected: expectedTotal,
        actual: actualTotal,
        variance: actualTotal - expectedTotal,
        percentage: (actualTotal / expectedTotal) * 100 || 0,
      };
    });
  }, [monthPlan.expectedExpenses, actualTransactions]);

  // Category Wise Progress
  const prepareCategoryProgress = useMemo(() => {
    const categories = {};

    monthPlan.expectedExpenses.forEach((expense) => {
      if (!categories[expense.category]) {
        categories[expense.category] = {
          category: expense.category,
          expected: 0,
          actual: 0,
          icon: categories[expense.category]?.icon,
        };
      }
      categories[expense.category].expected += parseFloat(expense.amount);
    });

    actualTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .forEach((transaction) => {
        if (!categories[transaction.category]) {
          categories[transaction.category] = {
            category: transaction.category,
            expected: 0,
            actual: 0,
            icon: categories[transaction.category]?.icon,
          };
        }
        categories[transaction.category].actual += parseFloat(
          transaction.amount
        );
      });

    return Object.values(categories).map((cat) => ({
      ...cat,
      progress: (cat.actual / cat.expected) * 100 || 0,
    }));
  }, [monthPlan.expectedExpenses, actualTransactions]);

  // Daily Budget Progress
  const prepareDailyProgress = useMemo(() => {
    const daysInMonth = new Date(
      selectedMonth.slice(0, 4),
      selectedMonth.slice(5, 7),
      0
    ).getDate();
    const dailyBudget = calculateTotals.expected.expenses / daysInMonth;

    const dailySpending = {};
    actualTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .forEach((transaction) => {
        const day = new Date(transaction.date).getDate();
        dailySpending[day] =
          (dailySpending[day] || 0) + parseFloat(transaction.amount);
      });

    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      budget: dailyBudget,
      actual: dailySpending[i + 1] || 0,
      variance: (dailySpending[i + 1] || 0) - dailyBudget,
    }));
  }, [selectedMonth, calculateTotals.expected.expenses, actualTransactions]);
  // ... previous MonthPlanner code ...

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Expected Balance Card */}
        <div className="group bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Expected Balance
              </h3>
              <div className="p-2 bg-blue-100 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(
                calculateTotals.expected.income -
                  calculateTotals.expected.expenses
              )}
            </p>
            <p className="text-sm text-gray-500">Monthly Target</p>
          </div>
        </div>

        {/* Budget Variance Card */}
        <div className="group bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Budget Variance
              </h3>
              <div className="p-2 rounded-xl bg-purple-100">
                {calculateTotals.variance.expenses > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>
            <p
              className={`text-3xl font-bold mb-1 ${
                calculateTotals.variance.expenses > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatCurrency(Math.abs(calculateTotals.variance.expenses))}
            </p>
            <p className="text-sm text-gray-500">
              {calculateTotals.variance.expenses > 0
                ? "Over Budget"
                : "Under Budget"}
            </p>
          </div>
        </div>

        {/* Savings Progress Card */}
        <div className="group bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Savings Progress
              </h3>
              <div className="p-2 bg-green-100 rounded-xl">
                <ArrowRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(prepareSavingsProjection.actual)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(prepareSavingsProjection.progress, 100)}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {prepareSavingsProjection.progress.toFixed(1)}% of Goal (
              {formatCurrency(prepareSavingsProjection.goal)})
            </p>
          </div>
        </div>
      </div>

      {/* Daily Budget Progress */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Daily Budget Progress
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prepareDailyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#94a3b8"
                name="Daily Budget"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#60a5fa"
                name="Actual Spending"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Family Budget Distribution */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Family Budget Distribution
        </h3>
        <div className="space-y-4">
          {prepareFamilyDistribution.map((member) => (
            <div key={member.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{member.icon}</span>
                  <span className="font-medium">{member.name}</span>
                </div>
                <span
                  className={
                    member.variance > 0 ? "text-red-500" : "text-green-500"
                  }
                >
                  {formatCurrency(member.actual)} /{" "}
                  {formatCurrency(member.expected)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    member.percentage > 100 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(member.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Category Progress
        </h3>
        <div className="space-y-4">
          {prepareCategoryProgress.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="font-medium">{category.category}</span>
                </div>
                <span
                  className={
                    category.progress > 100 ? "text-red-500" : "text-green-500"
                  }
                >
                  {category.progress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    category.progress > 100 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(category.progress, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Comparison Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Budget vs Actual by Category
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prepareComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="expected" name="Expected" fill="#94a3b8" />
              <Bar dataKey="actual" name="Actual" fill="#60a5fa" />
              <Line
                type="monotone"
                dataKey="actual"
                name="Trend"
                stroke="#7c3aed"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expected Income Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Expected Income
          </h3>
          <button
            onClick={() => setShowAddIncome(!showAddIncome)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <PlusCircle className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        {showAddIncome && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-4">
            <select
              value={newEntry.category}
              onChange={(e) =>
                setNewEntry({ ...newEntry, category: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {Object.entries(incomeCategories).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {key}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={newEntry.amount}
              onChange={(e) =>
                setNewEntry({ ...newEntry, amount: e.target.value })
              }
              placeholder="Amount"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={newEntry.familyMember}
              onChange={(e) =>
                setNewEntry({ ...newEntry, familyMember: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Family Member</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.icon} {member.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleAddEntry(TRANSACTION_TYPES.INCOME)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
            >
              Add Expected Income
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {monthPlan.expectedIncome.map((income) => (
            <div
              key={income.id}
              className="py-4 group hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    {incomeCategories[income.category]?.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {income.category}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {income.familyMember}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-green-600">
                    {formatCurrency(income.amount)}
                  </span>
                  <button
                    onClick={() =>
                      removeEntry(income.id, TRANSACTION_TYPES.INCOME)
                    }
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-full transition-all duration-200"
                  >
                    <MinusCircle className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Expenses Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Expected Expenses
          </h3>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <PlusCircle className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        {showAddExpense && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-4">
            <select
              value={newEntry.category}
              onChange={(e) =>
                setNewEntry({ ...newEntry, category: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {Object.entries(categories).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {key}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={newEntry.amount}
              onChange={(e) =>
                setNewEntry({ ...newEntry, amount: e.target.value })
              }
              placeholder="Amount"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={newEntry.familyMember}
              onChange={(e) =>
                setNewEntry({ ...newEntry, familyMember: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Family Member</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.icon} {member.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleAddEntry(TRANSACTION_TYPES.EXPENSE)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
            >
              Add Expected Expense
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {monthPlan.expectedExpenses.map((expense) => (
            <div
              key={expense.id}
              className="py-4 group hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-100">
                    {categories[expense.category]?.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {expense.category}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {expense.familyMember}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-red-600">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() =>
                      removeEntry(expense.id, TRANSACTION_TYPES.EXPENSE)
                    }
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-full transition-all duration-200"
                  >
                    <MinusCircle className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Notes
        </h3>
        <textarea
          value={monthPlan.notes}
          onChange={handleNotesChange} // Use the new handler
          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
          placeholder="Add any notes or reminders for this month's budget..."
        />
      </div>
    </div>
  );
};

export default MonthPlanner;

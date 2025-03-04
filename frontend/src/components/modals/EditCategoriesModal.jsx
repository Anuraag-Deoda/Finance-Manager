import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { categories as predefinedExpenseCategories, incomeCategories as predefinedIncomeCategories } from '../../utils/constants';
import { toast } from 'react-hot-toast';

const EditCategoriesModal = ({ show, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense',
    icon: '📊',
    color: '#94A3B8',
    description: '',
    suggested_limit: 0
  });

  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      // First try to get custom categories from the API
      const response = await api.categories.getCategories();
      
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
      } else {
        // If no custom categories, use the predefined ones
        const predefinedCategories = [];
        
        // Convert expense categories
        Object.entries(predefinedExpenseCategories).forEach(([name, details]) => {
          predefinedCategories.push({
            id: `expense-${name}`,
            name,
            type: 'expense',
            icon: details.icon,
            color: details.primary,
            description: details.description,
            suggested_limit: details.suggestedLimit * 100,
            is_predefined: true
          });
        });
        
        // Convert income categories
        Object.entries(predefinedIncomeCategories).forEach(([name, details]) => {
          predefinedCategories.push({
            id: `income-${name}`,
            name,
            type: 'income',
            icon: details.icon,
            color: details.primary,
            description: details.description,
            suggested_limit: 0,
            is_predefined: true
          });
        });
        
        setCategories(predefinedCategories);
      }
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      setError('Category name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.categories.createCategory(newCategory);
      setCategories([...categories, response.data]);
      setShowAddForm(false);
      setNewCategory({
        name: '',
        type: 'expense',
        icon: '📊',
        color: '#94A3B8',
        description: '',
        suggested_limit: 0
      });
      toast.success('Category added successfully');
    } catch (err) {
      setError('Failed to add category');
      console.error('Error adding category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingCategory.name) {
      setError('Category name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if it's a predefined category
      if (id.startsWith('expense-') || id.startsWith('income-')) {
        // For predefined categories, we create a new custom category
        const response = await api.categories.createCategory({
          ...editingCategory,
          is_predefined: false
        });
        
        setCategories(categories.map(cat => 
          cat.id === id ? { ...response.data } : cat
        ));
      } else {
        // For custom categories, we update them
        await api.categories.updateCategory(id, editingCategory);
        setCategories(categories.map(cat => 
          cat.id === id ? { ...cat, ...editingCategory } : cat
        ));
      }
      
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (err) {
      setError('Failed to update category');
      console.error('Error updating category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Check if it's a predefined category
      if (id.startsWith('expense-') || id.startsWith('income-')) {
        // For predefined categories, we just remove them from the UI
        setCategories(categories.filter(cat => cat.id !== id));
        toast.success('Category removed from list');
      } else {
        // For custom categories, we delete them from the API
        await api.categories.deleteCategory(id);
        setCategories(categories.filter(cat => cat.id !== id));
        toast.success('Category deleted successfully');
      }
    } catch (err) {
      setError('Failed to delete category');
      console.error('Error deleting category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Edit Categories</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Category List */}
          <div className="space-y-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200"
              >
                {editingCategory?.id === category.id ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({
                          ...editingCategory,
                          name: e.target.value
                        })}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Category name"
                      />
                      <input
                        type="text"
                        value={editingCategory.icon}
                        onChange={(e) => setEditingCategory({
                          ...editingCategory,
                          icon: e.target.value
                        })}
                        className="w-20 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Icon"
                      />
                      <input
                        type="color"
                        value={editingCategory.color}
                        onChange={(e) => setEditingCategory({
                          ...editingCategory,
                          color: e.target.value
                        })}
                        className="w-20 h-10 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateCategory(category.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Check size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                      >
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 hover:bg-red-100 rounded-xl transition-colors duration-200"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Category Form */}
          {showAddForm ? (
            <div className="mt-6 p-4 rounded-xl border border-gray-200 space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Category name"
                />
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-20 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Icon"
                />
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-20 h-10 rounded-xl border border-gray-200"
                />
              </div>
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description"
              />
              <input
                type="number"
                value={newCategory.suggested_limit}
                onChange={(e) => setNewCategory({ ...newCategory, suggested_limit: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Suggested limit (%)"
                min="0"
                max="100"
                step="0.1"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                >
                  <Check size={16} />
                  Add Category
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-6 w-full py-2 px-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add New Category
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCategoriesModal;
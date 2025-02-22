export const calculateDateRange = (rangeType) => {
    const today = new Date();
    const start = new Date();
    const end = new Date();
  
    switch (rangeType) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(today.getDate() - today.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'monthly':
        start.setDate(1);
        end.setMonth(start.getMonth() + 1, 0);
        break;
      case 'quarterly':
        start.setMonth(Math.floor(today.getMonth() / 3) * 3, 1);
        end.setMonth(start.getMonth() + 3, 0);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        end.setMonth(12, 0);
        break;
      default:
        break;
    }
  
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  
  export const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
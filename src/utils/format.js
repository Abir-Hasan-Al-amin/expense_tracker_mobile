const SYMBOL_MAP = {
  USD: '$', BDT: '৳', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: '$', AUD: '$',
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
  const symbol = SYMBOL_MAP[currencyCode] || currencyCode;
  const value = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
  const isNegative = value < 0;
  try {
    const number = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
    return `${isNegative ? '-' : ''}${symbol}${number}`;
  } catch {
    return `${isNegative ? '-' : ''}${symbol}${Math.abs(value)}`;
  }
};

export const formatDate = (date, options = {}) => {
  const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', { ...defaults, ...options });
};

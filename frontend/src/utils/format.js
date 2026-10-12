export const formatCurrency = (amount) => {
  if (!amount) return '₹ 0';
  const num = Number(amount);
  if (isNaN(num)) return '₹ 0';
  return `₹ ${num.toLocaleString('en-IN')}`;
};

export const CATEGORY_RULES = [
  { regex: /uber.*eats|doordash|grubhub|postmates/i, category: 'Dining', merchant: (m) => m.match(/uber.*eats/i) ? 'Uber Eats' : m.match(/doordash/i) ? 'DoorDash' : 'Food Delivery' },
  { regex: /uber|lyft/i, category: 'Transportation', merchant: (m) => m.match(/uber/i) ? 'Uber' : 'Lyft' },
  { regex: /amazon|amzn/i, category: 'Shopping', merchant: () => 'Amazon' },
  { regex: /netflix|spotify|hulu|disney\+|hbo/i, category: 'Entertainment', merchant: (m) => 'Streaming Service' },
  { regex: /whole foods|trader joe|safeway|kroger|aldi|walmart/i, category: 'Groceries', merchant: () => 'Grocery Store' },
  { regex: /shell|chevron|exxon|bp|arco/i, category: 'Gas', merchant: () => 'Gas Station' },
  { regex: /target/i, category: 'Shopping', merchant: () => 'Target' },
  { regex: /starbucks|dunkin|peet/i, category: 'Coffee', merchant: (m) => m.match(/starbucks/i) ? 'Starbucks' : 'Coffee Shop' },
  { regex: /gym|fitness|planet fitness|equinox/i, category: 'Health & Fitness', merchant: () => 'Gym' },
  { regex: /pharmacy|cvs|walgreens|rite aid/i, category: 'Medical', merchant: () => 'Pharmacy' },
  { regex: /t-mobile|verizon|at&t|sprint/i, category: 'Utilities', merchant: () => 'Telecom' },
  { regex: /pg&e|coned|water|electric/i, category: 'Utilities', merchant: () => 'Utility Company' },
  { regex: /zelle|venmo|cash app/i, category: 'Transfer', merchant: () => 'Peer-to-Peer Transfer' },
  { regex: /payroll|salary|direct dep/i, category: 'Salary', merchant: () => 'Employer' },
  { regex: /dividend|interest/i, category: 'Investments', merchant: () => 'Investment Income' },
];

export function categorizeTransaction(description) {
  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(description)) {
      return {
        category: rule.category,
        merchant: typeof rule.merchant === 'function' ? rule.merchant(description) : rule.merchant,
        confidence_score: 95
      };
    }
  }
  return {
    category: 'Uncategorized',
    merchant: description.substring(0, 30), // Fallback
    confidence_score: 50
  };
}

import { supabase } from './supabase';

/**
 * Fetch all monthly category budgets for the logged-in user.
 */
export async function fetchBudgets() {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    throw new Error(`Failed to load budgets: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Create or update the monthly budget for a category.
 */
export async function upsertBudget({ userId, category, amount }) {
  const value = Number(amount);
  if (!value || value <= 0) {
    throw new Error('Budget amount must be greater than 0.');
  }

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: userId,
        category,
        amount: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category' },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save budget: ${error.message}`);
  }

  return data;
}

/**
 * Remove the budget for a category.
 */
export async function deleteBudget(budgetId) {
  const { error } = await supabase.from('budgets').delete().eq('id', budgetId);

  if (error) {
    throw new Error(`Failed to delete budget: ${error.message}`);
  }
}

/**
 * Combine budgets with current-month debit spending per category.
 * Returns [{ id, category, amount, spent, remaining, percent, over }]
 */
export function getBudgetProgress(budgets, monthTransactions) {
  const spentByCategory = {};
  for (const t of monthTransactions) {
    if (t.direction !== 'debit') continue;
    const cat = t.category || 'Other';
    spentByCategory[cat] = (spentByCategory[cat] || 0) + Number(t.amount);
  }

  return budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0;
    const amount = Number(b.amount);
    const percent = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
    return {
      id: b.id,
      category: b.category,
      amount,
      spent,
      remaining: amount - spent,
      percent,
      over: spent > amount,
      near: spent <= amount && spent >= amount * 0.8,
    };
  });
}

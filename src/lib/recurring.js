import { supabase } from './supabase';

export const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateOnly(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Advance a due date by one period. Monthly/yearly clamp to the last
 * day of shorter months (e.g. Jan 31 → Feb 28).
 */
export function advanceDueDate(dateString, frequency) {
  const date = parseDateOnly(dateString);

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
    return toDateString(date);
  }

  const day = date.getDate();
  const monthsToAdd = frequency === 'yearly' ? 12 : 1;
  const target = new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  return toDateString(target);
}

/**
 * Fetch all recurring transaction rules for the logged-in user.
 */
export async function fetchRecurring() {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*, sources(id, name)')
    .order('next_due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to load recurring transactions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Create a recurring transaction rule.
 */
export async function createRecurring({
  userId,
  merchant,
  amount,
  category,
  direction,
  sourceId = null,
  frequency,
  nextDueDate,
}) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: userId,
      merchant: merchant.trim(),
      amount: Number(amount),
      category,
      direction,
      source_id: sourceId || null,
      frequency,
      next_due_date: nextDueDate,
    })
    .select('*, sources(id, name)')
    .single();

  if (error) {
    throw new Error(`Failed to create recurring transaction: ${error.message}`);
  }

  return data;
}

/**
 * Pause or resume a recurring rule.
 */
export async function setRecurringActive(id, active) {
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ active })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update recurring transaction: ${error.message}`);
  }
}

/**
 * Delete a recurring rule (already-created transactions are kept).
 */
export async function deleteRecurring(id) {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete recurring transaction: ${error.message}`);
  }
}

/**
 * Create transactions for every due occurrence of the user's active
 * recurring rules, advancing each rule's next_due_date past today.
 * Returns the number of transactions created.
 */
export async function processDueRecurring(userId) {
  const today = toDateString(new Date());

  const { data: due, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('active', true)
    .lte('next_due_date', today);

  if (error) {
    throw new Error(`Failed to check recurring transactions: ${error.message}`);
  }

  if (!due?.length) return 0;

  let created = 0;

  for (const rule of due) {
    const rows = [];
    let dueDate = rule.next_due_date;

    // Catch up on all missed occurrences (e.g. app not opened for months).
    while (dueDate <= today) {
      rows.push({
        user_id: userId,
        amount: Number(rule.amount),
        merchant: rule.merchant,
        category: rule.category,
        transaction_date: dueDate,
        image_url: null,
        direction: rule.direction,
        source_id: rule.source_id,
      });
      dueDate = advanceDueDate(dueDate, rule.frequency);
    }

    const { error: insertError } = await supabase
      .from('transactions')
      .insert(rows);

    if (insertError) {
      throw new Error(
        `Failed to create recurring transaction "${rule.merchant}": ${insertError.message}`,
      );
    }

    const { error: updateError } = await supabase
      .from('recurring_transactions')
      .update({ next_due_date: dueDate })
      .eq('id', rule.id);

    if (updateError) {
      throw new Error(
        `Failed to reschedule "${rule.merchant}": ${updateError.message}`,
      );
    }

    created += rows.length;
  }

  return created;
}

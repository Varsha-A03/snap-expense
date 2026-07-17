import { supabase } from './supabase';

/**
 * Must match your Supabase Storage bucket name exactly.
 * Override in .env.local: VITE_RECEIPTS_BUCKET=your-bucket-name
 */
const RECEIPTS_BUCKET =
  import.meta.env.VITE_RECEIPTS_BUCKET || 'receipts';

function getFileExtension(mimeType) {
  return mimeType === 'image/png' ? 'png' : 'jpg';
}

/**
 * Fetch all transactions for the logged-in user (RLS filters by user).
 * Sorted newest first.
 */
export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, sources(id, name)')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load transactions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Upload receipt image and insert a transaction row.
 */
export async function saveTransaction({
  file,
  userId,
  amount,
  merchant,
  category,
  transactionDate,
  direction = 'debit',
  sourceId = null,
}) {
  let imageUrl = null;

  if (file) {
    const ext = getFileExtension(file.type);
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload receipt (${RECEIPTS_BUCKET}): ${uploadError.message}`,
      );
    }

    imageUrl = filePath;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount: Number(amount),
      merchant: merchant.trim(),
      category,
      transaction_date: transactionDate,
      image_url: imageUrl,
      direction,
      source_id: sourceId || null,
    })
    .select('*, sources(id, name)')
    .single();

  if (error) {
    throw new Error(`Failed to save transaction: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing transaction's editable fields (receipt image unchanged).
 */
export async function updateTransaction({
  id,
  amount,
  merchant,
  category,
  transactionDate,
  direction,
  sourceId = null,
}) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount: Number(amount),
      merchant: merchant.trim(),
      category,
      transaction_date: transactionDate,
      direction,
      source_id: sourceId || null,
    })
    .eq('id', id)
    .select('*, sources(id, name)')
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return data;
}

/**
 * Delete a single transaction and its receipt image (if any).
 */
export async function deleteTransaction(transactionId, imagePath = null) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  if (imagePath) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([imagePath]);
  }
}

/**
 * Delete every transaction for the logged-in user (RLS-scoped) and clean up receipts.
 */
export async function clearAllTransactions() {
  const { data: rows, error: fetchError } = await supabase
    .from('transactions')
    .select('id, image_url');

  if (fetchError) {
    throw new Error(`Failed to load transactions: ${fetchError.message}`);
  }

  if (!rows?.length) return 0;

  const imagePaths = rows.map((row) => row.image_url).filter(Boolean);

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .in(
      'id',
      rows.map((row) => row.id),
    );

  if (deleteError) {
    throw new Error(`Failed to clear transactions: ${deleteError.message}`);
  }

  if (imagePaths.length) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove(imagePaths);
  }

  return rows.length;
}

/**
 * Get a temporary signed URL for a private receipt image.
 */
export async function getReceiptImageUrl(imagePath, expiresIn = 3600) {
  if (!imagePath) return null;

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(imagePath, expiresIn);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

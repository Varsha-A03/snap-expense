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

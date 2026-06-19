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
 * Upload receipt image and insert a transaction row.
 * @param {object} params
 * @param {File} [params.file] - Screenshot file from upload flow
 * @param {string} params.userId - Authenticated user's id
 * @param {number|string} params.amount
 * @param {string} params.merchant
 * @param {string} params.category
 * @param {string} params.transactionDate - YYYY-MM-DD
 */
export async function saveTransaction({
  file,
  userId,
  amount,
  merchant,
  category,
  transactionDate,
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save transaction: ${error.message}`);
  }

  return data;
}

/**
 * Get a temporary signed URL for a private receipt image.
 * @param {string} imagePath - Path stored in transactions.image_url
 * @param {number} expiresIn - Seconds until URL expires (default 1 hour)
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

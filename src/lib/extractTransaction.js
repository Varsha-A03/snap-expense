import { supabase } from './supabase';

/**
 * Convert a File to a raw base64 string (no data-URL prefix).
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image file.'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to encode image file.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Call the Supabase Edge Function to extract transaction details via Gemini Vision.
 * @param {File} file
 * @returns {Promise<{ amount: number, merchant: string, date: string }>}
 */
export async function extractTransaction(file) {
  const imageBase64 = await fileToBase64(file);

  const { data, error } = await supabase.functions.invoke('extract-transaction', {
    body: {
      imageBase64,
      mimeType: file.type,
    },
  });

  if (error) {
    throw new Error(error.message || 'Extraction request failed.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.data) {
    throw new Error('No transaction details were returned.');
  }

  return data.data;
}

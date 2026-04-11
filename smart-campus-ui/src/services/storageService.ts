import { supabase } from '@/lib/supabase';

const BUCKET = 'uploads';

/**
 * Upload a file to Supabase Storage.
 *
 * @param file - The file to upload
 * @param folder - Subfolder within the bucket (e.g. 'resources', 'tickets', 'avatars')
 * @returns The public URL of the uploaded file
 *
 * Usage:
 * ```ts
 * const url = await storageService.upload(file, 'resources');
 * // url = "https://xxx.supabase.co/storage/v1/object/public/uploads/resources/1712345678-image.png"
 * ```
 */
async function upload(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 *
 * @param publicUrl - The full public URL of the file
 *
 * Usage:
 * ```ts
 * await storageService.remove('https://xxx.supabase.co/storage/v1/object/public/uploads/resources/image.png');
 * ```
 */
async function remove(publicUrl: string): Promise<void> {
  const path = publicUrl.split(`/storage/v1/object/public/${BUCKET}/`)[1];
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export const storageService = { upload, remove };

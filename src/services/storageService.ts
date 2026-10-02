import { 
  supabase, 
  SUPABASE_STORAGE_BUCKET, 
  SUPABASE_STORAGE_URL, 
  SUPABASE_STORAGE_REGION 
} from '../lib/supabase';

export interface UploadResult {
  path: string;
  publicUrl: string;
  s3Url: string;
}

/**
 * Uploads a file (e.g., job attachment, candidate resume, document)
 * to the designated Supabase S3 Egress storage bucket (ap-northeast-1).
 */
export async function uploadJobAttachment(
  file: File | Blob,
  fileName: string,
  folder: string = 'attachments'
): Promise<UploadResult> {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(data.path);

    const s3Url = `${SUPABASE_STORAGE_URL}/${SUPABASE_STORAGE_BUCKET}/${data.path}`;

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl || s3Url,
      s3Url,
    };
  } catch (err: any) {
    console.error('Storage egress error:', err);
    throw err;
  }
}

/**
 * Retrieves public URL for any stored item in the ap-northeast-1 bucket
 */
export function getStoragePublicUrl(filePath: string): string {
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl || `${SUPABASE_STORAGE_URL}/${SUPABASE_STORAGE_BUCKET}/${filePath}`;
}

/**
 * Storage configuration metadata for egress
 */
export const storageConfig = {
  bucket: SUPABASE_STORAGE_BUCKET,
  region: SUPABASE_STORAGE_REGION,
  s3Endpoint: SUPABASE_STORAGE_URL,
};

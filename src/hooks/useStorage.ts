import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useStorage() {
  const [uploading, setUploading] = useState(false);

  // Upload document and return file path (not public URL)
  const uploadDocument = async (file: File, patientId: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Return file path, not public URL - will use signed URLs for viewing
      return fileName;
    } catch (err: any) {
      console.error('Error uploading document:', err);
      toast({
        title: 'خطا در آپلود',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Upload receipt and return file path (not public URL)
  const uploadReceipt = async (file: File, patientId: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Return file path, not public URL - will use signed URLs for viewing
      return fileName;
    } catch (err: any) {
      console.error('Error uploading receipt:', err);
      toast({
        title: 'خطا در آپلود فیش',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Get signed URL for viewing files (1 hour expiry)
  const getSignedUrl = async (bucket: string, path: string): Promise<string | null> => {
    try {
      // Skip if path is already a full URL (blob: or http:)
      if (path.startsWith('blob:') || path.startsWith('http')) {
        return path;
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (err: any) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting file:', err);
      return false;
    }
  };

  return {
    uploading,
    uploadDocument,
    uploadReceipt,
    getSignedUrl,
    deleteFile,
  };
}

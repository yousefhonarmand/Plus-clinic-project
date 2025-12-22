import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useStorage() {
  const [uploading, setUploading] = useState(false);

  const uploadDocument = async (file: File, patientId: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('patient-documents')
        .getPublicUrl(fileName);

      return publicUrl;
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

  const uploadReceipt = async (file: File, patientId: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      return publicUrl;
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
    deleteFile,
  };
}

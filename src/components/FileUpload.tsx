import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PatientDocument } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FileUploadProps {
  files: PatientDocument[];
  onFilesChange: (files: PatientDocument[]) => void;
  maxFiles?: number;
  accept?: string;
  label?: string;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  accept = "image/*,.pdf",
  label = "آپلود مدارک",
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<PatientDocument | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [files, maxFiles, onFilesChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(selectedFiles);
    e.target.value = '';
  };

  const handleFiles = (newFiles: File[]) => {
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);

    const processedFiles: PatientDocument[] = filesToAdd.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));

    onFilesChange([...files, ...processedFiles]);
  };

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
    onFilesChange(files.filter(f => f.id !== id));
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <>
      <div className={cn("space-y-4", className)}>
        <label className="text-sm font-medium text-foreground">{label}</label>
        
        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "upload-zone",
            isDragging && "upload-zone-active"
          )}
        >
          <input
            type="file"
            accept={accept}
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              فایل‌ها را اینجا رها کنید یا کلیک کنید
            </p>
            <p className="text-xs text-muted-foreground">
              حداکثر {maxFiles} فایل - تصاویر و PDF
            </p>
          </label>
        </div>

        {/* File Previews */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-3"
            >
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="image-preview group"
                >
                  {isImage(file.type) ? (
                    <img src={file.url} alt={file.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 bg-card rounded-full hover:bg-card/80 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px]">
            {previewFile && isImage(previewFile.type) ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            ) : previewFile ? (
              <iframe
                src={previewFile.url}
                className="w-full h-[70vh] rounded-lg"
                title={previewFile.name}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileUpload;

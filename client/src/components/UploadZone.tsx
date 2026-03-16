'use client';

import React, { useState } from 'react';
import { Upload, FileArchive, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isUploading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      onUpload(file);
    } else {
      alert('Please upload a ZIP file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full max-w-2xl mx-auto p-12 mt-12 border-2 border-dashed rounded-2xl transition-all duration-300 ${
        isDragging ? 'border-primary bg-primary/5' : 'border-white/10'
      } glass`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Uploading Project...</h2>
            <p className="text-muted-foreground">Analyzing structure and preparing for deployment.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Deploy your project</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Drag and drop your project ZIP file or click to browse.
            </p>
            <input
              type="file"
              accept=".zip"
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-lg cursor-pointer transition-colors shadow-lg shadow-primary/20"
            >
              Select ZIP File
            </label>
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileArchive className="w-4 h-4" /> React / Next.js
              </div>
              <div className="flex items-center gap-1">
                <FileArchive className="w-4 h-4" /> Node.js / Python
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

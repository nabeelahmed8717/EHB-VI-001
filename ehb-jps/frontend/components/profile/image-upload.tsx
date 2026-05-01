'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useUploadImageMutation } from '@/lib/store/api/profiles.api';

interface ImageUploadProps {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
  error?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_JPS_API_URL ?? 'http://localhost:3006';

export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  required,
  error,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadImage, { isLoading }] = useUploadImageMutation();
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await uploadImage(formData).unwrap();
      onChange(result.url);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setUploadError(apiErr?.data?.message ?? 'Upload failed. Please try again.');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const imageUrl = value ? `${API_BASE}${value}` : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {imageUrl ? (
        // Preview with remove button
        <div className="relative w-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50 h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow border border-gray-200 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        // Drop zone
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <p className="text-xs text-blue-500">Uploading…</p>
            </>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400">
                {value === null ? <Upload className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              </div>
              <p className="text-xs text-gray-500">
                Click or drag &amp; drop to upload
              </p>
              <p className="text-xs text-gray-400">JPEG · PNG · WebP · max 5 MB</p>
            </>
          )}
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-xs text-red-500 mt-1">{error ?? uploadError}</p>
      )}
    </div>
  );
}

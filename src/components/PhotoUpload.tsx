"use client";

import { useState, useRef, useCallback } from "react";

interface PhotoUploadProps {
  onCapture: (base64: string) => void;
}

export default function PhotoUpload({ onCapture }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setLoading(false);
        onCapture(result);
      };
      reader.onerror = () => setLoading(false);
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-[#E8E3DC]">
        <img src={preview} alt="Food preview" className="w-full max-h-[300px] object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-white/90 text-[#E57373] text-sm font-medium rounded-lg px-3 py-1.5 shadow hover:bg-white transition-colors"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
        dragOver ? "border-[#4CAF50] bg-[#4CAF50]/5" : "border-[#E8E3DC] hover:border-[#B5AFA7]"
      }`}
    >
      {loading ? (
        <div className="w-8 h-8 border-3 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <svg
            className="w-12 h-12 text-[#B5AFA7]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm font-medium text-[#2D2A26]">
            Take a photo or upload an image
          </p>
          <p className="text-xs text-[#B5AFA7]">Supports JPG, PNG</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

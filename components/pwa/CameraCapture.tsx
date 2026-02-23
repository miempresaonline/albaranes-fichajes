'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
    onImagesCaptured: (files: File[]) => void;
    maxImages?: number;
}

export function CameraCapture({ onImagesCaptured, maxImages = 5 }: CameraCaptureProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [capturedFiles, setCapturedFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));

            setCapturedFiles(prev => [...prev, ...newFiles]);
            setPreviews(prev => [...prev, ...newPreviews]);

            onImagesCaptured([...capturedFiles, ...newFiles]);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = capturedFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        setCapturedFiles(newFiles);
        setPreviews(newPreviews);
        onImagesCaptured(newFiles);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                        <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                {previews.length < maxImages && (
                    <div
                        className="aspect-square bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer active:bg-slate-200"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Camera className="h-8 w-8 mb-1" />
                        <span className="text-xs font-medium">FOTO</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                ref={inputRef}
                onChange={handleFileChange}
            />
        </div>
    );
}

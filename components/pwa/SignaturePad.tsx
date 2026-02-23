'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, CheckCircle } from 'lucide-react';

interface SignaturePadProps {
    onChange: (base64: string | null) => void;
    defaultValue?: string | null;
}

export function SignaturePad({ onChange, defaultValue }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Load initial signature if provided
    useEffect(() => {
        if (defaultValue && sigCanvas.current) {
            console.log("Loading signature pad with value length:", defaultValue.length);
            // Ensure the canvas is ready by using a small timeout or just calling it
            // Sometimes refs are not immediately populated in some render cycles
            const canvas = sigCanvas.current;
            canvas.fromDataURL(defaultValue, {
                ratio: 1,
                width: 300,
                height: 150
            });
            setIsEmpty(false);
        } else if (!defaultValue && sigCanvas.current) {
            // If defaultValue becomes null (e.g. loaded as null), clear it? 
            // Probably not, we might be editing.
            // adhering to controlled component pattern:
            // setIsEmpty(true);
            // sigCanvas.current.clear();
        }
    }, [defaultValue]);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
        onChange(null);
    };

    const handleEnd = () => {
        if (sigCanvas.current?.isEmpty()) {
            setIsEmpty(true);
            onChange(null);
        } else {
            setIsEmpty(false);
            // Auto-save on end
            // Use full canvas to avoid positioning/sizing issues on restore
            const base64 = sigCanvas.current?.toDataURL('image/png');
            if (base64) onChange(base64);
        }
    };

    return (
        <div className="space-y-2">
            <div className="border rounded-md bg-white overflow-hidden relative border-slate-300">
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: 'w-full h-40 bg-white'
                    }}
                    onEnd={handleEnd}
                />

                <div className="absolute top-2 right-2 flex gap-2">
                    {!isEmpty && (
                        <Button size="icon" variant="destructive" onClick={clear} type="button" className="h-8 w-8 bg-red-100/80 hover:bg-red-200 text-red-600 rounded-full shadow-sm">
                            <Eraser className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {isEmpty && !defaultValue && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300">
                        <span className="text-sm">Firmar aquí</span>
                    </div>
                )}
            </div>
            {/* Manual Save Button for Reassurance */}
            {!isEmpty && (
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 gap-1 h-7"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEnd(); // Force save
                            // Visual feedback could be added here if needed, but the green button presence is already positive
                        }}
                    >
                        <CheckCircle className="h-3 w-3" /> Firma registrada (Auto-guardado)
                    </Button>
                </div>
            )}
        </div>
    );
}

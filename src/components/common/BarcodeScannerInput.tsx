import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BarcodeScannerInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const detectorFormats = [
  'code_128',
  'code_39',
  'codabar',
  'ean_13',
  'ean_8',
  'qr_code',
  'upc_a',
  'upc_e',
] as const;

export const BarcodeScannerInput: React.FC<BarcodeScannerInputProps> = ({
  value,
  onChange,
  className,
  disabled,
  ...props
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const barcodeDetectorCtor = useMemo(() => (window as any).BarcodeDetector as
    | { new (options?: { formats?: string[] }): { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> } }
    | undefined, []);

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    let isCancelled = false;

    const stopScanner = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const startScanner = async () => {
      setIsStarting(true);
      setScannerError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError('Camera access is not supported in this browser.');
        setIsStarting(false);
        return;
      }

      if (!barcodeDetectorCtor) {
        setScannerError('Barcode scanning is not available in this browser. Please type the barcode manually.');
        setIsStarting(false);
        return;
      }

      const detector = new barcodeDetectorCtor({ formats: [...detectorFormats] });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const scanFrame = async () => {
          if (isCancelled || !videoRef.current) {
            return;
          }

          try {
            const results = await detector.detect(videoRef.current);
            const foundValue = results.find((result) => result.rawValue?.trim())?.rawValue?.trim();

            if (foundValue) {
              onChange(foundValue);
              setIsScannerOpen(false);
              return;
            }
          } catch {
            setScannerError('Unable to read the barcode yet. Try moving closer or improving lighting.');
          }

          frameRef.current = window.requestAnimationFrame(() => {
            void scanFrame();
          });
        };

        void scanFrame();
      } catch {
        setScannerError('Camera permission was denied or unavailable. Please enter the barcode manually.');
      } finally {
        setIsStarting(false);
      }
    };

    void startScanner();

    return () => {
      isCancelled = true;
      stopScanner();
    };
  }, [barcodeDetectorCtor, isScannerOpen, onChange]);

  return (
    <>
      <div className="relative">
        <input
          {...props}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 pl-4 pr-14 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all ${className || ''}`}
        />
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          disabled={disabled}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[var(--bg-surface)] text-gray-500 shadow-sm transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          title="Scan barcode"
        >
          <Camera size={16} />
        </button>
      </div>

      <AnimatePresence>
        {isScannerOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsScannerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[32px] bg-[var(--bg-surface)] shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Scan barcode</h3>
                  <p className="mt-1 text-sm text-gray-500">Point the camera at the barcode to fill this field automatically.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="overflow-hidden rounded-3xl bg-gray-950">
                  <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
                </div>

                {isStarting ? <p className="text-sm text-gray-500">Starting camera…</p> : null}
                {scannerError ? <p className="text-sm text-amber-600">{scannerError}</p> : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(false)}
                    className="flex-1 rounded-xl bg-[var(--bg-surface-variant-strong)] px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--bg-surface-variant-strong)]"
                  >
                    Close scanner
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';

interface Props {
  onScan: (text: string) => void;
  onClose: () => void;
}

export default function QrScannerModal({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let cancelled = false;

    reader.decodeFromVideoDevice(
      undefined, // back camera (environment) by default
      videoRef.current!,
      (result, err, controls) => {
        controlsRef.current = controls;
        if (!ready) setReady(true);

        if (result && !cancelled) {
          cancelled = true;
          controls.stop();
          onScan(result.getText());
        }
        if (err) {
          // Scan errors are normal (no QR in frame), ignore them
        }
      }
    ).catch((e: Error) => {
      setError(
        e?.message?.includes('Permission')
          ? 'Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur.'
          : 'Impossible d\'accéder à la caméra : ' + e.message
      );
    });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* Overlay */
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      zIndex: 300,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
        }}
      >
        <X size={22} />
      </button>

      {/* Title */}
      <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 20, textAlign: 'center', padding: '0 40px' }}>
        <Camera size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Scanner le QR code de l'étiquette
      </div>

      {error ? (
        <div style={{
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 12, padding: '16px 20px', color: '#fca5a5',
          maxWidth: 320, textAlign: 'center', fontSize: 13, lineHeight: 1.5,
        }}>
          {error}
        </div>
      ) : (
        /* Video container with scanning frame overlay */
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            style={{
              width: 300, height: 300,
              objectFit: 'cover',
              borderRadius: 12,
              display: 'block',
            }}
            autoPlay
            muted
            playsInline
          />

          {/* Corner frame overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Top-left */}
            <div style={{ position: 'absolute', top: 16, left: 16, width: 30, height: 30, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '4px 0 0 0' }} />
            {/* Top-right */}
            <div style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 4px 0 0' }} />
            {/* Bottom-left */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, width: 30, height: 30, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '0 0 0 4px' }} />
            {/* Bottom-right */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 30, height: 30, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 0 4px 0' }} />
          </div>

          {/* Loading indicator */}
          {!ready && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13,
            }}>
              Initialisation…
            </div>
          )}
        </div>
      )}

      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
        La pesée s'ouvrira automatiquement
      </div>
    </div>
  );
}

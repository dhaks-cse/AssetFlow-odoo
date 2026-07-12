"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ELEMENT_ID = "assetflow-qr-reader";

export type QrScannerControls = {
  pause: () => void;
  resume: () => void;
};

/**
 * Low-level Html5Qrcode (not Html5QrcodeScanner) so we get a bare camera
 * feed with none of the library's own start/stop/torch chrome — this view
 * supplies its own full-viewport UI. Started once on mount and controlled
 * afterward via pause()/resume() (not stop()/start()) so "tap a verdict ->
 * scanner immediately resumes" doesn't pay a camera-reinit cost each time.
 */
export function QrScanner({
  onScan,
  onReady,
  onError,
}: {
  onScan: (decodedText: string) => void;
  onReady: (controls: QrScannerControls) => void;
  onError: (message: string) => void;
}) {
  const onScanRef = useRef(onScan);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID, { verbose: false });
    let unmounted = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => onScanRef.current(decodedText),
        () => {
          // Per-frame "no QR in this frame" — expected and constant, ignore.
        }
      )
      .then(() => {
        if (!unmounted) {
          onReadyRef.current({
            pause: () => scanner.pause(true),
            resume: () => scanner.resume(),
          });
        }
      })
      .catch(() => {
        if (!unmounted) {
          onErrorRef.current("Couldn't access the camera. Check permissions and try again.");
        }
      });

    return () => {
      unmounted = true;
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // Already torn down — nothing left to clean up.
          });
      } else {
        scanner.clear();
      }
    };
  }, []);

  return (
    <div
      id={ELEMENT_ID}
      className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
    />
  );
}

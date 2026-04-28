import { useRef, useCallback } from "react";

/**
 * useScannerInput: Hook for handling barcode scanner input as keyboard-wedge device.
 * 
 * Scanner devices typically inject scanned data as keyboard input and send Enter after.
 * This hook manages:
 * - Input field auto-focus and refocus after processing
 * - Trimming and validation of scanned values
 * - Clearing input after submission
 * - Ignoring empty submissions
 * 
 * Usage:
 *   const { inputRef, handleScanSubmit } = useScannerInput(
 *     async (value) => {
 *       // Process the scanned value
 *       console.log("Scanned:", value);
 *     }
 *   );
 *   
 *   <input ref={inputRef} onKeyDown={handleScanSubmit} />
 */

export function useScannerInput(onSubmit) {
  const inputRef = useRef(null);

  const handleScanSubmit = useCallback(
    (e) => {
      if (e.key !== "Enter") return;

      e.preventDefault();

      const value = (e.currentTarget.value || "").trim();

      // Ignore empty submissions
      if (!value) {
        return;
      }

      // Clear the input immediately
      e.currentTarget.value = "";

      // Call the submit handler
      if (onSubmit) {
        onSubmit(value);
      }

      // Refocus the input for next scan
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [onSubmit]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return {
    inputRef,
    handleScanSubmit,
    focusInput,
  };
}

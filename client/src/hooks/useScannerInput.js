import { useRef, useCallback } from "react";

function normalizeScanValue(value) {
  return (value || "").trim().split(/[,\s]+/)[0];
}

export function useScannerInput(onSubmit, setValue) {
  const inputRef = useRef(null);

  const handleScanSubmit = useCallback(
    (e) => {
      if (e.key !== "Enter") return;

      e.preventDefault();

      setTimeout(() => {
        const rawValue = inputRef.current?.value || "";
        const cleanedValue = normalizeScanValue(rawValue);

        console.log("SCAN RAW:", rawValue);
        console.log("SCAN CLEANED:", cleanedValue);

        if (!cleanedValue) return;

        if (setValue) {
          setValue(cleanedValue);
        }

        if (onSubmit) {
          onSubmit(cleanedValue);
        }

        inputRef.current?.focus();
      }, 50);
    },
    [onSubmit, setValue]
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
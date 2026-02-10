export default function Toast({ kind = "info", message, onClose }) {
  if (!message) return null;

  const styles =
    kind === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : kind === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : "border-slate-700 bg-slate-900/60 text-slate-200";

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-50">
      <div className={`border rounded-xl px-4 py-3 shadow-lg backdrop-blur ${styles}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-snug">{message}</p>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-lg hover:bg-white/5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

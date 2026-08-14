import { useCallback, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";

const ACCEPTED_TYPES = ["application/pdf", "text/plain"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type UploadPanelProps = {
  file: File | null;
  count: number;
  onFileChange: (file: File) => void;
  onCountChange: (count: number) => void;
};

export default function UploadPanel({
  file,
  count,
  onFileChange,
  onCountChange,
}: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
        setError("Only PDF and plain text files are supported.");
        return;
      }
      if (selectedFile.size > MAX_SIZE) {
        setError("File must be under 10MB.");
        return;
      }
      onFileChange(selectedFile);
      setError(null);
    },
    [onFileChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-muted hover:bg-surface"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />

        {!file && (
          <div className="flex flex-col items-center gap-3">
            <Upload size={32} className="text-muted" />
            <p className="text-sm font-medium text-ink">Drop your notes here</p>
            <p className="text-xs text-muted">or click to browse</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-md bg-pastel-cream px-2 py-0.5 font-mono text-xs text-ink">
                .pdf
              </span>
              <span className="rounded-md bg-pastel-mint px-2 py-0.5 font-mono text-xs text-ink">
                .txt
              </span>
            </div>
          </div>
        )}

        {file && (
          <div className="flex flex-col items-center gap-2">
            <FileText size={28} className="text-ink" />
            <p className="text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-muted">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}

      </div>

      {/* Question count */}
      {file && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
          <span className="label-caps text-muted">Questions</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCountChange(Math.max(5, count - 5));
              }}
              className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm hover:bg-background"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-sm">{count}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCountChange(Math.min(50, count + 5));
              }}
              className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm hover:bg-background"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

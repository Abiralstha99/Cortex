import { useCallback, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCEPTED_TYPES = ["application/pdf", "text/plain"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function titleFromFilename(name: string): string {
  return name.replace(/\.(pdf|txt)$/i, "").trim();
}

type UploadPanelProps = {
  file: File | null;
  onFileChange: (file: File) => void;
  /** Quiz display name — shown when provided. */
  title?: string;
  onTitleChange?: (title: string) => void;
  /** Optional question count — shown when provided (e.g. lobby retry). */
  count?: number;
  onCountChange?: (count: number) => void;
};

export default function UploadPanel({
  file,
  onFileChange,
  title,
  onTitleChange,
  count,
  onCountChange,
}: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const showTitle = title !== undefined && onTitleChange != null;
  const showQuestionCount = count != null && onCountChange != null;

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
      // Prefill name from filename when the field is empty or still mirrors the prior file.
      if (onTitleChange) {
        const suggested = titleFromFilename(selectedFile.name);
        const previousSuggested = file ? titleFromFilename(file.name) : "";
        if (!title?.trim() || title.trim() === previousSuggested) {
          onTitleChange(suggested);
        }
      }
      setError(null);
    },
    [file, onFileChange, onTitleChange, title],
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
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-[var(--radius-panel)] border-2 border-dashed border-border p-10 text-center transition-colors hover:border-muted hover:bg-surface"
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
            <p className="mt-2 font-mono text-xs text-muted">
              .pdf / .txt
            </p>
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

      {showTitle && (
        <div className="space-y-2">
          <Label htmlFor="quiz-title">Quiz name</Label>
          <Input
            id="quiz-title"
            type="text"
            value={title}
            maxLength={255}
            placeholder="e.g. Cell Biology Midterm"
            onChange={(e) => onTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-xs text-muted">
            Shown in Past Quizzes. Leave blank to use the file name.
          </p>
        </div>
      )}

      {showQuestionCount && (
        <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-border bg-surface p-3">
          <span className="text-sm font-medium text-muted">Questions</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCountChange(Math.max(5, count - 5));
              }}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] border border-border text-sm hover:bg-background"
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
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] border border-border text-sm hover:bg-background"
            >
              +
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

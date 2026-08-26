import { useCallback, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  /** Quiz display name shown when provided. */
  title?: string;
  onTitleChange?: (title: string) => void;
  /** Optional question count shown when provided (e.g. lobby retry). */
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
        className="cursor-pointer rounded-(--radius-panel) border-2 border-dashed border-border bg-cream p-8 text-center transition-[border-color,background-color,transform] hover:border-forest hover:bg-surface active:scale-[0.99] sm:p-10"
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
          <div className="flex flex-col items-center gap-2">
            <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-forest text-white shadow-[0_3px_0_0_#164f37]">
              <Upload size={22} aria-hidden="true" />
            </span>
            <p className="font-display text-lg font-extrabold text-ink">
              Drop your notes here
            </p>
            <p className="text-sm text-muted">or click to choose a file</p>
            <p className="mt-2 font-mono text-xs font-semibold text-forest">
              .pdf / .txt, up to 10 MB
            </p>
          </div>
        )}

        {file && (
          <div className="flex flex-col items-center gap-2">
            <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-forest text-white shadow-[0_3px_0_0_#164f37]">
              <FileText size={22} aria-hidden="true" />
            </span>
            <p className="max-w-full truncate font-display text-lg font-extrabold text-ink">
              {file.name}
            </p>
            <p className="font-mono text-xs text-muted">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs font-semibold text-forest">
              Click to choose a different file
            </p>
          </div>
        )}
      </div>

      {showTitle && (
        <div className="space-y-2">
          <Label htmlFor="quiz-title" className="font-semibold text-ink">
            Give your quiz a name
          </Label>
          <Input
            id="quiz-title"
            type="text"
            value={title}
            maxLength={255}
            placeholder="Cell Biology Midterm"
            onChange={(e) => onTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-xs text-muted">
            Leave it blank and we will use the file name.
          </p>
        </div>
      )}

      {showQuestionCount && (
        <div className="flex items-center justify-between rounded-(--radius-panel) border border-border bg-surface p-4">
          <span className="text-sm font-semibold text-ink">Questions</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Decrease questions"
              onClick={(e) => {
                e.stopPropagation();
                onCountChange(Math.max(5, count - 5));
              }}
            >
              <span aria-hidden="true">−</span>
            </Button>
            <span className="w-8 text-center font-mono text-sm">{count}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Increase questions"
              onClick={(e) => {
                e.stopPropagation();
                onCountChange(Math.min(50, count + 5));
              }}
            >
              <span aria-hidden="true">+</span>
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

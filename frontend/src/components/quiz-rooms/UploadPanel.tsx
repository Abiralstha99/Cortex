import { useCallback, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  titleFromFilename,
  validateQuizUploadFile,
} from "@/lib/upload-validation";

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
      const validation = validateQuizUploadFile(selectedFile);
      if (!validation.ok) {
        setError(validation.error);
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
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={file ? "Choose a different quiz file" : "Choose a quiz file"}
        aria-describedby={error ? "quiz-file-error" : "quiz-file-help"}
        className="cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed border-border bg-subtle p-8 text-center outline-none transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-primary hover:bg-primary-soft focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 active:scale-99 motion-reduce:transform-none sm:p-10"
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
            <span className="mb-2 flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-primary text-white">
              <Upload size={22} aria-hidden="true" />
            </span>
            <p className="text-lg font-bold text-ink">Drop your notes here</p>
            <p className="text-sm text-muted-foreground">or click to choose a file</p>
            <p
              id="quiz-file-help"
              className="mt-2 text-xs font-medium text-primary"
            >
              PDF or TXT, up to 10 MB
            </p>
          </div>
        )}

        {file && (
          <div className="flex flex-col items-center gap-2">
            <span className="mb-1 flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-primary text-white">
              <FileText size={22} aria-hidden="true" />
            </span>
            <p className="max-w-full truncate text-lg font-bold text-ink">
              {file.name}
            </p>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <p
              id="quiz-file-help"
              className="text-xs font-semibold text-primary"
            >
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
          <p className="text-xs text-muted-foreground">
            Leave it blank and we will use the file name.
          </p>
        </div>
      )}

      {showQuestionCount && (
        <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-subtle p-4">
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

      {error && (
        <p
          id="quiz-file-error"
          className="text-sm font-medium text-danger-foreground"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

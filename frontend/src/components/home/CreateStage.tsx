import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { validateQuizUploadFile } from "@/lib/upload-validation";

interface CreateStageProps {
  onContinue: (file: File) => void;
}

export default function CreateStage({ onContinue }: CreateStageProps) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file?: File) => {
    setError(null);
    if (!file) return;
    const res = validateQuizUploadFile(file);
    if (!res.ok) {
      setSelected(null);
      setError(res.error);
      return;
    }
    setSelected(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const changeFile = () => {
    setSelected(null);
    const input = document.getElementById("create-stage-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <motion.section
      layout={!reduce}
      initial={false}
      className={`rounded-lg ${selected ? "" : "border-2 border-dashed border-border"} bg-surface p-6 shadow-card`}
    >
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div className="min-w-0">
          <h2 className="text-balance text-xl font-semibold leading-7 text-ink">
            Drop notes to open a room
          </h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Upload a PDF or plain text file to turn your notes into a live
            multiplayer quiz.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm leading-5 text-danger-foreground">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3">
          <input
            className="sr-only"
            id="create-stage-file"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={onInputChange}
            data-testid="file-input"
          />
          {!selected ? (
            <label
              htmlFor="create-stage-file"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  document.getElementById("create-stage-file")?.click();
                }
              }}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm font-semibold leading-5 text-ink outline-none transition-colors hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-primary/30"
            >
              Select file
            </label>
          ) : (
            <motion.div layout={!reduce} className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              <div className="min-w-0 max-w-[240px] rounded-md bg-subtle px-3 py-2">
                <div className="truncate text-sm font-semibold leading-5 text-ink">{selected.name}</div>
                <div className="font-mono text-xs leading-4 tabular-nums text-text-muted">
                  {selected.type || "unknown"} • {(selected.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={changeFile}>
                Change
              </Button>
              <Button
                type="button"
                onClick={() => onContinue(selected)}
                aria-label="Continue"
              >
                Continue
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

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

  return (
    <motion.section
      layout
      initial={false}
      animate={{}}
      className="rounded-lg border border-border bg-surface p-6 shadow-card"
    >
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h2 className="text-balance text-lg font-semibold">
            Drop notes to open a room
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a PDF or plain text file to turn your notes into a live
            multiplayer quiz.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger-soft">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <input
            aria-hidden
            className="hidden"
            id="create-stage-file"
            type="file"
            onChange={onInputChange}
            data-testid="file-input"
          />
          {!selected ? (
            <label
              htmlFor="create-stage-file"
              className="inline-flex cursor-pointer items-center rounded-md border border-dashed border-border px-4 py-2 text-sm"
            >
              Select file
            </label>
          ) : (
            <motion.div layout className="flex items-center gap-3">
              <div className="rounded-md bg-muted px-3 py-1 text-sm">
                {selected.name}
              </div>
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


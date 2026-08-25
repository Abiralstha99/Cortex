import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeRoomCode } from "./room-code-utils";

export default function RoomCodeInput({
  id,
  value,
  onChange,
  error,
  autoFocus,
  className,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  autoFocus?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="label-caps text-muted">
          {label}
        </label>
      ) : (
        <label htmlFor={id} className="sr-only">
          Room code
        </label>
      )}
      <Input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={6}
        autoFocus={autoFocus}
        placeholder="ABC123"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(normalizeRoomCode(e.target.value))}
        className={cn(
          "h-11 text-center font-mono text-xl font-semibold tracking-[0.25em]",
          className,
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { useSignIn } from "@clerk/react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerificationMethod = "email" | "totp" | "backup";

function errorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Could not sign you in. Check your details and try again.";
}

export default function PasswordSignInForm({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const { signIn, errors, fetchStatus } = useSignIn();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isPending = fetchStatus === "fetching";

  async function completeSignIn() {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const destination = decorateUrl(redirectTo);
        if (destination.startsWith("http")) {
          window.location.assign(destination);
          return;
        }
        navigate(destination, { replace: true });
      },
    });
  }

  async function beginVerification() {
    const supportsEmailCode = signIn.supportedSecondFactors.some(
      (factor) => factor.strategy === "email_code",
    );
    const supportsTotp = signIn.supportedSecondFactors.some(
      (factor) => factor.strategy === "totp",
    );
    const supportsBackupCode = signIn.supportedSecondFactors.some(
      (factor) => factor.strategy === "backup_code",
    );

    if (supportsEmailCode) {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setMessage(errorMessage(error));
        return;
      }
      setVerificationMethod("email");
      return;
    }

    if (supportsTotp) {
      setVerificationMethod("totp");
      return;
    }

    if (supportsBackupCode) {
      setVerificationMethod("backup");
      return;
    }

    setMessage("This sign-in needs an additional verification method.");
  }

  async function handleCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });
    if (error) {
      setMessage(errorMessage(error));
      return;
    }

    if (signIn.status === "complete") {
      await completeSignIn();
      return;
    }

    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      await beginVerification();
      return;
    }

    setMessage("This sign-in needs an additional step.");
  }

  async function handleVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const result =
      verificationMethod === "email"
        ? await signIn.mfa.verifyEmailCode({ code })
        : verificationMethod === "totp"
          ? await signIn.mfa.verifyTOTP({ code })
          : await signIn.mfa.verifyBackupCode({ code });

    if (result.error) {
      setMessage(errorMessage(result.error));
      return;
    }

    if (signIn.status === "complete") {
      await completeSignIn();
      return;
    }

    setMessage("That code could not complete sign-in. Try again.");
  }

  async function handleGoogle() {
    setMessage(null);
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectCallbackUrl: redirectTo,
    });
    if (error) setMessage(errorMessage(error));
  }

  async function startOver() {
    await signIn.reset();
    setCode("");
    setMessage(null);
    setVerificationMethod(null);
  }

  if (verificationMethod) {
    const label =
      verificationMethod === "email"
        ? "Email verification code"
        : verificationMethod === "totp"
          ? "Authenticator code"
          : "Backup code";
    const detail =
      verificationMethod === "email"
        ? "We sent a code to your email address."
        : "Enter the code from your authenticator or backup codes.";

    return (
      <section className="rounded-[var(--radius-sticker)] border-[5px] border-white bg-surface p-6 shadow-[0_10px_0_0_rgb(0_0_0/0.12)] sm:p-7">
        <h2 className="font-display text-2xl font-extrabold text-ink">
          One more step
        </h2>
        <p className="mt-2 text-sm text-muted">{detail}</p>

        <form className="mt-6 space-y-4" onSubmit={handleVerification} noValidate>
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="font-mono text-xs font-semibold tracking-[0.1em] text-muted uppercase">
              {label}
            </Label>
            <Input
              id="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-invalid={Boolean(message || errors.fields.code)}
              className="text-center font-mono text-lg tracking-[0.18em]"
              autoFocus
            />
          </div>

          {(message || errors.fields.code) && (
            <p className="text-sm text-danger" role="alert">
              {message ?? errors.fields.code?.message}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={!code || isPending}>
            {isPending ? "Checking..." : "Verify and sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => void startOver()}
          className="mt-5 w-full text-sm font-semibold text-forest underline-offset-4 hover:underline"
        >
          Use a different account
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-sticker)] border-[5px] border-white bg-surface p-6 shadow-[0_10px_0_0_rgb(0_0_0/0.12)] sm:p-7">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={() => void handleGoogle()}
      >
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs text-muted">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={handleCredentials} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-mono text-xs font-semibold tracking-[0.1em] text-muted uppercase">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            aria-invalid={Boolean(message || errors.fields.identifier)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-mono text-xs font-semibold tracking-[0.1em] text-muted uppercase">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(message || errors.fields.password)}
          />
        </div>

        {(message || errors.fields.identifier || errors.fields.password || errors.global?.[0]) && (
          <p className="text-sm text-danger" role="alert">
            {message ??
              errors.fields.identifier?.message ??
              errors.fields.password?.message ??
              errors.global?.[0]?.message}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={!email || !password || isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don’t have an account?{" "}
        <Link to="/sign-up" className="font-semibold text-forest underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </section>
  );
}

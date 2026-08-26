import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/react";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

const hiddenElement = { display: "none" };

/** Shared Clerk theme for Login and SignUp — keeps both pages visually identical. */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "var(--accent)",
    colorBackground: "var(--bg-raised)",
    colorForeground: "var(--text)",
    colorMutedForeground: "var(--text-muted)",
    colorInput: "var(--bg)",
    colorInputForeground: "var(--text)",
    colorBorder: "var(--border)",
    colorRing: "var(--accent)",
    colorDanger: "var(--danger)",
    fontFamily: "var(--font-body)",
    fontFamilyButtons: "var(--font-body)",
    fontFamilyMono: "var(--font-mono)",
    borderRadius: "6px",
    spacing: "1rem",
  },
  elements: {
    card: {
      border: "1px solid var(--border)",
      backgroundColor: "var(--bg-raised)",
      boxShadow: "none",
      borderRadius: "24px",
    },
    headerTitle: hiddenElement,
    headerSubtitle: hiddenElement,
    socialButtonsBlockButton: {
      border: "1px solid var(--border-strong)",
      backgroundColor: "transparent",
      color: "var(--text)",
    },
    dividerLine: {
      backgroundColor: "var(--border)",
    },
    dividerText: {
      color: "var(--text-dim)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.6875rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    formFieldLabel: {
      color: "var(--text-muted)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.6875rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    formFieldInput: {
      backgroundColor: "var(--bg)",
      border: "1px solid var(--border-strong)",
      color: "var(--text)",
    },
    formButtonPrimary: {
      backgroundColor: "var(--accent)",
      color: "#fffcf7",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "none",
      borderRadius: "999px",
    },
    footer: {
      backgroundColor: "transparent",
    },
    footerActionLink: {
      color: "var(--accent)",
    },
    identityPreviewText: {
      color: "var(--text-muted)",
    },
    identityPreviewEditButton: {
      color: "var(--accent)",
    },
  },
};

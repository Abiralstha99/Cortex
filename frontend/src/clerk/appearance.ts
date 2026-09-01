import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/react";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

const hiddenElement = { display: "none" };

/** Shared Clerk theme for Login and SignUp. */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#405A9B",
    colorBackground: "#FFFFFF",
    colorForeground: "#111936",
    colorMutedForeground: "#697188",
    colorInput: "#F8F9FC",
    colorInputForeground: "#111936",
    colorBorder: "#E6E9F0",
    colorRing: "#405A9B",
    colorDanger: "#EF5A67",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyMono: "IBM Plex Mono, ui-monospace, monospace",
    borderRadius: "12px",
    spacing: "1rem",
  },
  elements: {
    card: {
      border: "0",
      backgroundColor: "#FFFFFF",
      boxShadow: "none",
      borderRadius: "16px",
    },
    headerTitle: hiddenElement,
    headerSubtitle: hiddenElement,
    socialButtonsBlockButton: {
      minHeight: "48px",
      border: "1px solid #E6E9F0",
      backgroundColor: "#FFFFFF",
      color: "#111936",
      fontWeight: 600,
    },
    dividerLine: {
      backgroundColor: "#E6E9F0",
    },
    dividerText: {
      color: "#697188",
      fontSize: "0.8125rem",
    },
    formFieldLabel: {
      color: "#111936",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    formFieldInput: {
      minHeight: "48px",
      backgroundColor: "#F8F9FC",
      border: "1px solid #E6E9F0",
      color: "#111936",
    },
    formButtonPrimary: {
      minHeight: "48px",
      backgroundColor: "#405A9B",
      color: "#FFFFFF",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "none",
      borderRadius: "12px",
    },
    footer: {
      backgroundColor: "transparent",
    },
    footerActionLink: {
      color: "#405A9B",
    },
    identityPreviewText: {
      color: "#697188",
    },
    identityPreviewEditButton: {
      color: "#405A9B",
    },
  },
};

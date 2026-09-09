import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/react";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

const hiddenElement = { display: "none" };

/** Shared Clerk theme for Login and SignUp. */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#479EF5",
    colorBackground: "#242424",
    colorForeground: "#F5F5F5",
    colorMutedForeground: "#C7C7C7",
    colorInput: "#2B2B2B",
    colorInputForeground: "#F5F5F5",
    colorBorder: "rgba(255,255,255,0.12)",
    colorRing: "#479EF5",
    colorDanger: "#F1707A",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyMono: "IBM Plex Mono, ui-monospace, monospace",
    borderRadius: "12px",
    spacing: "1rem",
  },
  elements: {
    card: {
      border: "0",
      backgroundColor: "transparent",
      boxShadow: "none",
      borderRadius: "12px",
    },
    headerTitle: hiddenElement,
    headerSubtitle: hiddenElement,
    socialButtonsBlockButton: {
      minHeight: "48px",
      border: "1px solid rgba(255,255,255,0.14)",
      backgroundColor: "#2B2B2B",
      color: "#F5F5F5",
      fontWeight: 600,
    },
    dividerLine: {
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    dividerText: {
      color: "#A8A8A8",
      fontSize: "0.8125rem",
    },
    formFieldLabel: {
      color: "#F5F5F5",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    formFieldInput: {
      minHeight: "48px",
      backgroundColor: "#2B2B2B",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "#F5F5F5",
    },
    formButtonPrimary: {
      minHeight: "48px",
      backgroundColor: "#479EF5",
      color: "#0B1520",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "0 2px 4px rgb(0 0 0 / 0.14)",
      borderRadius: "12px",
    },
    footer: {
      backgroundColor: "transparent",
    },
    footerActionLink: {
      color: "#62ABF5",
    },
    identityPreviewText: {
      color: "#A8A8A8",
    },
    identityPreviewEditButton: {
      color: "#62ABF5",
    },
  },
};

/** Fluent dark appearance for Clerk modal usage in the app shell (modal only). */
export const clerkFluentDarkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#F7D3E0",
    colorBackground: "#0B0F14",
    colorForeground: "#E6EEF6",
    colorMutedForeground: "#9AA6B2",
    colorInput: "#0F1720",
    colorInputForeground: "#E6EEF6",
    colorBorder: "#1F2933",
    colorRing: "#F7D3E0",
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
      backgroundColor: "transparent",
      boxShadow: "none",
      borderRadius: "12px",
    },
    headerTitle: hiddenElement,
    headerSubtitle: hiddenElement,
    socialButtonsBlockButton: {
      minHeight: "48px",
      border: "1px solid rgba(255,255,255,0.04)",
      backgroundColor: "transparent",
      color: "#E6EEF6",
      fontWeight: 600,
    },
    dividerLine: {
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    dividerText: {
      color: "#9AA6B2",
      fontSize: "0.8125rem",
    },
    formFieldLabel: {
      color: "#E6EEF6",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    formFieldInput: {
      minHeight: "48px",
      backgroundColor: "#0F1720",
      border: "1px solid rgba(255,255,255,0.04)",
      color: "#E6EEF6",
    },
    formButtonPrimary: {
      minHeight: "48px",
      backgroundColor: "#F7D3E0",
      color: "#0B0F14",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "none",
      borderRadius: "12px",
    },
    footer: {
      backgroundColor: "transparent",
    },
    footerActionLink: {
      color: "#F7D3E0",
    },
    identityPreviewText: {
      color: "#9AA6B2",
    },
    identityPreviewEditButton: {
      color: "#F7D3E0",
    },
  },
};

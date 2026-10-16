import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/react";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

const hiddenElement = { display: "none" };

/** Shared editorial Clerk theme for Login and SignUp. */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#161410",
    colorBackground: "#FCFAF5",
    colorForeground: "#161410",
    colorMutedForeground: "#5F5B53",
    colorInput: "#F8F6EE",
    colorInputForeground: "#161410",
    colorBorder: "#D5D2C7",
    colorRing: "#EE3B2E",
    colorDanger: "#B92B22",
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "Jost, ui-sans-serif, system-ui, sans-serif",
    fontFamilyMono: "IBM Plex Mono, ui-monospace, monospace",
    borderRadius: "16px",
    spacing: "1rem",
  },
  elements: {
    card: {
      border: "0",
      backgroundColor: "transparent",
      boxShadow: "none",
      borderRadius: "16px",
    },
    headerTitle: hiddenElement,
    headerSubtitle: hiddenElement,
    socialButtonsBlockButton: {
      minHeight: "48px",
      border: "1px solid #D5D2C7",
      backgroundColor: "#FCFAF5",
      color: "#161410",
      fontWeight: 600,
    },
    dividerLine: {
      backgroundColor: "#D5D2C7",
    },
    dividerText: {
      color: "#5F5B53",
      fontSize: "0.8125rem",
    },
    formFieldLabel: {
      color: "#161410",
      fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    formFieldInput: {
      minHeight: "48px",
      backgroundColor: "#F8F6EE",
      border: "1px solid #D5D2C7",
      color: "#161410",
    },
    formButtonPrimary: {
      minHeight: "48px",
      backgroundColor: "#161410",
      color: "#FCFAF5",
      fontWeight: 700,
      textTransform: "none",
      boxShadow: "none",
      borderRadius: "999px",
    },
    footer: {
      backgroundColor: "transparent",
    },
    footerActionLink: {
      color: "#A32A22",
    },
    identityPreviewText: {
      color: "#5F5B53",
    },
    identityPreviewEditButton: {
      color: "#A32A22",
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

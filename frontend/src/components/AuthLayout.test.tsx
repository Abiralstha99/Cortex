import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { renderWithRouter } from "@/test/render";
import AuthLayout from "./AuthLayout";

afterEach(cleanup);

it("keeps the auth task heading and form in one labelled experience", () => {
  renderWithRouter(
    <AuthLayout heading="Welcome back." subtitle="Sign in to continue.">
      <form aria-label="Sign in form" />
    </AuthLayout>,
  );

  expect(
    screen.getByRole("heading", { name: "Welcome back." }),
  ).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "Sign in form" })).toBeInTheDocument();
});

it("uses the shared Fluent dark theme and compact auth copy", () => {
  renderWithRouter(
    <AuthLayout heading="Welcome back." subtitle="Sign in to continue.">
      <form aria-label="Sign in form" />
    </AuthLayout>,
  );

  expect(document.querySelector('[data-theme="fluent-dark"]')).not.toBeNull();
  expect(screen.getByText("Live quiz night")).toBeInTheDocument();
  expect(screen.getByText("Your notes. Their fastest answers.")).toBeInTheDocument();
  expect(screen.getByText("Create from notes")).toBeInTheDocument();
  expect(screen.getByText("Invite the room")).toBeInTheDocument();
  expect(screen.getByText("Race for first")).toBeInTheDocument();
});

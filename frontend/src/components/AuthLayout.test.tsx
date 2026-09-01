import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { renderWithRouter } from "@/test/render";
import AuthLayout from "./AuthLayout";

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

import { useAuth, SignIn } from "@clerk/react";
import { useLocation, Navigate } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { clerkAppearance } from "@/clerk/appearance";

export default function Login() {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/dashboard";

  if (isSignedIn) {
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout heading="Welcome back." subtitle="Your next match is waiting.">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}

import { useAuth, SignUp as ClerkSignUp } from "@clerk/react";
import { Navigate } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { clerkAppearance } from "@/clerk/appearance";

export default function SignUp() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout heading="Create your account." subtitle="Set up your player profile.">
      <ClerkSignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}

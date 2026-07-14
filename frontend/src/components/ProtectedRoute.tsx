import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  // Location is used to store the location of the user before they were redirected to the login page
  const location = useLocation();
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {

    // Replace is used to replace the current location with the login page
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

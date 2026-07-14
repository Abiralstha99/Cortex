import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          {/* Clerk manages its own sub-routes (verification, SSO callback, etc.)
              under these paths, so both need a /* wildcard match. */}
          <Route path="/login/*" element={<Login />} />
          <Route path="/sign-up/*" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import HomeWorkspace from "./pages/HomeWorkspace";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import ProtectedRoute from "./components/ProtectedRoute";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Dashboard from "./pages/Dashboard";
import QuizDetailsPage from "./pages/QuizDetailsPage";
import PracticeLibrary from "./pages/PracticeLibrary";
import CreatePracticeQuiz from "./pages/CreatePracticeQuiz";
import PracticePlayer from "./pages/PracticePlayer";
import PracticeResult from "./pages/PracticeResult";
const router = createBrowserRouter(createRoutesFromElements(
        <Route>
          {/* Public routes */}
          <Route path="/" element={<HomeWorkspace />} />
          {/* Clerk manages its own sub-routes (verification, SSO callback, etc.)
              under these paths, so both need a /* wildcard match. */}
          <Route path="/login/*" element={<Login />} />
          <Route path="/sign-up/*" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/create"
            element={
              <ProtectedRoute>
                <CreateGame />
              </ProtectedRoute>
            }
          />
          <Route path="/quizzes/:quizId" element={<ProtectedRoute><QuizDetailsPage /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><PracticeLibrary /></ProtectedRoute>} />
          <Route path="/practice/create" element={<ProtectedRoute><CreatePracticeQuiz /></ProtectedRoute>} />
          <Route path="/practice/sessions/:sessionId" element={<ProtectedRoute><PracticePlayer /></ProtectedRoute>} />
          <Route path="/practice/quizzes/:quizId/results/latest" element={<ProtectedRoute><PracticeResult /></ProtectedRoute>} />
          <Route
            path="/game/join"
            element={
              <ProtectedRoute>
                <JoinGame />
              </ProtectedRoute>
            }
          />

          <Route path="/game/lobby/:roomCode" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />
        </Route>
));

function App() {
  return <RouterProvider router={router} />;
}

export default App;

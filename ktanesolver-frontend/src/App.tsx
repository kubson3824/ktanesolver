import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Route-level code splitting
const MainPage = lazy(() => import("./pages/MainPage"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const SolvePage = lazy(() => import("./pages/SolvePage"));
const RoundsPage = lazy(() => import("./pages/RoundsPage"));

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm text-base-content/70">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <MainPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/round/:roundId/setup"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SetupPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/setup"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/rounds"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <RoundsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/solve/:roundId"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SolvePage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

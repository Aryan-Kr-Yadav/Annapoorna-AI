import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Skeleton from "./components/common/Skeleton";

// Lazy-loaded or direct imported Pages
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import FarmDetails from "./pages/FarmDetails";
import CropDetails from "./pages/CropDetails";
import CropDoctor from "./pages/CropDoctor";
import CropPlanner from "./pages/CropPlanner";
import Assistant from "./pages/Assistant";
import Weather from "./pages/Weather";
import Market from "./pages/Market";
import Schemes from "./pages/Schemes";
import Analytics from "./pages/Analytics";
import Tasks from "./pages/Tasks";
import Irrigation from "./pages/Irrigation";
import Soil from "./pages/Soil";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="space-y-4 w-72 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-100 animate-pulse" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3 w-36 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/sign-in"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/sign-up"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Application Routes wrapped in AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/farms/:farmId" element={<FarmDetails />} />
        <Route path="/crops/:cropId" element={<CropDetails />} />
        <Route path="/crops/:cropId/diary" element={<CropDetails />} />
        <Route path="/crop-doctor" element={<CropDoctor />} />
        <Route path="/crop-planner" element={<CropPlanner />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/market" element={<Market />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/soil" element={<Soil />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

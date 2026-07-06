import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import {
  Landing,
  Login,
  Register,
  Dashboard,
  PlansPage,
  CreatePlanPage,
  TransactionsPage,
  PlanDetailsPage,
} from './pages/index.ts';
import { ProtectedRoute } from '@/components';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/plans"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/plans/:id"
          element={
            <ProtectedRoute>
              <PlanDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/create"
          element={
            <ProtectedRoute>
              <CreatePlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

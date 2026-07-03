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
} from './pages/index.ts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/plans" element={<PlansPage />} />
        <Route path="/dashboard/create" element={<CreatePlanPage />} />
        <Route path="/dashboard/transactions" element={<TransactionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

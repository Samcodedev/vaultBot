import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { Landing, Login, Register } from './pages/index.ts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

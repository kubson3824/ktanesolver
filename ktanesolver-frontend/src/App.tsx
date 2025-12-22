import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SetupPage from "./pages/SetupPage";
import SolvePage from "./pages/SolvePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/solve/:roundId" element={<SolvePage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

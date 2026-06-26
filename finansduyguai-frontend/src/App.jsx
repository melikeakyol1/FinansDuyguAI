import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Anomaly from "./pages/Anomaly";
import Analytics from "./pages/Analytics";
import Duygu from "./pages/Duygu";
import AkilliOneriler from "./pages/AkilliOneriler";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/anomaly" element={<Anomaly />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/duygu" element={<Duygu />} />
      <Route path="/akilli-oneriler" element={<AkilliOneriler />} />
    </Routes>
  );
}

export default App;
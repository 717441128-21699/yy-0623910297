import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import EventDetail from "@/pages/EventDetail";
import DailyReport from "@/pages/DailyReport";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-deep-blue-500 text-text-primary">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/report" element={<DailyReport />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

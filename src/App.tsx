import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import HomePage from "@/pages/HomePage"
import ReportPage from "@/pages/ReportPage"
import AuthPage from "@/pages/AuthPage"
import HistoryPage from "@/pages/HistoryPage"

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" theme="dark" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { HomePage } from "./pages/HomePage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { SkillsPage } from "./pages/SkillsPage";
import { MoneyPage } from "./pages/MoneyPage";
import { NotesPage } from "./pages/NotesPage";
import { DailyPage } from "./pages/DailyPage";
import { FounderPage } from "./pages/FounderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/money" element={<MoneyPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/daily" element={<DailyPage />} />
            <Route path="/founder" element={<FounderPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

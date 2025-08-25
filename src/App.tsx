import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CustomerApp from "./pages/CustomerApp";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedDriverRoute from "./components/ProtectedDriverRoute";
import PantaBilenDriverAppNew from './components/Driver/PantaBilenDriverAppNew';

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              <Route 
                path="/customer-app" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerApp />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/driver-app" 
                element={
                  <ProtectedDriverRoute>
                    <PantaBilenDriverAppNew />
                  </ProtectedDriverRoute>
                } 
              />
              {/* Catch-all route for any unmatched paths */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
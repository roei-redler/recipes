import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/Toast';
import HomePage from './pages/HomePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import AddEditRecipePage from './pages/AddEditRecipePage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/add" element={<AddEditRecipePage />} />
        <Route path="/edit/:id" element={<AddEditRecipePage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <TooltipProvider>
        <HashRouter>
          <AnimatedRoutes />
        </HashRouter>
      </TooltipProvider>
    </ToastProvider>
  );
}

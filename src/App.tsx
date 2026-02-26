import { createHashRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/Toast';
import HomePage from './pages/HomePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import AddEditRecipePage from './pages/AddEditRecipePage';
import NotFoundPage from './pages/NotFoundPage';

function AppShell() {
  const location = useLocation();
  return (
    <ToastProvider>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </TooltipProvider>
    </ToastProvider>
  );
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'recipe/:id', element: <RecipeDetailPage /> },
      { path: 'add', element: <AddEditRecipePage /> },
      { path: 'edit/:id', element: <AddEditRecipePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

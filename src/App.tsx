import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from './components/ToastProvider';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;

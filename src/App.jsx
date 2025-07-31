import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';

// 개발환경에서는 BrowserRouter, 배포환경에서는 HashRouter
const Router = import.meta.env.DEV ? BrowserRouter : HashRouter;
import HomePage from './pages/HomePage';
import SightTranslationPage from './pages/SightTranslationPage';
import SimultaneousPage from './pages/SimultaneousPage';
import PracticePage from './pages/PracticePage';
import ResultsPage from './pages/ResultsPage';
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sight-translation" element={<SightTranslationPage />} />
          <Route path="/simultaneous" element={<SimultaneousPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App

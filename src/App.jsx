import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';

// 개발환경에서는 BrowserRouter, 배포환경에서는 HashRouter
const Router = import.meta.env.DEV ? BrowserRouter : HashRouter;
import HomePage from './pages/HomePage';
import SightTranslationPage from './pages/SightTranslationPage';
import SimultaneousPage from './pages/SimultaneousPage';
import PracticePage from './pages/PracticePage';
import ResultsPage from './pages/ResultsPage';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={
              <ErrorBoundary>
                <HomePage />
              </ErrorBoundary>
            } />
            <Route path="/sight-translation" element={
              <ErrorBoundary>
                <SightTranslationPage />
              </ErrorBoundary>
            } />
            <Route path="/simultaneous" element={
              <ErrorBoundary>
                <SimultaneousPage />
              </ErrorBoundary>
            } />
            <Route path="/practice" element={
              <ErrorBoundary>
                <PracticePage />
              </ErrorBoundary>
            } />
            <Route path="/results" element={
              <ErrorBoundary>
                <ResultsPage />
              </ErrorBoundary>
            } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App

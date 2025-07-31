import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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

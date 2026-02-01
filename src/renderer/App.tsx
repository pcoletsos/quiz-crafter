import { useEffect, useState } from "react";
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import QuizEditor from "./pages/QuizEditor";
import QuestionEditor from "./pages/QuestionEditor";
import Player from "./pages/Player";
import Results from "./pages/Results";

const App = () => {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    window.quizCrafter
      .getAppVersion()
      .then(setVersion)
      .catch(() => setVersion(""));
  }, []);

  return (
    <HashRouter>
      <div className="app">
        <header className="app__header">
          <div className="app__brand">
            <span className="app__logo">QC</span>
            <div>
              <h1>Quiz Crafter</h1>
              <p className="app__subtitle">Local quiz builder and player</p>
            </div>
          </div>
          <nav className="app__nav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/quiz-editor">Quiz Editor</NavLink>
            <NavLink to="/question-editor">Question Editor</NavLink>
            <NavLink to="/player">Player</NavLink>
            <NavLink to="/results">Results</NavLink>
          </nav>
        </header>

        <main className="app__content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz-editor" element={<QuizEditor />} />
            <Route path="/question-editor" element={<QuestionEditor />} />
            <Route path="/player" element={<Player />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>

        <footer className="app__footer">
          <span>Local-only prototype · No cloud sync</span>
          {version && <span>App version {version}</span>}
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;

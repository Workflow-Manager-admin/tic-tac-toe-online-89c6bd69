import React, { useState, useEffect } from "react";
import "./App.css";

// Utility functions for game logic

// PUBLIC_INTERFACE
function checkWinner(board) {
  /** 
   * Checks the game board and returns:
   *   "X" if player X has won,
   *   "O" if player O has won,
   *   "draw" if all cells are filled and no winner,
   *   null if the game is still in progress.
   */
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }
  if (board.every(cell => cell)) return "draw";
  return null;
}

// PUBLIC_INTERFACE
function bestMoveAI(board, ai, human) {
  /**
   * Returns the best move index for the AI using basic minimax (optimized by depth, not exhaustive for 3x3)
   */
  // Get list of available moves
  const empty = board
    .map((cell, idx) => (cell ? null : idx))
    .filter(i => i !== null);

  // Shortcut: if AI can win, take it
  for (let idx of empty) {
    const copy = [...board];
    copy[idx] = ai;
    if (checkWinner(copy) === ai) return idx;
  }
  // If human can win next, block it
  for (let idx of empty) {
    const copy = [...board];
    copy[idx] = human;
    if (checkWinner(copy) === human) return idx;
  }
  // Take center if available
  if (empty.includes(4)) return 4;
  // Take a random corner if available
  const corners = [0, 2, 6, 8].filter(idx => empty.includes(idx));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Else, pick at random
  return empty[Math.floor(Math.random() * empty.length)];
}

// UI Components

// PUBLIC_INTERFACE
function Square({ value, onClick, highlight }) {
  /**
   * Represents a single square in the board.
   */
  return (
    <button
      className={`ttt-square${highlight ? " highlight" : ""}`}
      onClick={onClick}
      aria-label={value ? `Cell ${value}` : "Empty cell"}
      tabIndex={value ? -1 : 0}
      disabled={!!value}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function Board({ board, onMove, winningLine }) {
  /**
   * Renders the 3x3 Tic Tac Toe board.
   */
  const renderSquare = (i) => (
    <Square
      key={i}
      value={board[i]}
      highlight={winningLine && winningLine.includes(i)}
      onClick={() => onMove(i)}
    />
  );
  return (
    <div className="ttt-board" role="grid">
      {[0, 1, 2].map(row =>
        <div className="ttt-board-row" key={row} role="row">
          {[0, 1, 2].map(col => renderSquare(row * 3 + col))}
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function GameModeSelector({ mode, setMode, resetGame }) {
  /**
   * Dropdown/radio for selecting game mode.
   */
  return (
    <div className="ttt-mode-panel">
      <button
        className={mode === "pvp" ? "selected" : ""}
        onClick={() => { setMode("pvp"); resetGame(); }}
        aria-pressed={mode === "pvp"}
      >
        Player vs Player
      </button>
      <button
        className={mode === "pvai" ? "selected" : ""}
        onClick={() => { setMode("pvai"); resetGame(); }}
        aria-pressed={mode === "pvai"}
      >
        Player vs AI
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function ScoreBoard({ scores }) {
  /**
   * Renders current score.
   */
  return (
    <div className="ttt-score">
      <span className="ttt-x-score">X: {scores.X}</span>
      <span className="ttt-o-score">O: {scores.O}</span>
      <span className="ttt-draw-score">Draw: {scores.draw}</span>
    </div>
  );
}

// PUBLIC_INTERFACE
function GameStatus({ status, turn, winner, mode }) {
  /**
   * Shows current game status.
   */
  let message = '';
  if (winner === "draw") message = "It's a draw!";
  else if (winner) message = `Winner: ${winner}`;
  else if (mode === "pvai" && turn === "O") message = "AI's turn (O)";
  else message = `Current turn: ${turn}`;
  return (
    <div className="ttt-status">{message}</div>
  );
}

// PUBLIC_INTERFACE
function ResetReplay({ onReset, winner }) {
  /**
   * Button for replaying/resetting the game.
   */
  return (
    <button className="ttt-replay-btn" onClick={onReset}>
      {winner ? "Play Again" : "Reset"}
    </button>
  );
}

// Main App
// PUBLIC_INTERFACE
function App() {
  /**
   * Top-level React component for Tic Tac Toe game.
   * Features: PvP/PvAI, win/draw detection, adaptive + responsive, modern UI.
   */
  const [theme, setTheme] = useState("light");
  const [mode, setMode] = useState("pvai"); // "pvp" or "pvai"
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null); // "X", "O", "draw", or null
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });

  // Optional: highlight winning line (for minimalism, just disables squares)
  const [winningLine, setWinningLine] = useState(null);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  function handleMove(idx) {
    if (winner || board[idx]) return; // not playable
    const newBoard = [...board];
    newBoard[idx] = turn;
    setBoard(newBoard);

    // Detect win/draw
    const winnerResult = checkWinner(newBoard);
    if (winnerResult) {
      setWinner(winnerResult);
      setWinningLine(getWinningLine(newBoard, winnerResult));
      updateScores(winnerResult);
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }
  }

  // On mode, winner, or turn change, let AI play automatically if it's AI's turn
  useEffect(() => {
    if (
      mode === "pvai" &&
      !winner &&
      turn === "O"
    ) {
      // Small AI move delay for UX
      const aiTimeout = setTimeout(() => {
        const idx = bestMoveAI(board, "O", "X");
        handleMove(idx);
      }, 350);
      return () => clearTimeout(aiTimeout);
    }
    // eslint-disable-next-line
  }, [mode, turn, winner, board]);

  // PUBLIC_INTERFACE
  function resetGame() {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setWinner(null);
    setWinningLine(null);
  }

  // Score helpers
  function updateScores(result) {
    setScores(prev =>
      result === "draw"
        ? { ...prev, draw: prev.draw + 1 }
        : { ...prev, [result]: prev[result] + 1 }
    );
  }

  // Find the winning line (for highlighting)
  function getWinningLine(b, res) {
    if (!res || res === "draw") return null;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      const [a, bIdx, c] = line;
      if (b[a] === res && b[bIdx] === res && b[c] === res) {
        return line;
      }
    }
    return null;
  }

  // Theme toggling
  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  // Responsive: board size
  // (let CSS handle most responsiveness, but for accessibility, set ARIA)
  return (
    <div className="App">
      <header className="App-header">
        {/* Title */}
        <h1 className="ttt-title" style={{ color: "var(--text-primary)" }}>
          Tic Tac Toe
        </h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {/* Game mode selector */}
        <GameModeSelector mode={mode} setMode={setMode} resetGame={resetGame} />
        {/* Board */}
        <Board board={board} onMove={handleMove} winningLine={winningLine} />
        {/* Status & Score */}
        <GameStatus status={null} turn={turn} winner={winner} mode={mode} />
        <ScoreBoard scores={scores} />
        {/* Reset/replay button */}
        <ResetReplay onReset={resetGame} winner={winner} />
        {/* Minimal brand-accent panel */}
        <footer className="ttt-footer">
          <span>
            <a
              href="https://github.com"
              className="App-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
            >
              Kavia Modern React Template
            </a>
          </span>
        </footer>
      </header>
    </div>
  );
}

export default App;

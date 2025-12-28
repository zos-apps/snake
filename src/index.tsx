import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SnakeProps {
  onClose: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

const Snake: React.FC<SnakeProps> = ({ onClose }) => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('zos-snake-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const directionRef = useRef(direction);
  directionRef.current = direction;

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(true);
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const dir = directionRef.current;

      switch (dir) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('zos-snake-highscore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
        setSpeed(s => Math.max(50, s - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isPaused, generateFood, highScore]);

  useEffect(() => {
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [moveSnake, speed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          setIsPaused(p => !p);
        }
        return;
      }

      if (isPaused || gameOver) return;

      const keyDirections: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };

      const newDir = keyDirections[e.key];
      if (!newDir) return;

      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
      };

      if (opposites[newDir] !== directionRef.current) {
        setDirection(newDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, gameOver, resetGame]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 p-4">
      {/* Header */}
      <div className="flex justify-between w-full max-w-md mb-4">
        <div className="text-green-400 font-mono">
          <div className="text-xs text-green-600">SCORE</div>
          <div className="text-2xl">{score}</div>
        </div>
        <div className="text-4xl">🐍</div>
        <div className="text-green-400 font-mono text-right">
          <div className="text-xs text-green-600">HIGH SCORE</div>
          <div className="text-2xl">{highScore}</div>
        </div>
      </div>

      {/* Game board */}
      <div
        className="relative border-4 border-green-700 bg-gray-800"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {Array(GRID_SIZE).fill(null).map((_, i) => (
            <div key={i} className="absolute w-full border-t border-green-500" style={{ top: i * CELL_SIZE }} />
          ))}
          {Array(GRID_SIZE).fill(null).map((_, i) => (
            <div key={i} className="absolute h-full border-l border-green-500" style={{ left: i * CELL_SIZE }} />
          ))}
        </div>

        {/* Snake */}
        {snake.map((seg, i) => (
          <div
            key={i}
            className={`absolute rounded-sm ${i === 0 ? 'bg-green-400' : 'bg-green-500'}`}
            style={{
              left: seg.x * CELL_SIZE + 1,
              top: seg.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          >
            {i === 0 && (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {direction === 'UP' ? '👀' : direction === 'DOWN' ? '👀' : direction === 'LEFT' ? '👀' : '👀'}
              </div>
            )}
          </div>
        ))}

        {/* Food */}
        <div
          className="absolute flex items-center justify-center text-lg"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          🍎
        </div>

        {/* Overlays */}
        {(isPaused || gameOver) && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            {gameOver ? (
              <>
                <div className="text-4xl mb-4">💀</div>
                <div className="text-red-500 text-2xl font-bold mb-2">GAME OVER</div>
                <div className="text-green-400 mb-4">Score: {score}</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">⏸️</div>
                <div className="text-green-400 text-xl mb-2">PAUSED</div>
              </>
            )}
            <div className="text-gray-400 text-sm">Press SPACE to {gameOver ? 'restart' : 'continue'}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 text-gray-500 text-sm text-center">
        <p>Arrow Keys or WASD to move</p>
        <p>SPACE to pause/start</p>
      </div>
    </div>
  );
};

export default Snake;

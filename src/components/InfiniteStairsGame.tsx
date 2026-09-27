import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameResult } from '../types';
import { 
  playStepSound, 
  playTurnSound, 
  playComboSound, 
  playObstacleHitSound, 
  playTimerTickSound, 
  playGameOverWhistle,
  setAudioMuted,
  isAudioMuted,
  triggerHaptic
} from '../utils/sound';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Sparkles, 
  AlertCircle, 
  ArrowUp, 
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  Smartphone
} from 'lucide-react';

interface Props {
  onGameOver: (result: GameResult) => void;
  studentName: string;
}

interface Stair {
  id: number;
  x: number; // relative track position
  direction: 'left' | 'right'; // direction relative to previous stair
  obstacle?: 'zap' | 'crack' | 'coin';
  coinCollected?: boolean;
}

const TOTAL_GAME_TIME = 30.0; // 30.0 seconds strict

export const InfiniteStairsGame: React.FC<Props> = ({ onGameOver, studentName }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_GAME_TIME);
  const [steps, setSteps] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [obstaclesDodged, setObstaclesDodged] = useState<number>(0);
  const [isFever, setIsFever] = useState<boolean>(false);
  const [isStunned, setIsStunned] = useState<boolean>(false);
  const [stunMessage, setStunMessage] = useState<string>('');
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; text: string; color: string }>>([]);

  // Tablet Optimization States
  const [isReversedControls, setIsReversedControls] = useState<boolean>(false); // Left/Right thumb swap
  const [isMuted, setIsMutedState] = useState<boolean>(isAudioMuted());
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false); // Expanded tablet immersive mode
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Character facing direction: 'left' | 'right'
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [currentStairIndex, setCurrentStairIndex] = useState<number>(0);

  // Stairs array
  const [stairs, setStairs] = useState<Stair[]>([]);

  // Refs for animation loop and tick tracking
  const startTimeRef = useRef<number>(0);
  const lastTickSecondRef = useRef<number>(30);
  const isStunnedRef = useRef<boolean>(false);
  isStunnedRef.current = isStunned;

  // Generate stairs sequence
  const generateStairs = useCallback((count: number, startIndex: number = 0, startX: number = 0): Stair[] => {
    const list: Stair[] = [];
    let currentX = startX;
    let currentDir: 'left' | 'right' = 'right';

    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      // Zigzag algorithm with dynamic turns
      if (idx === 0) {
        currentX = 0;
        currentDir = 'right';
      } else {
        // Change direction with ~45% probability
        if (Math.random() < 0.45) {
          currentDir = currentDir === 'left' ? 'right' : 'left';
        }
        currentX = currentDir === 'left' ? currentX - 1 : currentX + 1;
      }

      // Obstacle generator (after first 3 stairs)
      let obstacle: 'zap' | 'crack' | 'coin' | undefined = undefined;
      if (idx > 3) {
        const rand = Math.random();
        if (rand < 0.12) {
          obstacle = 'zap';
        } else if (rand < 0.22) {
          obstacle = 'crack';
        } else if (rand < 0.36) {
          obstacle = 'coin';
        }
      }

      list.push({
        id: idx,
        x: currentX,
        direction: currentDir,
        obstacle,
      });
    }
    return list;
  }, []);

  // Initialize stairs
  useEffect(() => {
    const initialStairs = generateStairs(90, 0, 0);
    setStairs(initialStairs);
    setCurrentStairIndex(0);
    setFacing('right');
  }, [generateStairs]);

  // Floating score feedback
  const addFloatingText = (text: string, color: string = 'text-yellow-400') => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev.slice(-4), { id, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 850);
  };

  // Sound toggle handler
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMutedState(next);
    setAudioMuted(next);
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setTimeLeft(TOTAL_GAME_TIME);
    setSteps(0);
    setCombo(0);
    setMaxCombo(0);
    setObstaclesDodged(0);
    setIsFever(false);
    setIsStunned(false);
    startTimeRef.current = performance.now();
    lastTickSecondRef.current = 30;
    triggerHaptic(25);
    playStepSound();
  };

  // Trigger stun / penalty
  const triggerStun = (reason: string) => {
    setIsStunned(true);
    setStunMessage(reason);
    setScreenShake(true);
    triggerHaptic(60);
    playObstacleHitSound();
    setCombo(0);
    setIsFever(false);
    addFloatingText(reason, 'text-red-400');

    // Step penalty (-2 steps min 0)
    setSteps((prev) => Math.max(0, prev - 2));

    setTimeout(() => {
      setScreenShake(false);
    }, 350);

    setTimeout(() => {
      setIsStunned(false);
      setStunMessage('');
    }, 650);
  };

  // Action: Climb (계단 오르기)
  const handleClimb = useCallback(() => {
    if (gameState !== 'playing' || isStunnedRef.current) return;

    triggerHaptic(15);
    const nextIndex = currentStairIndex + 1;
    if (nextIndex >= stairs.length - 20) {
      // Append more stairs dynamically
      const last = stairs[stairs.length - 1];
      const newBatch = generateStairs(50, stairs.length, last.x);
      setStairs((prev) => [...prev, ...newBatch]);
    }

    const nextStair = stairs[nextIndex];
    if (!nextStair) return;

    const requiredDir = nextStair.direction;

    if (facing === requiredDir) {
      // SUCCESSFUL STEP
      playStepSound();
      setCurrentStairIndex(nextIndex);
      
      const multiplier = isFever ? 2 : 1;
      const stepGain = 1 * multiplier;
      setSteps((s) => s + stepGain);

      setCombo((c) => {
        const newCombo = c + 1;
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        if (newCombo % 5 === 0) playComboSound(newCombo);
        if (newCombo >= 10 && !isFever) {
          setIsFever(true);
          addFloatingText('🔥 2X FEVER MODE!', 'text-amber-400');
        }
        return newCombo;
      });

      // Handle obstacle on landed stair
      if (nextStair.obstacle === 'coin' && !nextStair.coinCollected) {
        nextStair.coinCollected = true;
        setSteps((s) => s + 3);
        addFloatingText('⭐ 보너스 +3!', 'text-yellow-300');
        triggerHaptic(30);
        playComboSound(15);
      } else if (nextStair.obstacle === 'zap') {
        if (Math.random() < 0.45) {
          triggerStun('⚡ 감전 트랩! (-2계단)');
        } else {
          setObstaclesDodged((d) => d + 1);
          addFloatingText('⚡ 회피 성공!', 'text-cyan-300');
        }
      } else if (nextStair.obstacle === 'crack') {
        setObstaclesDodged((d) => d + 1);
      }
    } else {
      // MISSTEP: Tried to climb forward when turn is required
      triggerStun('삐끗! 방향 전환 필요');
    }
  }, [currentStairIndex, facing, generateStairs, isFever, maxCombo, stairs, gameState]);

  // Action: Turn & Climb (방향 전환 후 오르기)
  const handleTurn = useCallback(() => {
    if (gameState !== 'playing' || isStunnedRef.current) return;

    triggerHaptic(20);
    const newFacing = facing === 'left' ? 'right' : 'left';
    setFacing(newFacing);
    playTurnSound();

    const nextIndex = currentStairIndex + 1;
    if (nextIndex >= stairs.length - 20) {
      const last = stairs[stairs.length - 1];
      const newBatch = generateStairs(50, stairs.length, last.x);
      setStairs((prev) => [...prev, ...newBatch]);
    }

    const nextStair = stairs[nextIndex];
    if (!nextStair) return;

    if (newFacing === nextStair.direction) {
      setCurrentStairIndex(nextIndex);
      const multiplier = isFever ? 2 : 1;
      const stepGain = 1 * multiplier;
      setSteps((s) => s + stepGain);

      setCombo((c) => {
        const newCombo = c + 1;
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        if (newCombo % 5 === 0) playComboSound(newCombo);
        if (newCombo >= 10 && !isFever) {
          setIsFever(true);
          addFloatingText('🔥 2X FEVER MODE!', 'text-amber-400');
        }
        return newCombo;
      });

      if (nextStair.obstacle === 'coin' && !nextStair.coinCollected) {
        nextStair.coinCollected = true;
        setSteps((s) => s + 3);
        addFloatingText('⭐ 보너스 +3!', 'text-yellow-300');
        triggerHaptic(30);
        playComboSound(15);
      } else if (nextStair.obstacle === 'zap') {
        if (Math.random() < 0.45) {
          triggerStun('⚡ 감전 트랩! (-2계단)');
        } else {
          setObstaclesDodged((d) => d + 1);
        }
      }
    } else {
      triggerStun('삐끗! 반대 방향');
    }
  }, [currentStairIndex, facing, generateStairs, isFever, maxCombo, stairs, gameState]);

  // Keyboard controls listener (tablet keyboard or desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.code === 'Space' && gameState === 'ready') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyZ') {
        e.preventDefault();
        handleClimb();
      } else if (
        e.code === 'ShiftLeft' || 
        e.code === 'ShiftRight' || 
        e.code === 'ArrowLeft' || 
        e.code === 'ArrowRight' || 
        e.code === 'KeyX'
      ) {
        e.preventDefault();
        handleTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleClimb, handleTurn]);

  // Game Loop for strict 30.0s Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TOTAL_GAME_TIME - elapsed);
      setTimeLeft(remaining);

      // Sound ticks for last 5 seconds
      const currentSecondFloor = Math.ceil(remaining);
      if (currentSecondFloor <= 5 && currentSecondFloor < lastTickSecondRef.current) {
        playTimerTickSound(true);
        lastTickSecondRef.current = currentSecondFloor;
      }

      if (remaining <= 0) {
        clearInterval(interval);
        setGameState('ended');
        playGameOverWhistle();

        // Calculate rank title
        let rankTitle = '계단 비기너';
        if (steps >= 70) rankTitle = '⚡ 초음속 계단 신 (GOD)';
        else if (steps >= 50) rankTitle = '🏆 계단 마스터 (MASTER)';
        else if (steps >= 35) rankTitle = '🔥 계단 고수 (PRO)';
        else if (steps >= 20) rankTitle = '🏃 계단 챌린저';

        onGameOver({
          steps,
          maxCombo,
          obstaclesDodged,
          rankTitle,
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, maxCombo, obstaclesDodged, onGameOver, steps]);

  // Visible stairs for rendering (window of stairs around current character)
  const renderStairs = stairs.slice(
    Math.max(0, currentStairIndex - 2),
    Math.min(stairs.length, currentStairIndex + 14)
  );

  // Tablet button definitions depending on left/right hand preference
  const turnButtonConfig = {
    key: 'turn',
    title: '방향 전환',
    subText: isReversedControls ? '오른쪽 엄지' : '왼쪽 엄지',
    shortcut: '[Shift / ← →]',
    icon: <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />,
    gradient: 'from-blue-600 via-indigo-600 to-indigo-800 border-blue-400/50 shadow-blue-500/30',
    activeGradient: 'active:from-blue-700 active:to-indigo-900',
    handler: handleTurn,
  };

  const climbButtonConfig = {
    key: 'climb',
    title: '계단 오르기',
    subText: isReversedControls ? '왼쪽 엄지' : '오른쪽 엄지',
    shortcut: '[Space / ↑]',
    icon: <ArrowUp className="w-9 h-9 sm:w-11 sm:h-11 mb-1 animate-bounce-subtle" />,
    gradient: 'from-emerald-500 via-teal-500 to-emerald-700 border-emerald-300/60 shadow-emerald-500/40',
    activeGradient: 'active:from-emerald-600 active:to-teal-800',
    handler: handleClimb,
  };

  const leftButton = isReversedControls ? climbButtonConfig : turnButtonConfig;
  const rightButton = isReversedControls ? turnButtonConfig : climbButtonConfig;

  return (
    <div
      id="tablet-game-container"
      className={`relative w-full select-none transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl ${
        isTheaterMode
          ? 'fixed inset-0 z-50 rounded-none bg-slate-950 border-0 h-screen w-screen'
          : 'max-w-4xl mx-auto h-[min(84vh,740px)] min-h-[580px] rounded-3xl border-4 border-indigo-900/90 bg-gradient-to-b from-indigo-950 via-slate-950 to-indigo-950'
      } ${screenShake ? 'animate-shake' : ''} ${isFever ? 'ring-4 ring-orange-500/80 animate-fever-glow' : ''}`}
    >
      {/* Top Tablet HUD Bar */}
      <div className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-black/60 backdrop-blur-md border-b border-indigo-800/60 text-white">
        {/* Left: Timer Box */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-2xl font-mono text-base sm:text-xl font-black border transition-all ${
              timeLeft <= 5.0
                ? 'bg-red-600/95 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-indigo-950/90 text-amber-400 border-amber-500/50 shadow-inner'
            }`}
          >
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{timeLeft.toFixed(1)}s</span>
          </div>

          <div className="hidden md:flex flex-col text-left">
            <span className="text-[11px] font-bold text-indigo-200">30초 타임어택</span>
            <span className="text-[10px] text-gray-400">태블릿 양손 터치 지원</span>
          </div>
        </div>

        {/* Center: Steps / Floor & Combo Counter */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-amber-300 drop-shadow-[0_2px_12px_rgba(245,158,11,0.7)]">
              {steps}
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-300">층</span>
          </div>

          {combo > 2 && (
            <div
              className={`text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1 transition-all ${
                isFever ? 'text-orange-400 animate-bounce' : 'text-cyan-300'
              }`}
            >
              {isFever && <Flame className="w-4 h-4 fill-orange-400" />}
              <span>{combo} COMBO!</span>
              {isFever && <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">2배</span>}
            </div>
          )}
        </div>

        {/* Right: Tablet Quick Controls & Student Tag */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right mr-1">
            <div className="text-[10px] text-gray-400">플레이어</div>
            <div className="text-xs font-bold text-indigo-200 truncate max-w-[90px]">
              {studentName}
            </div>
          </div>

          {/* Hand swap toggle */}
          <button
            type="button"
            onClick={() => setIsReversedControls((prev) => !prev)}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 flex items-center gap-1 text-xs font-semibold active:scale-95 transition"
            title="손잡이 변경 (오르기/방향전환 버튼 위치 반전)"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden lg:inline text-[11px]">{isReversedControls ? '오른손 오르기' : '왼손 오르기'}</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border active:scale-95 transition ${
              isMuted 
                ? 'bg-red-950/80 border-red-700 text-red-300' 
                : 'bg-indigo-900/70 border-indigo-700/60 text-indigo-200 hover:bg-indigo-800'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen / Theater Toggle for Tablet */}
          <button
            type="button"
            onClick={() => setIsTheaterMode((prev) => !prev)}
            className="p-2 rounded-xl bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 active:scale-95 transition"
            title={isTheaterMode ? '창 모드로 복귀' : '태블릿 전체화면 모드'}
          >
            {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar (Time Remaining) */}
      <div className="w-full h-2 bg-gray-900/80">
        <div
          className={`h-full transition-all duration-75 ${
            timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gradient-to-r from-emerald-400 via-amber-400 to-indigo-400'
          }`}
          style={{ width: `${(timeLeft / TOTAL_GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Main Game Stage Area */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        {/* Parallax Skyline & Arcade Neon Stars */}
        <div 
          className="absolute inset-0 opacity-40 bg-[radial-gradient(#818cf8_1.2px,transparent_1.2px)] [background-size:20px_20px] transition-transform duration-300"
          style={{ transform: `translateY(${steps * 2}px)` }}
        />

        {/* Ambient Neon Backlights */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating popups (COMBO / STUN / FEVER) */}
        <div className="absolute top-6 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
          {floatingTexts.map((f) => (
            <div
              key={f.id}
              className={`text-xl sm:text-2xl font-black ${f.color} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-fade-in`}
            >
              {f.text}
            </div>
          ))}
        </div>

        {/* Isometric Staircase Canvas */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* World Container anchored dynamically to the character */}
          <div
            className="relative transition-transform duration-120 ease-out"
            style={{
              transform: `translate(${-((stairs[currentStairIndex]?.x || 0) * 48)}px, ${currentStairIndex * 36 - 20}px)`,
            }}
          >
            {renderStairs.map((stair) => {
              const isCurrent = stair.id === currentStairIndex;
              const posX = stair.x * 48;
              const posY = -stair.id * 36;

              return (
                <div
                  key={stair.id}
                  className="absolute transition-opacity duration-200"
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    width: '96px',
                    height: '32px',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Stair 3D block with responsive bevel and shadows */}
                  <div
                    className={`relative w-full h-full rounded-xl border-2 transition-all ${
                      isCurrent
                        ? 'bg-amber-400 border-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-105'
                        : isFever
                        ? 'bg-gradient-to-b from-orange-500 to-amber-600 border-orange-300 shadow-md shadow-orange-900/50'
                        : 'bg-gradient-to-b from-indigo-600 to-indigo-800 border-indigo-400/80 shadow-md shadow-indigo-950/60'
                    }`}
                  >
                    {/* Stair Top Accent Reflection */}
                    <div className="absolute inset-x-1.5 top-0.5 h-2 rounded bg-white/35" />

                    {/* Step Number Badge */}
                    <div className="absolute right-2 bottom-1 text-[9px] font-bold text-white/50">
                      {stair.id}
                    </div>

                    {/* Stair Obstacles */}
                    {stair.obstacle === 'zap' && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center text-cyan-300 animate-bounce">
                        <Zap className="w-6 h-6 fill-cyan-400 stroke-cyan-100 drop-shadow-[0_0_10px_cyan]" />
                      </div>
                    )}
                    {stair.obstacle === 'crack' && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-200 bg-amber-950/90 border border-amber-600/60 px-1.5 py-0.2 rounded-md shadow-sm">
                        CRACK
                      </div>
                    )}
                    {stair.obstacle === 'coin' && !stair.coinCollected && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center text-yellow-300 animate-pulse">
                        <Sparkles className="w-6 h-6 fill-yellow-400 drop-shadow-[0_0_12px_gold]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* The Climbing Character */}
            {stairs[currentStairIndex] && (
              <div
                className={`absolute z-20 transition-all duration-100 ${
                  isStunned ? 'opacity-80 animate-wiggle' : ''
                }`}
                style={{
                  left: `${(stairs[currentStairIndex]?.x || 0) * 48}px`,
                  top: `${-(currentStairIndex * 36) - 40}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Character avatar */}
                <div className={`relative flex flex-col items-center ${
                  facing === 'left' ? '-scale-x-100' : 'scale-x-100'
                }`}>
                  {/* Crown or Fever Fire */}
                  {isFever ? (
                    <div className="absolute -top-5 text-orange-400 animate-pulse">
                      <Flame className="w-7 h-7 fill-orange-400 drop-shadow-[0_0_10px_orange]" />
                    </div>
                  ) : (
                    <div className="text-xs mb-0.5 text-yellow-300">👑</div>
                  )}

                  {/* Character Head & Body */}
                  <div className={`w-10 h-10 rounded-2xl border-2 border-white flex items-center justify-center shadow-xl transition-colors ${
                    isStunned
                      ? 'bg-purple-600 animate-spin'
                      : isFever
                      ? 'bg-gradient-to-tr from-amber-500 to-red-500'
                      : 'bg-gradient-to-tr from-emerald-400 to-teal-500'
                  }`}>
                    <span className="text-lg">{isStunned ? '😵' : isFever ? '😎' : '😃'}</span>
                  </div>

                  {/* Legs */}
                  <div className="flex gap-2 mt-0.5">
                    <div className="w-3 h-3.5 rounded-full bg-indigo-950 border border-white/60" />
                    <div className="w-3 h-3.5 rounded-full bg-indigo-950 border border-white/60" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center mb-4 shadow-2xl shadow-amber-500/40 border-2 border-amber-200 animate-bounce-subtle">
              <Trophy className="w-11 h-11 text-white drop-shadow-md" />
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-amber-300">
              30초 무한의 계단 타임어택
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
              계단을 지그재그로 오르며 30초 동안 최대한 높은 층에 도달하세요!
              <br />
              <span className="text-amber-300 font-bold">⚡ 전기관문</span>과 <span className="text-orange-300 font-bold">균열 계단</span>을 조심하고, 
              <span className="text-yellow-300 font-bold">⭐ 보너스 별(+3)</span>을 모아 최고 랭크에 도전하세요!
            </p>

            {/* Tablet Dual-Thumb Guide Graphic */}
            <div className="w-full max-w-sm mb-6 p-3 rounded-2xl bg-indigo-950/70 border border-indigo-700/60 flex items-center justify-around text-xs text-indigo-200">
              <div className="flex flex-col items-center">
                <span className="font-extrabold text-blue-300">왼쪽 엄지</span>
                <span className="text-[11px] text-gray-300">방향 전환</span>
              </div>
              <div className="h-7 w-px bg-indigo-700" />
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>양손 엄지 플레이</span>
              </div>
              <div className="h-7 w-px bg-indigo-700" />
              <div className="flex flex-col items-center">
                <span className="font-extrabold text-emerald-300">오른쪽 엄지</span>
                <span className="text-[11px] text-gray-300">계단 오르기</span>
              </div>
            </div>

            {/* Big Start Button for Tablets */}
            <button
              type="button"
              onClick={startGame}
              className="w-full max-w-xs py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xl font-black text-white shadow-xl shadow-emerald-500/40 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition border-2 border-emerald-300/40"
            >
              게임 시작하기 (Start)
            </button>

            <div className="mt-4 text-[11px] text-gray-400 flex items-center gap-2">
              <span>키보드 사용 시: [Space / ↑]: 오르기, [Shift / ← →]: 방향전환</span>
            </div>
          </div>
        )}

        {/* Stun alert badge */}
        {isStunned && (
          <div className="absolute top-16 z-30 px-5 py-2 rounded-full bg-red-600/95 text-white font-black text-sm shadow-xl shadow-red-900/60 animate-bounce flex items-center gap-2 border-2 border-red-300">
            <AlertCircle className="w-5 h-5" />
            <span>{stunMessage}</span>
          </div>
        )}
      </div>

      {/* Tablet Ergonomic Dual-Thumb Action Controls */}
      <div 
        id="tablet-controls-bar"
        className="relative z-30 px-3 sm:px-6 py-3 sm:py-5 bg-slate-950/95 border-t border-indigo-900/80 backdrop-blur-md"
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-2xl mx-auto">
          {/* Left Thumb Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              leftButton.handler();
            }}
            disabled={gameState !== 'playing'}
            className={`flex flex-col items-center justify-center h-28 sm:h-32 md:h-36 rounded-3xl bg-gradient-to-b ${leftButton.gradient} text-white font-black shadow-2xl active:scale-95 ${leftButton.activeGradient} disabled:opacity-30 transition-all border-3 select-none touch-none`}
          >
            {leftButton.icon}
            <span className="text-lg sm:text-2xl font-black tracking-tight">{leftButton.title}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] sm:text-xs font-bold text-white/80">{leftButton.subText}</span>
              <span className="text-[10px] text-white/50 hidden sm:inline">{leftButton.shortcut}</span>
            </div>
          </button>

          {/* Right Thumb Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              rightButton.handler();
            }}
            disabled={gameState !== 'playing'}
            className={`flex flex-col items-center justify-center h-28 sm:h-32 md:h-36 rounded-3xl bg-gradient-to-b ${rightButton.gradient} text-white font-black shadow-2xl active:scale-95 ${rightButton.activeGradient} disabled:opacity-30 transition-all border-3 select-none touch-none`}
          >
            {rightButton.icon}
            <span className="text-lg sm:text-2xl font-black tracking-tight">{rightButton.title}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] sm:text-xs font-bold text-white/80">{rightButton.subText}</span>
              <span className="text-[10px] text-white/50 hidden sm:inline">{rightButton.shortcut}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

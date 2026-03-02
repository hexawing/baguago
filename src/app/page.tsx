'use client';

import { useState, useCallback, useEffect } from 'react';
import GoBoard from '@/components/bagua-go/GoBoard';
import GameInfo from '@/components/bagua-go/GameInfo';
import { GameState, Coord, BAGUA_DATA, Bagua } from '@/lib/bagua-go/types';
import { 
  initializeGame, 
  placeStone, 
  pass, 
  calculateTerritory,
  getGroup,
  calculateGroupLiberties
} from '@/lib/bagua-go/game';

// 卦位详情弹窗
function BaguaDetailModal({ 
  bagua, 
  onClose 
}: { 
  bagua: Bagua | null; 
  onClose: () => void;
}) {
  if (bagua === null) return null;
  
  const data = BAGUA_DATA[bagua];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg p-6 max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">{data.symbol}</div>
          <h2 className="text-2xl font-bold">{data.name}卦 · {data.meaning}</h2>
        </div>
        
        <div className="mt-4 space-y-3">
          <p className="text-gray-600 italic text-center">"{data.philosophy}"</p>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className={`p-2 rounded text-center ${data.xu ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <div className="font-medium">{data.xu ? '虚' : '实'}</div>
              <div className="text-xs text-gray-500">{data.xu ? '不可落子' : '可落子'}</div>
            </div>
            <div className={`p-2 rounded text-center ${data.tongQi ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className="font-medium">{data.tongQi ? '通气' : '不通'}</div>
              <div className="text-xs text-gray-500">{data.tongQi ? '有斜气' : '无斜气'}</div>
            </div>
            <div className={`p-2 rounded text-center ${data.gongSi ? 'bg-red-100' : 'bg-blue-100'}`}>
              <div className="font-medium">{data.gongSi ? '私' : '公'}</div>
              <div className="text-xs text-gray-500">{data.gongSi ? '+1目' : '-1目'}</div>
            </div>
          </div>
        </div>
        
        <button 
          className="mt-4 w-full py-2 bg-gray-100 rounded hover:bg-gray-200 transition"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

// 开局卦位展示
function BaguaOverview({ gameState }: { gameState: GameState }) {
  const baguaPositions: { coord: Coord; bagua: Bagua }[] = [];
  
  for (let y = 0; y < gameState.board.length; y++) {
    for (let x = 0; x < gameState.board[y].length; x++) {
      const cell = gameState.board[y][x];
      if (cell.state === 'bagua' && cell.baguaData) {
        baguaPositions.push({ coord: cell.coord, bagua: cell.baguaData.bagua });
      }
    }
  }
  
  return (
    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-2">本局卦位</h3>
      <div className="flex flex-wrap gap-2">
        {baguaPositions.map((pos, i) => {
          const data = BAGUA_DATA[pos.bagua];
          return (
            <div 
              key={i}
              className="px-2 py-1 bg-white rounded border text-sm flex items-center gap-1"
            >
              <span>{data.symbol}</span>
              <span className="text-gray-600">{data.name}</span>
              <span className="text-xs text-gray-400">
                ({String.fromCharCode(65 + pos.coord.x)}{19 - pos.coord.y})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 初始游戏状态（在组件外部初始化以避免在useEffect中设置状态）
const initialGameState = initializeGame();

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [hoverCoord, setHoverCoord] = useState<Coord | null>(null);
  const [selectedBagua, setSelectedBagua] = useState<Bagua | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  
  // 处理落子
  const handleCellClick = useCallback((coord: Coord) => {
    if (gameState.gameOver) return;
    
    // 检查是否点击卦位（显示详情）
    const cell = gameState.board[coord.y][coord.x];
    if (cell.state === 'bagua' && cell.baguaData && !cell.baguaData.stone) {
      if (cell.baguaData.xu) {
        // 虚卦显示详情
        setSelectedBagua(cell.baguaData.bagua);
        return;
      }
    }
    
    // 尝试落子
    const newState = placeStone(gameState, coord);
    if (newState) {
      setGameState(newState);
    }
  }, [gameState]);
  
  // 处理跳过
  const handlePass = useCallback(() => {
    if (gameState.gameOver) return;
    
    const newState = pass(gameState);
    setGameState(newState);
  }, [gameState]);
  
  // 新游戏
  const handleNewGame = useCallback(() => {
    setGameState(initializeGame());
    setShowOverview(true);
  }, []);
  
  // 计算领地
  const territory = calculateTerritory(gameState.board);
  
  // 鼠标移动
  const handleMouseMove = useCallback((coord: Coord) => {
    setHoverCoord(coord);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto flex gap-6 items-start justify-center">
        {/* 棋盘 */}
        <div 
          className="relative"
          onMouseLeave={() => setHoverCoord(null)}
        >
          <GoBoard 
            board={gameState.board}
            onCellClick={handleCellClick}
            hoverCoord={hoverCoord}
            currentPlayer={gameState.currentPlayer}
          />
          
          {/* 开局卦位概览 */}
          {showOverview && (
            <div className="absolute -bottom-4 left-0 right-4 transform translate-y-full">
              <BaguaOverview gameState={gameState} />
              <button 
                className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                onClick={() => setShowOverview(false)}
              >
                隐藏
              </button>
            </div>
          )}
        </div>
        
        {/* 游戏信息面板 */}
        <GameInfo
          currentPlayer={gameState.currentPlayer}
          blackCaptures={gameState.blackCaptures}
          whiteCaptures={gameState.whiteCaptures}
          gameOver={gameState.gameOver}
          winner={gameState.winner}
          onPass={handlePass}
          onNewGame={handleNewGame}
          blackTerritory={territory.black}
          whiteTerritory={territory.white}
        />
      </div>
      
      {/* 卦位详情弹窗 */}
      <BaguaDetailModal 
        bagua={selectedBagua} 
        onClose={() => setSelectedBagua(null)} 
      />
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { BoardCell, Coord, Bagua, BAGUA_DATA } from '@/lib/bagua-go/types';
import { STAR_POSITIONS } from '@/lib/bagua-go/game';

interface GoBoardProps {
  board: BoardCell[][];
  onCellClick: (coord: Coord) => void;
  hoverCoord: Coord | null;
  currentPlayer: 'black' | 'white';
}

// 卦位符号组件
function BaguaSymbol({ 
  bagua, 
  xu, 
  tongQi, 
  gongSi, 
  stone,
  size = 32 
}: { 
  bagua: Bagua;
  xu: boolean;
  tongQi: boolean;
  gongSi: boolean;
  stone?: 'black' | 'white';
  size?: number;
}) {
  const data = BAGUA_DATA[bagua];
  
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      {/* 背景圆 */}
      <circle 
        cx="20" cy="20" r="18" 
        fill={stone ? (stone === 'black' ? '#1a1a1a' : '#f5f5f5') : 'transparent'}
        stroke={stone ? (stone === 'black' ? '#333' : '#ccc') : 'transparent'}
        strokeWidth="1"
      />
      
      {/* 大空心圈 - 虚实（初爻） */}
      {xu && (
        <circle 
          cx="20" cy="20" r="16" 
          fill="none" 
          stroke={stone === 'white' ? '#333' : '#666'} 
          strokeWidth="2.5"
        />
      )}
      
      {/* 斜线 - 通气（中爻） */}
      {tongQi && (
        <>
          <line x1="8" y1="8" x2="32" y2="32" stroke={stone === 'white' ? '#333' : '#888'} strokeWidth="1.5" />
          <line x1="32" y1="8" x2="8" y2="32" stroke={stone === 'white' ? '#333' : '#888'} strokeWidth="1.5" />
        </>
      )}
      
      {/* 角标 - 公私（上爻） */}
      {gongSi ? (
        // 私卦：实心角标
        <path 
          d="M32,8 L32,16 L24,16 Z" 
          fill={stone === 'white' ? '#333' : '#e74c3c'}
          stroke={stone === 'white' ? '#555' : '#c0392b'}
          strokeWidth="0.5"
        />
      ) : (
        // 公卦：空心角标
        <path 
          d="M32,8 L32,16 L24,16 Z" 
          fill="none"
          stroke={stone === 'white' ? '#333' : '#3498db'}
          strokeWidth="1.5"
        />
      )}
      
      {/* 卦象符号（小字） */}
      <text 
        x="20" y="24" 
        textAnchor="middle" 
        fontSize="10" 
        fill={stone === 'white' ? '#333' : '#444'}
        fontWeight="bold"
      >
        {data.symbol}
      </text>
    </svg>
  );
}

// 棋子组件
function Stone({ color, size = 28 }: { color: 'black' | 'white'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <radialGradient id={`stone-grad-${color}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={color === 'black' ? '#555' : '#fff'} />
          <stop offset="100%" stopColor={color === 'black' ? '#111' : '#ddd'} />
        </radialGradient>
      </defs>
      <circle 
        cx="16" cy="16" r="14" 
        fill={`url(#stone-grad-${color})`}
        stroke={color === 'black' ? '#000' : '#999'}
        strokeWidth="0.5"
      />
    </svg>
  );
}

// 单元格组件
function BoardCellComponent({ 
  cell, 
  onClick, 
  isHovered,
  currentPlayer 
}: { 
  cell: BoardCell; 
  onClick: () => void; 
  isHovered: boolean;
  currentPlayer: 'black' | 'white';
}) {
  const isStarPoint = STAR_POSITIONS.some(p => p.x === cell.coord.x && p.y === cell.coord.y);
  
  // 判断是否可落子
  const canPlace = useMemo(() => {
    if (cell.state === 'empty') return true;
    if (cell.state === 'bagua' && !cell.baguaData!.xu && !cell.baguaData!.stone) return true;
    return false;
  }, [cell]);
  
  return (
    <div 
      className="relative w-full h-full cursor-pointer group"
      onClick={onClick}
    >
      {/* 星位点 */}
      {isStarPoint && cell.state === 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-gray-800" />
        </div>
      )}
      
      {/* 普通棋子 */}
      {cell.state === 'black' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Stone color="black" />
        </div>
      )}
      {cell.state === 'white' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Stone color="white" />
        </div>
      )}
      
      {/* 卦位 */}
      {cell.state === 'bagua' && cell.baguaData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <BaguaSymbol 
            bagua={cell.baguaData.bagua}
            xu={cell.baguaData.xu}
            tongQi={cell.baguaData.tongQi}
            gongSi={cell.baguaData.gongSi}
            stone={cell.baguaData.stone}
            size={28}
          />
        </div>
      )}
      
      {/* 悬停预览 */}
      {isHovered && canPlace && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className={`w-6 h-6 rounded-full opacity-50 ${
              currentPlayer === 'black' ? 'bg-gray-800' : 'bg-white border border-gray-400'
            }`}
          />
        </div>
      )}
      
      {/* 最后落子标记 */}
      {/* 可以添加最后落子的红点标记 */}
    </div>
  );
}

// 主棋盘组件
export default function GoBoard({ board, onCellClick, hoverCoord, currentPlayer }: GoBoardProps) {
  const boardSize = board.length;
  const cellSize = 28; // 每格大小
  
  return (
    <div className="relative bg-amber-100 p-4 rounded-lg shadow-lg">
      {/* 棋盘背景 */}
      <div 
        className="relative"
        style={{ 
          width: cellSize * boardSize + 2,
          height: cellSize * boardSize + 2 
        }}
      >
        {/* 网格线 */}
        <svg 
          className="absolute top-0 left-0"
          width={cellSize * boardSize + 2} 
          height={cellSize * boardSize + 2}
        >
          {/* 横线 */}
          {Array.from({ length: boardSize }).map((_, i) => (
            <line 
              key={`h-${i}`}
              x1={cellSize / 2 + 1} 
              y1={cellSize * i + cellSize / 2 + 1}
              x2={cellSize * boardSize - cellSize / 2 + 1} 
              y2={cellSize * i + cellSize / 2 + 1}
              stroke="#5c4033"
              strokeWidth="0.5"
            />
          ))}
          {/* 竖线 */}
          {Array.from({ length: boardSize }).map((_, i) => (
            <line 
              key={`v-${i}`}
              x1={cellSize * i + cellSize / 2 + 1} 
              y1={cellSize / 2 + 1}
              x2={cellSize * i + cellSize / 2 + 1} 
              y2={cellSize * boardSize - cellSize / 2 + 1}
              stroke="#5c4033"
              strokeWidth="0.5"
            />
          ))}
          {/* 星位 */}
          {STAR_POSITIONS.map((pos, i) => (
            <circle 
              key={`star-${i}`}
              cx={cellSize * pos.x + cellSize / 2 + 1}
              cy={cellSize * pos.y + cellSize / 2 + 1}
              r="3"
              fill="#5c4033"
            />
          ))}
        </svg>
        
        {/* 棋盘格子 */}
        <div 
          className="absolute top-0 left-0 grid"
          style={{ 
            gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
          }}
        >
          {board.map((row, y) =>
            row.map((cell, x) => (
              <BoardCellComponent
                key={`${x}-${y}`}
                cell={cell}
                onClick={() => onCellClick(cell.coord)}
                isHovered={hoverCoord?.x === x && hoverCoord?.y === y}
                currentPlayer={currentPlayer}
              />
            ))
          )}
        </div>
      </div>
      
      {/* 坐标标注 */}
      <div className="absolute -top-6 left-4 flex text-xs text-gray-600">
        {Array.from({ length: boardSize }).map((_, i) => (
          <div key={i} style={{ width: cellSize }} className="text-center">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <div className="absolute -left-6 top-4 flex flex-col text-xs text-gray-600">
        {Array.from({ length: boardSize }).map((_, i) => (
          <div key={i} style={{ height: cellSize }} className="flex items-center justify-center">
            {boardSize - i}
          </div>
        ))}
      </div>
    </div>
  );
}

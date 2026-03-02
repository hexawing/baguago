// 八卦围棋核心游戏逻辑

import { Bagua, BaguaPosition, BoardCell, Coord, GameState, GeneratedBagua, BAGUA_DATA } from './types';

// ============ 常量 ============
export const BOARD_SIZE = 19;

// 星位坐标（用于显示星位点）
export const STAR_POSITIONS: Coord[] = [
  { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
  { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
  { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 },
];

// ============ 卦位生成 ============

/**
 * 模拟骰子投掷（1-19）
 * 返回0表示无效（对应00或20）
 */
export function rollDice(): number {
  const result = Math.floor(Math.random() * 20); // 0-19
  if (result === 0) return 0; // 无效
  return result; // 1-19
}

/**
 * 生成八卦卦位
 * 共行八轮，每轮定一卦
 */
export function generateBaguaPositions(): GeneratedBagua[] {
  const positions: GeneratedBagua[] = [];
  const usedCoords = new Set<string>();
  
  const baguaOrder = [
    Bagua.Qian, Bagua.Dui, Bagua.Li, Bagua.Zhen,
    Bagua.Xun, Bagua.Kan, Bagua.Gen, Bagua.Kun
  ];
  
  for (let round = 0; round < 8; round++) {
    // 黑方掷纵路（Y坐标），白方掷横格（X坐标）
    const x = rollDice();
    const y = rollDice();
    
    // 任一为0则此轮无效
    if (x === 0 || y === 0) continue;
    
    const coord = { x: x - 1, y: y - 1 }; // 转换为0-18
    const key = `${coord.x},${coord.y}`;
    
    // 位置重复则重掷（最多重试3次）
    let retries = 0;
    while (usedCoords.has(key) && retries < 3) {
      const newX = rollDice();
      const newY = rollDice();
      if (newX === 0 || newY === 0) break;
      coord.x = newX - 1;
      coord.y = newY - 1;
      retries++;
    }
    
    if (!usedCoords.has(`${coord.x},${coord.y}`)) {
      positions.push({
        coord,
        bagua: baguaOrder[round]
      });
      usedCoords.add(`${coord.x},${coord.y}`);
    }
  }
  
  return positions;
}

// ============ 棋盘初始化 ============

/**
 * 创建空棋盘
 */
export function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: BoardCell[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push({
        coord: { x, y },
        state: 'empty'
      });
    }
    board.push(row);
  }
  return board;
}

/**
 * 初始化游戏棋盘（带卦位）
 */
export function initializeBoard(baguaPositions: GeneratedBagua[]): BoardCell[][] {
  const board = createEmptyBoard();
  
  for (const pos of baguaPositions) {
    const { x, y } = pos.coord;
    const baguaData = BAGUA_DATA[pos.bagua];
    
    board[y][x] = {
      coord: pos.coord,
      state: 'bagua',
      baguaData: {
        bagua: pos.bagua,
        xu: baguaData.xu,
        tongQi: baguaData.tongQi,
        gongSi: baguaData.gongSi,
        stone: undefined
      }
    };
  }
  
  return board;
}

/**
 * 初始化游戏状态
 */
export function initializeGame(): GameState {
  const baguaPositions = generateBaguaPositions();
  const board = initializeBoard(baguaPositions);
  
  return {
    board,
    currentPlayer: 'black',
    blackCaptures: 0,
    whiteCaptures: 0,
    history: [],
    passCount: 0,
    gameOver: false,
    blackTerritory: 0,
    whiteTerritory: 0
  };
}

// ============ 气数计算 ============

/**
 * 检查坐标是否在棋盘内
 */
export function isValidCoord(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

/**
 * 获取正交方向相邻点（上下左右）
 */
export function getOrthogonalNeighbors(coord: Coord): Coord[] {
  return [
    { x: coord.x, y: coord.y - 1 }, // 上
    { x: coord.x, y: coord.y + 1 }, // 下
    { x: coord.x - 1, y: coord.y }, // 左
    { x: coord.x + 1, y: coord.y },    // 右
  ].filter(c => isValidCoord(c.x, c.y));
}

/**
 * 获取斜角方向相邻点（四隅）
 */
export function getDiagonalNeighbors(coord: Coord): Coord[] {
  return [
    { x: coord.x - 1, y: coord.y - 1 }, // 左上
    { x: coord.x + 1, y: coord.y - 1 }, // 右上
    { x: coord.x - 1, y: coord.y + 1 }, // 左下
    { x: coord.x + 1, y: coord.y + 1 }, // 右下
  ].filter(c => isValidCoord(c.x, c.y));
}

/**
 * 检查一个点是否能提供正交气
 * 规则：可落子之空点才供正交气
 */
export function providesOrthogonalLiberty(cell: BoardCell): boolean {
  if (cell.state === 'empty') return true;
  if (cell.state === 'bagua') {
    // 卦位：只有实卦且为空才供正交气
    return !cell.baguaData!.xu && !cell.baguaData!.stone;
  }
  return false; // 有棋子不供气
}

/**
 * 检查一个点是否能提供斜角气
 * 规则：有斜线之空点供斜角气
 */
export function providesDiagonalLiberty(cell: BoardCell): boolean {
  if (cell.state === 'bagua') {
    // 卦位：有通气且为空才供斜气
    return cell.baguaData!.tongQi && !cell.baguaData!.stone;
  }
  return false; // 普通格不供斜气
}

/**
 * 获取一个棋子的气数
 */
export function calculateLiberties(
  board: BoardCell[][], 
  coord: Coord,
  visited: Set<string> = new Set()
): number {
  const key = `${coord.x},${coord.y}`;
  if (visited.has(key)) return 0;
  visited.add(key);
  
  const cell = board[coord.y][coord.x];
  const color = getStoneColor(cell);
  if (!color) return 0;
  
  let liberties = 0;
  
  // 正交方向：检查空点
  for (const neighbor of getOrthogonalNeighbors(coord)) {
    const neighborCell = board[neighbor.y][neighbor.x];
    if (providesOrthogonalLiberty(neighborCell)) {
      liberties++;
    }
  }
  
  // 斜角方向：检查有通气的空点
  for (const neighbor of getDiagonalNeighbors(coord)) {
    const neighborCell = board[neighbor.y][neighbor.x];
    if (providesDiagonalLiberty(neighborCell)) {
      liberties++;
    }
  }
  
  // 递归计算同色相连棋子的气
  for (const neighbor of getOrthogonalNeighbors(coord)) {
    const neighborCell = board[neighbor.y][neighbor.x];
    const neighborColor = getStoneColor(neighborCell);
    if (neighborColor === color) {
      liberties += calculateLiberties(board, neighbor, visited);
    }
  }
  
  return liberties;
}

/**
 * 获取一个位置的颜色（处理普通棋子和卦位上的棋子）
 */
export function getStoneColor(cell: BoardCell): 'black' | 'white' | null {
  if (cell.state === 'black' || cell.state === 'white') {
    return cell.state;
  }
  if (cell.state === 'bagua' && cell.baguaData?.stone) {
    return cell.baguaData.stone;
  }
  return null;
}

/**
 * 获取一个棋子所属的棋块（所有相连的同色棋子）
 */
export function getGroup(board: BoardCell[][], coord: Coord): Coord[] {
  const cell = board[coord.y][coord.x];
  const color = getStoneColor(cell);
  if (!color) return [];
  
  const group: Coord[] = [];
  const visited = new Set<string>();
  const stack = [coord];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    const currentCell = board[current.y][current.x];
    const currentColor = getStoneColor(currentCell);
    if (currentColor !== color) continue;
    
    group.push(current);
    
    // 只检查正交方向（相连定义）
    for (const neighbor of getOrthogonalNeighbors(current)) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(neighborKey)) {
        stack.push(neighbor);
      }
    }
  }
  
  return group;
}

/**
 * 计算棋块的总气数
 */
export function calculateGroupLiberties(board: BoardCell[][], group: Coord[]): number {
  const libertyPoints = new Set<string>();
  
  for (const coord of group) {
    // 正交气
    for (const neighbor of getOrthogonalNeighbors(coord)) {
      const cell = board[neighbor.y][neighbor.x];
      if (providesOrthogonalLiberty(cell)) {
        libertyPoints.add(`${neighbor.x},${neighbor.y}`);
      }
    }
    
    // 斜角气
    for (const neighbor of getDiagonalNeighbors(coord)) {
      const cell = board[neighbor.y][neighbor.x];
      if (providesDiagonalLiberty(cell)) {
        libertyPoints.add(`${neighbor.x},${neighbor.y}`);
      }
    }
  }
  
  return libertyPoints.size;
}

// ============ 落子与提子 ============

/**
 * 检查是否可以落子
 */
export function canPlaceStone(board: BoardCell[][], coord: Coord, player: 'black' | 'white'): boolean {
  const cell = board[coord.y][coord.x];
  
  // 检查是否为空
  if (cell.state === 'empty') return true;
  
  // 检查是否为可落子的卦位
  if (cell.state === 'bagua') {
    // 虚卦不可落子
    if (cell.baguaData!.xu) return false;
    // 实卦且无子可落
    return !cell.baguaData!.stone;
  }
  
  return false;
}

/**
 * 获取落子后会被提掉的棋块
 */
export function getCapturedGroups(
  board: BoardCell[][], 
  coord: Coord, 
  player: 'black' | 'white'
): Coord[][] {
  const opponent = player === 'black' ? 'white' : 'black';
  const captured: Coord[][] = [];
  
  // 检查落子相邻的对手棋块
  for (const neighbor of getOrthogonalNeighbors(coord)) {
    const neighborCell = board[neighbor.y][neighbor.x];
    const neighborColor = getStoneColor(neighborCell);
    if (neighborColor === opponent) {
      const group = getGroup(board, neighbor);
      const liberties = calculateGroupLiberties(board, group);
      if (liberties === 0) {
        captured.push(group);
      }
    }
  }
  
  return captured;
}

/**
 * 执行落子
 */
export function placeStone(gameState: GameState, coord: Coord): GameState | null {
  const { board, currentPlayer } = gameState;
  
  // 检查是否可以落子
  if (!canPlaceStone(board, coord, currentPlayer)) return null;
  
  // 创建新棋盘
  const newBoard = board.map(row => row.map(cell => ({ ...cell, baguaData: cell.baguaData ? { ...cell.baguaData } : undefined })));
  
  // 落子
  const cell = newBoard[coord.y][coord.x];
  if (cell.state === 'bagua') {
    cell.baguaData!.stone = currentPlayer;
  } else {
    cell.state = currentPlayer;
  }
  
  // 提子
  const capturedGroups = getCapturedGroups(newBoard, coord, currentPlayer);
  let capturedCount = 0;
  
  for (const group of capturedGroups) {
    for (const pos of group) {
      const capturedCell = newBoard[pos.y][pos.x];
      if (capturedCell.state === 'bagua') {
        capturedCell.baguaData!.stone = undefined;
      } else {
        capturedCell.state = 'empty';
      }
      capturedCount++;
    }
  }
  
  // 检查自杀（落子后己方气为0且没有提子）
  const ownGroup = getGroup(newBoard, coord);
  const ownLiberties = calculateGroupLiberties(newBoard, ownGroup);
  if (ownLiberties === 0 && capturedGroups.length === 0) {
    return null; // 禁止自杀
  }
  
  // 更新状态
  const newCaptures = currentPlayer === 'black' 
    ? { blackCaptures: gameState.blackCaptures + capturedCount, whiteCaptures: gameState.whiteCaptures }
    : { blackCaptures: gameState.blackCaptures, whiteCaptures: gameState.whiteCaptures + capturedCount };
  
  return {
    ...gameState,
    board: newBoard,
    currentPlayer: currentPlayer === 'black' ? 'white' : 'black',
    ...newCaptures,
    history: [...gameState.history, coord],
    passCount: 0
  };
}

/**
 * 跳过回合
 */
export function pass(gameState: GameState): GameState {
  const newPassCount = gameState.passCount + 1;
  const gameOver = newPassCount >= 2;
  
  return {
    ...gameState,
    currentPlayer: gameState.currentPlayer === 'black' ? 'white' : 'black',
    passCount: newPassCount,
    gameOver
  };
}

// ============ 目数计算 ============

/**
 * 计算领地（简化版，用于演示）
 */
export function calculateTerritory(board: BoardCell[][]): { black: number; white: number } {
  const visited = new Set<string>();
  let blackTerritory = 0;
  let whiteTerritory = 0;
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      
      const cell = board[y][x];
      
      // 空点或空卦位：尝试确定归属
      if (cell.state === 'empty' || (cell.state === 'bagua' && !cell.baguaData!.stone)) {
        const territory = floodFillTerritory(board, { x, y }, visited);
        if (territory.owner === 'black') {
          blackTerritory += territory.points;
        } else if (territory.owner === 'white') {
          whiteTerritory += territory.points;
        }
      }
    }
  }
  
  return { black: blackTerritory, white: whiteTerritory };
}

/**
 * 洪水填充确定空点归属
 */
function floodFillTerritory(
  board: BoardCell[][], 
  start: Coord, 
  visited: Set<string>
): { owner: 'black' | 'white' | 'neutral'; points: number } {
  const territory: Coord[] = [];
  const stack = [start];
  let touchesBlack = false;
  let touchesWhite = false;
  
  while (stack.length > 0) {
    const coord = stack.pop()!;
    const key = `${coord.x},${coord.y}`;
    
    if (visited.has(key)) continue;
    
    const cell = board[coord.y][coord.x];
    
    // 检查边界
    if (cell.state === 'black' || (cell.state === 'bagua' && cell.baguaData!.stone === 'black')) {
      touchesBlack = true;
      continue;
    }
    if (cell.state === 'white' || (cell.state === 'bagua' && cell.baguaData!.stone === 'white')) {
      touchesWhite = true;
      continue;
    }
    
    // 空点加入领地
    visited.add(key);
    territory.push(coord);
    
    // 继续填充
    for (const neighbor of getOrthogonalNeighbors(coord)) {
      stack.push(neighbor);
    }
  }
  
  // 计算目数（考虑卦位的公私）
  let points = territory.length;
  for (const coord of territory) {
    const cell = board[coord.y][coord.x];
    if (cell.state === 'bagua') {
      // 公卦减1目，私卦加1目
      if (cell.baguaData!.gongSi) {
        points += 1;
      } else {
        points -= 1;
      }
    }
  }
  
  // 确定归属
  let owner: 'black' | 'white' | 'neutral' = 'neutral';
  if (touchesBlack && !touchesWhite) owner = 'black';
  else if (touchesWhite && !touchesBlack) owner = 'white';
  
  return { owner, points };
}

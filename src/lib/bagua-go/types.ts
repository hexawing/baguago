// 八卦围棋核心类型定义

// 八卦枚举 - 按先天八卦序
export enum Bagua {
  Qian = 0,  // 乾 ☰ - 天
  Dui = 1,   // 兑 ☱ - 泽
  Li = 2,    // 离 ☲ - 火
  Zhen = 3,  // 震 ☳ - 雷
  Xun = 4,   // 巽 ☴ - 风
  Kan = 5,   // 坎 ☵ - 水
  Gen = 6,   // 艮 ☶ - 山
  Kun = 7,   // 坤 ☷ - 地
}

// 八卦信息
export interface BaguaInfo {
  name: string;        // 卦名
  symbol: string;      // 卦象符号
  meaning: string;     // 卦义
  philosophy: string;  // 哲理
}

// 三爻属性
export interface YaoProperties {
  xu: boolean;     // 初爻：虚实（true=虚，不可落子）
  tongQi: boolean; // 中爻：通气（true=有斜气）
  gongSi: boolean; // 上爻：公私（true=私，+1目）
}

// 棋盘位置状态
export type PositionState = 
  | 'empty'      // 空位（普通格）
  | 'black'      // 黑子
  | 'white'      // 白子
  | 'bagua';     // 卦位（需查看BaguaData详情）

// 卦位数据
export interface BaguaPosition {
  bagua: Bagua;
  xu: boolean;     // 虚实
  tongQi: boolean; // 通气
  gongSi: boolean; // 公私
  stone?: 'black' | 'white'; // 卦位上的棋子（如果是实卦）
}

// 棋盘坐标
export interface Coord {
  x: number; // 0-18，从左到右
  y: number; // 0-18，从上到下
}

// 棋盘单元格
export interface BoardCell {
  coord: Coord;
  state: PositionState;
  baguaData?: BaguaPosition; // 仅当state为'bagua'时有效
}

// 游戏状态
export interface GameState {
  board: BoardCell[][];  // 19x19棋盘
  currentPlayer: 'black' | 'white';
  blackCaptures: number; // 黑方提子数
  whiteCaptures: number; // 白方提子数
  history: Coord[];      // 落子历史
  passCount: number;     // 连续pass次数
  gameOver: boolean;
  winner?: 'black' | 'white' | 'draw';
  blackTerritory: number;
  whiteTerritory: number;
}

// 卦位生成结果
export interface GeneratedBagua {
  coord: Coord;
  bagua: Bagua;
}

// 八卦数据映射
export const BAGUA_DATA: Record<Bagua, BaguaInfo & YaoProperties> = {
  [Bagua.Qian]: {
    name: '乾',
    symbol: '☰',
    meaning: '天',
    philosophy: '天行健，自强不息。天道高悬，不可触碰，然滋养八方，围之则得。',
    xu: true,      // 阳-虚
    tongQi: true,  // 阳-通气
    gongSi: true,  // 阳-私
  },
  [Bagua.Dui]: {
    name: '兑',
    symbol: '☱',
    meaning: '泽',
    philosophy: '泽被天下，不私一物。向八方式提供生机，然不可私有，强占者损。',
    xu: true,      // 阳-虚
    tongQi: true,  // 阳-通气
    gongSi: false, // 阴-公
  },
  [Bagua.Li]: {
    name: '离',
    symbol: '☲',
    meaning: '火',
    philosophy: '火德光明，文明之象。可围而用之，不可踏入，得之则明。',
    xu: true,      // 阳-虚
    tongQi: false, // 阴-不通气
    gongSi: true,  // 阳-私
  },
  [Bagua.Zhen]: {
    name: '震',
    symbol: '☳',
    meaning: '雷',
    philosophy: '雷霆天威，敬畏之地。不可触，不可占，远之则安。',
    xu: true,      // 阳-虚
    tongQi: false, // 阴-不通气
    gongSi: false, // 阴-公
  },
  [Bagua.Xun]: {
    name: '巽',
    symbol: '☴',
    meaning: '风',
    philosophy: '风行地上，无孔不入。可乘之而行，借势八方，所得者应。',
    xu: false,     // 阴-实
    tongQi: true,  // 阳-通气
    gongSi: true,  // 阳-私
  },
  [Bagua.Kan]: {
    name: '坎',
    symbol: '☵',
    meaning: '水',
    philosophy: '水润万物，不争而利。涉水逃生，水活汝命，然舍一分为报。',
    xu: false,     // 阴-实
    tongQi: true,  // 阳-通气
    gongSi: false, // 阴-公
  },
  [Bagua.Gen]: {
    name: '艮',
    symbol: '☶',
    meaning: '山',
    philosophy: '山藏宝藏，登之可得。山路崎岖无捷径，然山顶有矿。',
    xu: false,     // 阴-实
    tongQi: false, // 阴-不通气
    gongSi: true,  // 阳-私
  },
  [Bagua.Kun]: {
    name: '坤',
    symbol: '☷',
    meaning: '地',
    philosophy: '地势坤，厚德载物。大地不言，承载一切。绝境求生，唯有此土，然须舍一分以敬之。',
    xu: false,     // 阴-实
    tongQi: false, // 阴-不通气
    gongSi: false, // 阴-公
  },
};

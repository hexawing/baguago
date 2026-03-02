'use client';

import { Bagua, BAGUA_DATA } from '@/lib/bagua-go/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GameInfoProps {
  currentPlayer: 'black' | 'white';
  blackCaptures: number;
  whiteCaptures: number;
  gameOver: boolean;
  winner?: 'black' | 'white' | 'draw';
  onPass: () => void;
  onNewGame: () => void;
  blackTerritory: number;
  whiteTerritory: number;
}

// 玩家信息组件
function PlayerInfo({ 
  color, 
  isCurrentPlayer, 
  captures, 
  territory 
}: { 
  color: 'black' | 'white'; 
  isCurrentPlayer: boolean;
  captures: number;
  territory: number;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isCurrentPlayer ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-gray-50'}`}>
      {/* 棋子图标 */}
      <div className={`w-8 h-8 rounded-full ${color === 'black' ? 'bg-gray-900' : 'bg-white border border-gray-300'}`} />
      
      <div className="flex-1">
        <div className="font-medium">
          {color === 'black' ? '黑方' : '白方'}
          {isCurrentPlayer && <Badge variant="secondary" className="ml-2">当前</Badge>}
        </div>
        <div className="text-sm text-gray-500">
          提子: {captures} | 领地: {territory}
        </div>
      </div>
    </div>
  );
}

// 卦位图例
function BaguaLegend() {
  const baguaList = Object.values(Bagua).filter(v => typeof v === 'number') as Bagua[];
  
  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm">卦位图例</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {baguaList.map((bagua) => {
            const data = BAGUA_DATA[bagua];
            return (
              <TooltipProvider key={bagua}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-100 cursor-help">
                      <span className="text-base">{data.symbol}</span>
                      <span className="font-medium">{data.name}</span>
                      <span className="text-gray-400">({data.meaning})</span>
                      <span className={data.gongSi ? 'text-red-500' : 'text-blue-500'}>
                        {data.gongSi ? '+1' : '-1'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{data.philosophy}</p>
                    <div className="mt-1 flex gap-2 text-xs text-gray-400">
                      <span>{data.xu ? '虚' : '实'}</span>
                      <span>{data.tongQi ? '通气' : '不通'}</span>
                      <span>{data.gongSi ? '私' : '公'}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        <Separator className="my-2" />
        
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-600" />
            <span>空心圈 = 虚卦（不可落子）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center text-xs">╳</div>
            <span>斜线 = 通气（提供斜气）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
            <span>实心角 = 私卦（+1目）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
            <span>空心角 = 公卦（-1目）</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 游戏结束提示
function GameOverMessage({ winner }: { winner?: 'black' | 'white' | 'draw' }) {
  if (!winner) return null;
  
  let message = '';
  if (winner === 'draw') {
    message = '平局！';
  } else {
    message = `${winner === 'black' ? '黑方' : '白方'}获胜！`;
  }
  
  return (
    <div className="text-center py-4">
      <div className="text-2xl font-bold text-amber-600">{message}</div>
    </div>
  );
}

export default function GameInfo({
  currentPlayer,
  blackCaptures,
  whiteCaptures,
  gameOver,
  winner,
  onPass,
  onNewGame,
  blackTerritory,
  whiteTerritory
}: GameInfoProps) {
  return (
    <div className="w-80 flex flex-col gap-4">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">八卦围棋</h1>
        <p className="text-sm text-gray-500">天道弈局</p>
      </div>
      
      {/* 玩家信息 */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <PlayerInfo 
            color="black" 
            isCurrentPlayer={currentPlayer === 'black' && !gameOver}
            captures={blackCaptures}
            territory={blackTerritory}
          />
          <PlayerInfo 
            color="white" 
            isCurrentPlayer={currentPlayer === 'white' && !gameOver}
            captures={whiteCaptures}
            territory={whiteTerritory}
          />
        </CardContent>
      </Card>
      
      {/* 游戏结束提示 */}
      {gameOver && <GameOverMessage winner={winner} />}
      
      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onPass}
          disabled={gameOver}
        >
          跳过 (Pass)
        </Button>
        <Button 
          className="flex-1 bg-amber-600 hover:bg-amber-700" 
          onClick={onNewGame}
        >
          新游戏
        </Button>
      </div>
      
      {/* 卦位图例 */}
      <BaguaLegend />
      
      {/* 规则提示 */}
      <Card className="bg-amber-50">
        <CardContent className="p-3 text-xs text-gray-600 space-y-1">
          <p><strong>三爻定三性：</strong></p>
          <p>• <strong>虚实</strong>（空心圈）：虚卦不可落子</p>
          <p>• <strong>通气</strong>（斜线）：提供斜角之气</p>
          <p>• <strong>公私</strong>（角标）：私卦+1目，公卦-1目</p>
          <p className="mt-2 text-gray-400">双方连续跳过则终局</p>
        </CardContent>
      </Card>
    </div>
  );
}

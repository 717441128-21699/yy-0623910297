import { useMemo, useState } from 'react';
import type { HotWord } from '@/types/event';
import { CATEGORY_LABELS, RISK_LEVEL_LABELS } from '@/types/event';
import { getRiskLevelColor } from '@/utils/riskLevel';

interface WordCloudProps {
  words: HotWord[];
}

export function WordCloud({ words }: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<HotWord | null>(null);

  const sortedWords = useMemo(() => {
    return [...words].sort((a, b) => b.count - a.count).slice(0, 20);
  }, [words]);

  const maxCount = Math.max(...sortedWords.map(w => w.count));
  const minCount = Math.min(...sortedWords.map(w => w.count));

  const getFontSize = (count: number) => {
    const ratio = (count - minCount) / (maxCount - minCount);
    return 14 + ratio * 28;
  };

  const getOpacity = (count: number) => {
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.6 + ratio * 0.4;
  };

  return (
    <div className="relative h-64">
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-4">
        {sortedWords.map((word, index) => {
          const size = getFontSize(word.count);
          const colorClass = getRiskLevelColor(word.riskLevel);
          
          return (
            <span
              key={word.word}
              className={`cursor-pointer transition-all duration-300 hover:scale-110 ${colorClass}`}
              style={{
                fontSize: `${size}px`,
                opacity: getOpacity(word.count),
                animationDelay: `${index * 0.05}s`,
                fontWeight: word.riskLevel === 'high' ? 700 : 500,
              }}
              onMouseEnter={() => setHoveredWord(word)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              {word.word}
            </span>
          );
        })}
      </div>

      {hoveredWord && (
        <div className="absolute bottom-2 left-2 bg-deep-blue-600 border border-card-border rounded-lg p-3 text-xs z-10 animate-fade-in">
          <p className="font-medium text-text-primary mb-1">{hoveredWord.word}</p>
          <p className="text-text-secondary">
            出现次数：<span className="text-tech-blue font-mono">{hoveredWord.count}</span>
          </p>
          <p className="text-text-secondary">
            风险等级：<span className={getRiskLevelColor(hoveredWord.riskLevel)}>
              {RISK_LEVEL_LABELS[hoveredWord.riskLevel]}
            </span>
          </p>
          <p className="text-text-secondary">
            所属分类：<span className="text-text-primary">
              {CATEGORY_LABELS[hoveredWord.category]}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

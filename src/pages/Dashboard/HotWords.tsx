import { Card } from '@/components/ui/Card';
import { WordCloud } from '@/components/charts/WordCloud';
import type { HotWord } from '@/types/event';

interface HotWordsProps {
  words: HotWord[];
}

export function HotWords({ words }: HotWordsProps) {
  return (
    <Card className="h-full animate-slide-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title>今日热词</Card.Title>
      </Card.Header>
      <Card.Content>
        <WordCloud words={words} />
      </Card.Content>
    </Card>
  );
}

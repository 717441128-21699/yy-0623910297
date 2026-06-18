export type RiskCategory = 'complaint' | 'crowd' | 'overcharge' | 'service' | 'safety';
export type RiskLevel = 'high' | 'medium' | 'low' | 'resolved';
export type Platform = 'weibo' | 'douyin' | 'xiaohongshu' | 'dianping';

export interface Event {
  id: string;
  title: string;
  content: string;
  platform: Platform;
  category: RiskCategory;
  riskLevel: RiskLevel;
  sourceUrl: string;
  publishTime: Date;
  viewCount: number;
  commentCount: number;
  shareCount: number;
  sentiment: number;
  author: string;
  scenic: string;
}

export interface SpreadDataPoint {
  timestamp: Date;
  viewCount: number;
  commentCount: number;
  shareCount: number;
}

export interface HotWord {
  word: string;
  count: number;
  riskLevel: RiskLevel;
  category: RiskCategory;
}

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  complaint: '投诉',
  crowd: '拥堵',
  overcharge: '宰客',
  service: '服务态度',
  safety: '安全隐患',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
  resolved: '已处置',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  weibo: '微博',
  douyin: '抖音',
  xiaohongshu: '小红书',
  dianping: '大众点评',
};

export const SCENIC_OPTIONS = [
  { value: 'all', label: '全部景区' },
  { value: 'huangshan', label: '黄山风景区' },
  { value: 'jiuzhaigou', label: '九寨沟风景区' },
  { value: 'sanya', label: '三亚亚龙湾' },
  { value: 'xihu', label: '杭州西湖' },
  { value: 'gugong', label: '故宫博物院' },
];

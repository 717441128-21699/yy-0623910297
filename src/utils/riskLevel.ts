import type { RiskLevel, RiskCategory, Platform } from '@/types/event';
import type { WorkOrderStatus } from '@/types/workOrder';

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    high: 'text-risk-high',
    medium: 'text-risk-medium',
    low: 'text-risk-low',
    resolved: 'text-risk-resolved',
  };
  return colors[level];
}

export function getRiskLevelBgColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    high: 'bg-risk-high/20 border-risk-high',
    medium: 'bg-risk-medium/20 border-risk-medium',
    low: 'bg-risk-low/20 border-risk-low',
    resolved: 'bg-risk-resolved/20 border-risk-resolved',
  };
  return colors[level];
}

export function getRiskLevelGlow(level: RiskLevel): string {
  const glows: Record<RiskLevel, string> = {
    high: 'shadow-glow-red',
    medium: 'shadow-glow-orange',
    low: '',
    resolved: '',
  };
  return glows[level];
}

export function getRiskLevelAnimation(level: RiskLevel): string {
  const animations: Record<RiskLevel, string> = {
    high: 'animate-pulse-fast',
    medium: 'animate-pulse-slow',
    low: '',
    resolved: '',
  };
  return animations[level];
}

export function getCategoryColor(category: RiskCategory): string {
  const colors: Record<RiskCategory, string> = {
    complaint: 'text-tech-blue',
    crowd: 'text-risk-medium',
    overcharge: 'text-risk-high',
    service: 'text-risk-low',
    safety: 'text-risk-high',
  };
  return colors[category];
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    weibo: 'text-red-400',
    douyin: 'text-pink-400',
    xiaohongshu: 'text-red-500',
    dianping: 'text-orange-400',
  };
  return colors[platform];
}

export function getWorkOrderStatusColor(status: WorkOrderStatus): string {
  const colors: Record<WorkOrderStatus, string> = {
    pending: 'text-risk-low',
    processing: 'text-risk-medium',
    responded: 'text-risk-resolved',
  };
  return colors[status];
}

export function getWorkOrderStatusBgColor(status: WorkOrderStatus): string {
  const colors: Record<WorkOrderStatus, string> = {
    pending: 'bg-risk-low/20 border-risk-low',
    processing: 'bg-risk-medium/20 border-risk-medium',
    responded: 'bg-risk-resolved/20 border-risk-resolved',
  };
  return colors[status];
}

export function getSentimentLabel(sentiment: number): string {
  if (sentiment < -0.3) return '负面';
  if (sentiment < 0.3) return '中性';
  return '正面';
}

export function getSentimentColor(sentiment: number): string {
  if (sentiment < -0.3) return 'text-risk-high';
  if (sentiment < 0.3) return 'text-text-secondary';
  return 'text-risk-resolved';
}

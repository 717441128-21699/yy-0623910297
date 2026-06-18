import type { Event, SpreadDataPoint, HotWord } from '@/types/event';
import { daysAgo } from '@/utils/date';

const now = new Date();

export const mockEvents: Event[] = [
  {
    id: 'evt-001',
    title: '黄山缆车排队超过3小时，游客暴晒中暑',
    content: '今天黄山南门缆车排队太夸张了，我们排了3个多小时才坐上，很多老人小孩都中暑了，现场也没有工作人员维持秩序，遮阳棚也不够，太失望了！',
    platform: 'weibo',
    category: 'crowd',
    riskLevel: 'high',
    sourceUrl: 'https://weibo.com/123456',
    publishTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    viewCount: 125600,
    commentCount: 3420,
    shareCount: 890,
    sentiment: -0.8,
    author: '旅游吐槽君',
    scenic: 'huangshan',
  },
  {
    id: 'evt-002',
    title: '九寨沟餐厅宰客，一盘青菜要88元',
    content: '在九寨沟景区内的XX餐厅吃饭，一盘普通的清炒白菜就要88元，一碗米饭10元，两个人随便吃点就花了500多，这也太黑了吧！强烈要求监管部门查处！',
    platform: 'dianping',
    category: 'overcharge',
    riskLevel: 'high',
    sourceUrl: 'https://dianping.com/123456',
    publishTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    viewCount: 89200,
    commentCount: 2180,
    shareCount: 560,
    sentiment: -0.9,
    author: '美食探店客',
    scenic: 'jiuzhaigou',
  },
  {
    id: 'evt-003',
    title: '西湖游船工作人员态度恶劣，拒绝退票',
    content: '今天在西湖坐游船，因为天气突变想退票，工作人员态度特别差，说票一经售出概不退换，还说"没钱就别出来玩"，这是什么服务态度？',
    platform: 'xiaohongshu',
    category: 'service',
    riskLevel: 'medium',
    sourceUrl: 'https://xiaohongshu.com/123456',
    publishTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    viewCount: 45600,
    commentCount: 890,
    shareCount: 230,
    sentiment: -0.6,
    author: '小仙女爱旅行',
    scenic: 'xihu',
  },
  {
    id: 'evt-004',
    title: '三亚亚龙湾沙滩垃圾成堆，无人清理',
    content: '亚龙湾的沙滩现在太脏了，到处是塑料瓶、塑料袋，还有吃剩的食物，海水也有异味，跟几年前完全没法比，太失望了。',
    platform: 'douyin',
    category: 'complaint',
    riskLevel: 'medium',
    sourceUrl: 'https://douyin.com/123456',
    publishTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    viewCount: 234000,
    commentCount: 5670,
    shareCount: 1230,
    sentiment: -0.7,
    author: '海边看风景',
    scenic: 'sanya',
  },
  {
    id: 'evt-005',
    title: '故宫参观通道湿滑，老人摔倒无人扶',
    content: '今天在故宫参观，因为下雨地面湿滑，一位老人摔倒了，周围的工作人员都视而不见，还是游客帮忙扶起来的。故宫的应急管理太差了！',
    platform: 'weibo',
    category: 'safety',
    riskLevel: 'high',
    sourceUrl: 'https://weibo.com/654321',
    publishTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    viewCount: 178000,
    commentCount: 4230,
    shareCount: 980,
    sentiment: -0.85,
    author: '历史爱好者',
    scenic: 'gugong',
  },
  {
    id: 'evt-006',
    title: '黄山景区门票预订系统崩溃，游客无法入园',
    content: '早上6点就起来抢黄山门票，结果预订系统一直崩溃，刷了两个小时都没进去，到了景区门口又说没票不能进，很多游客都在吵架。',
    platform: 'weibo',
    category: 'complaint',
    riskLevel: 'medium',
    sourceUrl: 'https://weibo.com/789012',
    publishTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    viewCount: 67800,
    commentCount: 1560,
    shareCount: 340,
    sentiment: -0.7,
    author: '早起的鸟儿',
    scenic: 'huangshan',
  },
  {
    id: 'evt-007',
    title: '九寨沟观光车司机边开车边玩手机',
    content: '坐九寨沟的观光车，发现司机一直在玩手机刷微信，山路这么弯，一车人的安全都在他手里，这也太不负责任了！',
    platform: 'douyin',
    category: 'safety',
    riskLevel: 'high',
    sourceUrl: 'https://douyin.com/789012',
    publishTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    viewCount: 312000,
    commentCount: 8920,
    shareCount: 2340,
    sentiment: -0.9,
    author: '安全第一',
    scenic: 'jiuzhaigou',
  },
  {
    id: 'evt-008',
    title: '三亚海鲜市场缺斤短两严重',
    content: '在三亚第一市场买海鲜，2斤的虾秤出来3.8斤，要不是自带了弹簧秤就被坑了。商家还说"这里都是这样的，嫌贵别买"，太嚣张了！',
    platform: 'dianping',
    category: 'overcharge',
    riskLevel: 'medium',
    sourceUrl: 'https://dianping.com/789012',
    publishTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    viewCount: 56700,
    commentCount: 1890,
    shareCount: 450,
    sentiment: -0.75,
    author: '吃货小分队',
    scenic: 'sanya',
  },
  {
    id: 'evt-009',
    title: '西湖景区公厕卫生堪忧，蛆虫满地',
    content: '西湖景区的公共厕所太脏了，冲水系统坏了没人修，地上还有蛆虫在爬，这么热门的景区，卫生做成这样，太影响杭州形象了。',
    platform: 'xiaohongshu',
    category: 'complaint',
    riskLevel: 'medium',
    sourceUrl: 'https://xiaohongshu.com/789012',
    publishTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    viewCount: 34500,
    commentCount: 780,
    shareCount: 180,
    sentiment: -0.8,
    author: '爱干净的猫',
    scenic: 'xihu',
  },
  {
    id: 'evt-010',
    title: '故宫讲解器租金过高，强制消费',
    content: '故宫的讲解器租金要40元一个，而且进去就必须租，不租不让进。我们一行5个人，光讲解器就花了200，这钱也太好赚了。',
    platform: 'weibo',
    category: 'overcharge',
    riskLevel: 'low',
    sourceUrl: 'https://weibo.com/345678',
    publishTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    viewCount: 23400,
    commentCount: 450,
    shareCount: 90,
    sentiment: -0.5,
    author: '穷游天下',
    scenic: 'gugong',
  },
  {
    id: 'evt-011',
    title: '黄山山顶酒店价格虚高，一晚三千多',
    content: '五一来黄山玩，山顶的酒店一晚要3280元，而且还是最差的房型。房间里设施陈旧，卫生间还有味道，这个价格真的太离谱了。',
    platform: 'dianping',
    category: 'overcharge',
    riskLevel: 'medium',
    sourceUrl: 'https://dianping.com/345678',
    publishTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    viewCount: 78900,
    commentCount: 2340,
    shareCount: 560,
    sentiment: -0.65,
    author: '酒店体验师',
    scenic: 'huangshan',
  },
  {
    id: 'evt-012',
    title: '九寨沟游客中心空调坏了，像蒸笼一样',
    content: '九寨沟游客中心的空调坏了好几天了，这么热的天，几百人在里面等着排队，就像蒸笼一样，很多人都中暑了，也没人管。',
    platform: 'douyin',
    category: 'service',
    riskLevel: 'medium',
    sourceUrl: 'https://douyin.com/345678',
    publishTime: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
    viewCount: 156000,
    commentCount: 4560,
    shareCount: 890,
    sentiment: -0.7,
    author: '怕热的胖子',
    scenic: 'jiuzhaigou',
  },
];

export function getMockSpreadData(eventId: string): SpreadDataPoint[] {
  const now = new Date();
  const points: SpreadDataPoint[] = [];
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseViews = Math.floor(Math.random() * 1000) + 500;
    const baseComments = Math.floor(Math.random() * 100) + 20;
    const baseShares = Math.floor(Math.random() * 50) + 10;
    
    const growthFactor = 1 + (24 - i) * 0.15 + Math.random() * 0.3;
    
    points.push({
      timestamp,
      viewCount: Math.floor(baseViews * growthFactor),
      commentCount: Math.floor(baseComments * growthFactor),
      shareCount: Math.floor(baseShares * growthFactor),
    });
  }
  
  return points;
}

export const mockHotWords: HotWord[] = [
  { word: '排队', count: 234, riskLevel: 'high', category: 'crowd' },
  { word: '宰客', count: 189, riskLevel: 'high', category: 'overcharge' },
  { word: '服务态度', count: 156, riskLevel: 'medium', category: 'service' },
  { word: '安全', count: 145, riskLevel: 'high', category: 'safety' },
  { word: '门票', count: 134, riskLevel: 'medium', category: 'complaint' },
  { word: '价格', count: 128, riskLevel: 'medium', category: 'overcharge' },
  { word: '拥堵', count: 112, riskLevel: 'high', category: 'crowd' },
  { word: '卫生', count: 98, riskLevel: 'medium', category: 'complaint' },
  { word: '缆车', count: 87, riskLevel: 'high', category: 'crowd' },
  { word: '中暑', count: 76, riskLevel: 'high', category: 'safety' },
  { word: '退票', count: 67, riskLevel: 'medium', category: 'service' },
  { word: '海鲜', count: 58, riskLevel: 'medium', category: 'overcharge' },
  { word: '厕所', count: 52, riskLevel: 'low', category: 'complaint' },
  { word: '停车', count: 48, riskLevel: 'low', category: 'complaint' },
  { word: '导游', count: 45, riskLevel: 'medium', category: 'service' },
  { word: '酒店', count: 42, riskLevel: 'medium', category: 'overcharge' },
  { word: '观光车', count: 38, riskLevel: 'high', category: 'safety' },
  { word: '预约', count: 35, riskLevel: 'low', category: 'complaint' },
  { word: '讲解器', count: 32, riskLevel: 'low', category: 'overcharge' },
  { word: '垃圾', count: 29, riskLevel: 'medium', category: 'complaint' },
];

export function getEventById(id: string): Event | undefined {
  return mockEvents.find(e => e.id === id);
}

export function getEventsByFilters(
  scenic: string,
  platforms: string[],
  category: string,
  date: Date
): Event[] {
  return mockEvents.filter(event => {
    const scenicMatch = scenic === 'all' || event.scenic === scenic;
    const platformMatch = platforms.length === 0 || platforms.includes(event.platform);
    const categoryMatch = category === 'all' || event.category === category;
    const eventDate = new Date(event.publishTime);
    const dateMatch = eventDate.toDateString() === date.toDateString();
    return scenicMatch && platformMatch && categoryMatch && dateMatch;
  });
}

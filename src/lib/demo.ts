import type { MatchPerson } from './profiles'
import type { SocialPost } from './social'

export type Person = (typeof people)[number] | MatchPerson

export const people = [
  { id: 1, name: '林知夏', age: 21, school: '同济大学', major: '建筑学', score: 96, distance: '1.2km', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop', tags: ['INFJ', '胶片摄影', '城市漫游'], quote: '想和有趣的人，把普通日子过成限定版。', color: '#ff715b', dimensions: [98, 94, 91] },
  { id: 2, name: '陈予安', age: 22, school: '复旦大学', major: '新闻传播', score: 92, distance: '3.8km', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop', tags: ['ENFP', 'Livehouse', '网球'], quote: '世界很大，愿我们都保有出发的勇气。', color: '#7c5cff', dimensions: [95, 89, 92] },
  { id: 3, name: '顾南乔', age: 20, school: '华东师范大学', major: '心理学', score: 89, distance: '5.1km', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop', tags: ['INTJ', '话剧', '小动物'], quote: '真诚是永远的必杀技。', color: '#34b991', dimensions: [91, 88, 87] },
  { id: 4, name: '周屿', age: 23, school: '上海交通大学', major: '工业设计', score: 87, distance: '6.4km', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop', tags: ['ISFP', '攀岩', '设计'], quote: '在旷野里，寻找生活的另一种解法。', color: '#2f8cff', dimensions: [88, 86, 91] },
]

export const seedPosts: SocialPost[] = [
  { id: 1, name: '林知夏', avatar: people[0].avatar, school: '同济大学', time: '18分钟前', text: '在武康路拐进一条没走过的小巷，遇见了一家只放爵士乐的旧书店。城市的惊喜，大概就藏在“不按计划”里。', image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=1000&auto=format&fit=crop', tags: ['城市漫游', '今日份浪漫'], likes: 128, liked: false, comments: [{ id: 1, name: '陈予安', avatar: people[1].avatar, text: '求店名！周末也想去坐一下午 📖' }] },
  { id: 2, name: '陈予安', avatar: people[1].avatar, school: '复旦大学', time: '1小时前', text: '“年轻时，我们彼此相爱却浑然不知。” 看完《流浪的月》，在草坪上发了好久的呆。最近你们在读什么？', tags: ['书影音', '寻找同频'], likes: 76, liked: true, comments: [{ id: 1, name: '顾南乔', avatar: people[2].avatar, text: '最近在重读《悉达多》，每个阶段看都有新感受。' }, { id: 2, name: '周屿', avatar: people[3].avatar, text: '这句也太适合初夏了。' }] },
  { id: 3, name: '顾南乔', avatar: people[2].avatar, school: '华东师范大学', time: '昨天 22:14', text: '第一次做陶，杯子歪歪扭扭，但手掌记住了泥土的温度。接受不完美，也是很重要的课题吧。', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1000&auto=format&fit=crop', tags: ['生活碎片', '手作'], likes: 203, liked: false, comments: [] },
]
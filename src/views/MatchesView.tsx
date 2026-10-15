import type { Session } from '@supabase/supabase-js';
import { ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import MatchCard, { type Person } from '../components/MatchCard';
import type { MatchPerson } from '../lib/profiles';

export type MatchFilter = 'selected' | 'high' | 'school';

function MatchesView({
  session,
  candidates,
  total,
  loading,
  filter,
  onFilter,
  onGo,
  onOpenOnboarding,
  onOpenPerson,
  onHeart,
  onInsight,
}: {
  session: Session | null;
  candidates: Person[];
  total: number;
  loading: boolean;
  filter: MatchFilter;
  onFilter: (filter: MatchFilter) => void;
  onGo: (target: 'preferences' | 'exploration' | 'moments') => void;
  onOpenOnboarding: () => void;
  onOpenPerson: (person: Person) => void;
  onHeart: (person: Person) => Promise<void>;
  onInsight: (person: MatchPerson) => void;
}) {
  return (
    <>
      <div className="filter-bar">
        <div>
          <button
            className={`filter ${filter === 'selected' ? 'active' : ''}`}
            onClick={() => onFilter('selected')}
          >
            为你精选
          </button>
          <button
            className={`filter ${filter === 'high' ? 'active' : ''}`}
            onClick={() => onFilter('high')}
          >
            高契合度
          </button>
          <button
            className={`filter ${filter === 'school' ? 'active' : ''}`}
            onClick={() => onFilter('school')}
          >
            同校用户
          </button>
        </div>
        <button className="secondary" onClick={() => onGo('preferences')}>
          <SlidersHorizontal size={17} />
          筛选偏好
        </button>
      </div>
      <div className="match-insight glass-card">
        <div className="insight-icon">
          <Sparkles />
        </div>
        <div>
          <b>{session ? '匹配雷达已更新' : '匹配功能预览'}</b>
          <p>
            {session
              ? `当前找到 ${total} 位候选人，可继续调整关系期待`
              : '登录并完善画像后，将根据真实资料生成推荐'}
          </p>
        </div>
        <button onClick={onOpenOnboarding}>
          查看我的画像 <ChevronRight size={16} />
        </button>
      </div>
      {loading ? (
        <div className="match-skeleton-grid">
          {[1, 2, 3].map((x) => (
            <div className="match-skeleton" key={x}>
              <i />
              <b />
              <span />
            </div>
          ))}
        </div>
      ) : candidates.length ? (
        <div className="match-grid full">
          {candidates.map((p) => (
            <MatchCard
              key={p.id}
              person={p}
              onOpen={() => onOpenPerson(p)}
              onHeart={() => onHeart(p)}
              onInsight={
                'userId' in p && 'reasons' in p
                  ? () => onInsight(p as unknown as MatchPerson)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="match-empty glass-card">
          <Sparkles />
          <h3>这一组暂时没有合适的候选人</h3>
          <p>
            这不代表没有可能。你可以先完善一项资料、做一次自我探索，或稍后回来查看新的真实推荐。
          </p>
          <div className="empty-next-actions">
            <button className="primary" onClick={() => onGo('preferences')}>
              调整匹配偏好
            </button>
            <button className="secondary" onClick={() => onGo('exploration')}>
              做一次自我探索
            </button>
            <button className="secondary" onClick={() => onGo('moments')}>
              先逛同频动态
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MatchesView;

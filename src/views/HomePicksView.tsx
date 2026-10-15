import { ChevronRight, WifiOff } from 'lucide-react';
import MatchCard, { type Person } from '../components/MatchCard';
import type { MatchPerson } from '../lib/profiles';

export type PickDataMode = 'demo' | 'real' | 'unavailable';

function HomePicksView({
  dataMode,
  picks,
  demo,
  onViewAll,
  onOpenPerson,
  onHeart,
  onInsight,
}: {
  dataMode: PickDataMode;
  picks: Person[];
  demo: boolean;
  onViewAll: () => void;
  onOpenPerson: (person: Person) => void;
  onHeart: (person: Person) => Promise<void>;
  onInsight: (person: MatchPerson) => void;
}) {
  return (
    <>
      <section className="section-head">
        <div>
          <span className="section-kicker">DAILY PICKS</span>
          <h2>今日心动推荐</h2>
        </div>
        <button onClick={onViewAll}>
          查看全部 <ChevronRight size={17} />
        </button>
      </section>
      {dataMode === 'demo' && (
        <div className="demo-content-note">
          <WifiOff />
          演示数据 · 上海校园场景示例 · 不代表真实用户或附近位置
        </div>
      )}
      {dataMode === 'unavailable' && (
        <div className="demo-content-note">
          <WifiOff />
          暂无可用的真实推荐。请完善资料或稍后重试，当前不会展示演示人物。
        </div>
      )}
      <div className="match-grid">
        {picks.map((p) => (
          <MatchCard
            key={p.id}
            person={p}
            demo={demo}
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
    </>
  );
}

export default HomePicksView;

import { ChevronRight } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import PostCard, { type Post } from '../components/PostCard';

function HomeFeedView({
  session,
  posts,
  onEnterSquare,
  onLike,
  onComment,
  onRemovePost,
  onFlagPost,
  notify,
  userAvatar,
}: {
  session: Session | null;
  posts: Post[];
  onEnterSquare: () => void;
  onLike: (id: string | number) => void;
  onComment: (id: string | number, text: string) => Promise<void>;
  onRemovePost: (id: string | number) => void;
  onFlagPost: (id: string | number) => void;
  notify: (text: string) => void;
  userAvatar: string;
}) {
  return (
    <>
      <section className="section-head moment-title">
        <div>
          <span className="section-kicker">CAMPUS MOMENTS</span>
          <h2>同频的人，此刻在做什么</h2>
        </div>
        <button onClick={onEnterSquare}>
          进入广场 <ChevronRight size={17} />
        </button>
      </section>
      <div className="home-feed">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onLike={() => onLike(p.id)}
            onComment={(t) => onComment(p.id, t)}
            onDelete={
              'authorId' in p && p.authorId === session?.user.id
                ? () => void onRemovePost(p.id)
                : undefined
            }
            onReport={
              'authorId' in p && p.authorId !== session?.user.id
                ? () => void onFlagPost(p.id)
                : undefined
            }
            onNotice={notify}
            userAvatar={userAvatar}
          />
        ))}
      </div>
    </>
  );
}

export default HomeFeedView;

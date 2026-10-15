import type { Session } from '@supabase/supabase-js';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Coffee,
  MapPin,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import PageLoading from '../components/Loading';
import type { Post } from '../components/PostCard';
import type { ProfileBundle } from '../lib/profiles';

function ProfileView({
  session,
  profile,
  userAvatar,
  ownPosts,
  completion,
  missing,
  onOpenAuth,
  onOpenEditor,
}: {
  session: Session | null;
  profile: ProfileBundle['profile'] | undefined;
  userAvatar: string;
  ownPosts: Post[];
  completion: number;
  missing: number;
  onOpenAuth: () => void;
  onOpenEditor: () => void;
}) {
  if (!session) {
    return (
      <div className="assessment-locked">
        <User />
        <h2>登录后查看真实个人空间</h2>
        <p>你的资料、照片和动态只会在登录后加载。</p>
        <button className="primary" onClick={onOpenAuth}>
          登录同频 <ArrowRight />
        </button>
      </div>
    );
  }
  if (!profile) {
    return <PageLoading label="正在加载真实资料" />;
  }
  return (
    <>
      <section className="profile-hero glass-card">
        <div className="profile-cover" />
        <div className="profile-info">
          <button
            className="profile-avatar avatar-edit-entry"
            aria-label="编辑头像"
            onClick={onOpenEditor}
          >
            <Avatar src={userAvatar} size={104} />
            <span>
              <Camera size={16} />
            </span>
          </button>
          <div>
            <h2>
              {profile.nickname}
              {profile.verified && <ShieldCheck size={19} />}
            </h2>
            <p>
              {[profile.school, profile.major, profile.grade].filter(Boolean).join(' · ') ||
                '尚未填写学习或工作信息'}
            </p>
            <div className="tag-row">
              {[profile.personality, ...profile.interests]
                .filter(Boolean)
                .slice(0, 5)
                .map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              {!profile.personality && !profile.interests.length && <small>暂未添加兴趣标签</small>}
            </div>
          </div>
          <button className="secondary" onClick={onOpenEditor}>
            <Settings size={17} />
            编辑资料
          </button>
        </div>
      </section>
      <div className="profile-layout">
        <section>
          <div className="about-card glass-card">
            <h3>关于我</h3>
            <p>{profile.bio || '还没有填写自我介绍，分享真实的你会让匹配更准确。'}</p>
            <div className="details">
              {(profile.hometown || profile.city) && (
                <span>
                  <MapPin />
                  {profile.hometown ? `来自${profile.hometown}` : ''}
                  {profile.hometown && profile.city ? '，' : ''}
                  {profile.city ? `现居${profile.city}` : ''}
                </span>
              )}
              {profile.life_stage && (
                <span>
                  <BookOpen />
                  {profile.life_stage}
                  {profile.occupation ? ` · ${profile.occupation}` : ''}
                </span>
              )}
              {profile.ideal_date && (
                <span>
                  <Coffee />
                  理想约会：{profile.ideal_date}
                </span>
              )}
            </div>
          </div>
          <div className="about-card glass-card">
            <h3>
              我的动态 <small>{ownPosts.length}</small>
            </h3>
            {ownPosts.some((post) => post.image) ? (
              <div className="photo-grid">
                {ownPosts
                  .filter((post) => post.image)
                  .slice(0, 6)
                  .map((post) => (
                    <img key={post.id} src={post.image} alt="我的动态" />
                  ))}
              </div>
            ) : (
              <div className="profile-empty">还没有发布带图片的动态</div>
            )}
          </div>
        </section>
        <aside>
          <div className="completion-card">
            <div className="circle-progress">
              <span>
                {completion}
                <small>%</small>
              </span>
            </div>
            <h3>画像完成度</h3>
            <p>
              {completion === 100
                ? '资料已完整，继续保持真实表达'
                : `还有约 ${missing} 项资料可以完善`}
            </p>
            <button className="primary" onClick={onOpenEditor}>
              继续完善
            </button>
          </div>
          <div className="rail-card stat-card">
            <h3>我的内容</h3>
            <div>
              <span>
                <b>{ownPosts.length}</b>真实动态
              </span>
              <span>
                <b>{ownPosts.reduce((sum, post) => sum + post.likes, 0)}</b>动态获赞
              </span>
              <span>
                <b>{profile.interests.length}</b>兴趣标签
              </span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default ProfileView;

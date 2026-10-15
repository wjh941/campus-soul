import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import PostCard, { type Post } from '../components/PostCard';
import type { Person } from '../components/MatchCard';
import { safeStorage } from '../lib/resilience';

function Composer({
  onPost,
  authenticated,
  avatar,
  onClose,
}: {
  onPost: (text: string, image?: File) => Promise<void>;
  authenticated: boolean;
  avatar: string;
  onClose: () => void;
}) {
  const [text, setText] = useState(() => safeStorage.get('tongpin-post-draft') ?? '');
  const [image, setImage] = useState<File>();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(''),
    [preview, setPreview] = useState(false);
  useEffect(() => {
    if (text) safeStorage.set('tongpin-post-draft', text);
    else safeStorage.remove('tongpin-post-draft');
  }, [text]);
  const chooseImage = (file?: File) => {
    setError('');
    if (!file) return setImage(undefined);
    if (file.size > 5 * 1024 * 1024) return setError('动态图片不能超过 5 MB');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))
      return setError('仅支持 JPG、PNG、WebP 或 GIF');
    setImage(file);
  };
  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await onPost(text.trim(), image);
      setText('');
      setError('');
      setImage(undefined);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败，草稿已保留');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="composer-page">
      <header>
        <div>
          <span className="section-kicker">CREATE A MOMENT</span>
          <h2>分享此刻的同频信号</h2>
          <p>真实、轻松地记录今天。发布前你可以先预览内容。</p>
        </div>
        <button className="composer-close secondary" type="button" onClick={onClose}>
          <X />
          取消
        </button>
      </header>
      <div className="composer glass-card">
        <Avatar src={avatar} size={45} />
        <div className="composer-main">
          {preview ? (
            <div className="composer-preview">
              <span>发布预览</span>
              <p>{text || '还没有输入内容'}</p>
              {image && <small>📎 {image.name}</small>}
            </div>
          ) : (
            <textarea
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              placeholder={authenticated ? '此刻，你想和大家分享什么？' : '登录后发布真实同频动态'}
            />
          )}
          {image && (
            <div className="image-chip">
              <Upload size={13} />
              <span>{image.name}</span>
              <button
                aria-label="移除已选择的图片"
                onClick={() => {
                  setImage(undefined);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {error && <div className="composer-error">{error}</div>}
          <div className="composer-tools">
            <div>
              <button
                type="button"
                className="preview-toggle"
                onClick={() => setPreview((x) => !x)}
              >
                {preview ? <EyeOff size={17} /> : <Eye size={17} />} {preview ? '返回编辑' : '预览'}
              </button>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => chooseImage(e.target.files?.[0])}
              />
              <button onClick={() => fileRef.current?.click()}>
                <ImagePlus size={18} />
                图片
              </button>
            </div>
            <button className="primary small" disabled={!text.trim() || busy} onClick={submit}>
              {busy ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <>
                  发布 <Send size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <small className="composer-note">
        发布后内容会进入同频动态，其他用户可以点赞、评论或举报。
      </small>
      {text && (
        <small className="composer-draft-status" role="status">
          草稿已自动保存
        </small>
      )}
    </section>
  );
}

function MomentsView({
  session,
  showComposer,
  onOpenComposer,
  onCloseComposer,
  onPost,
  authenticated,
  posts,
  onLike,
  onComment,
  onRemovePost,
  onFlagPost,
  notify,
  userAvatar,
  railPeople,
  onOpenPerson,
}: {
  session: Session | null;
  showComposer: boolean;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onPost: (text: string, image?: File) => Promise<void>;
  authenticated: boolean;
  posts: Post[];
  onLike: (id: string | number) => void;
  onComment: (id: string | number, text: string) => Promise<void>;
  onRemovePost: (id: string | number) => void;
  onFlagPost: (id: string | number) => void;
  notify: (text: string) => void;
  userAvatar: string;
  railPeople: Person[];
  onOpenPerson: (person: Person) => void;
}) {
  return (
    <>
      <div className="feed-column">
        {showComposer ? (
          <Composer
            onPost={onPost}
            authenticated={authenticated}
            avatar={userAvatar}
            onClose={onCloseComposer}
          />
        ) : (
          <button className="open-composer primary" onClick={onOpenComposer}>
            <ImagePlus />
            发布一条同频动态
            <Send />
          </button>
        )}
        <div className="feed-tabs">
          <button className="active">最新动态</button>
        </div>
        {posts.length ? (
          posts.map((p) => (
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
          ))
        ) : (
          <div className="match-empty glass-card">
            <MessageCircle />
            <h3>还没有真实动态</h3>
            <p>发布第一条内容，或稍后回来看看。</p>
          </div>
        )}
      </div>
      <aside className="right-rail">
        <div className="rail-card">
          <h3>
            <Users size={18} />
            {session ? '当前推荐' : '功能预览'}
          </h3>
          {railPeople.slice(0, 3).map((p) => (
            <div className="mini-person" key={p.id}>
              <Avatar src={p.avatar} size={38} />
              <div>
                <b>{p.name}</b>
                <span>{p.school}</span>
              </div>
              <button onClick={() => onOpenPerson(p)}>查看</button>
            </div>
          ))}
        </div>
        <div className="rail-card">
          <h3>
            <Zap size={18} />
            社区话题
          </h3>
          {['# 分享真实的此刻', '# 最近单曲循环', '# 周末搭子计划'].map((x, i) => (
            <div className="trend" key={x}>
              <b>0{i + 1}</b>
              <span>
                {x}
                <small>话题建议</small>
              </span>
            </div>
          ))}
        </div>
        <div className="safety-card">
          <ShieldCheck />
          <div>
            <b>同频安全中心</b>
            <p>真实高校认证 · 隐私保护</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default MomentsView;

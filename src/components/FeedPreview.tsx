import { useState, useMemo, useRef } from 'react';
import { Post, BrandProfile } from '../App';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, LayoutGrid, List, Globe, Edit2, Trash2, Eye,
  ThumbsUp, Share2, Repeat2, BarChart3, UserPlus, Rows3, Circle
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { C, card, platLabel } from '../utils/ds';

interface Props {
  posts: Post[];
  onEditPost: (p: Post) => void;
  onDeletePost: (id: string) => void;
  onUpdatePost: (p: Post) => void;
  brandProfile: BrandProfile;
  feedPlatform: Platform;
  setFeedPlatform: (p: Platform) => void;
  feedStatus: StatusFilter;
  setFeedStatus: (s: StatusFilter) => void;
  feedViewMode: 'feed' | 'grid';
  setFeedViewMode: (m: 'feed' | 'grid') => void;
}

type Platform = 'instagram' | 'twitter' | 'facebook' | 'linkedin';
type StatusFilter = 'all' | 'scheduled' | 'draft' | 'posted';

const PLATS: Platform[] = ['instagram', 'twitter', 'facebook', 'linkedin'];

const STATUS_DOT: Record<string, string> = {
  scheduled: C.scheduled,
  posted:    C.published,
  draft:     C.draft,
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  posted:    'Published',
  draft:     'Draft',
};

// Mock engagement for posts
function getMockEngagement(postId: string, status: string) {
  if (status !== 'posted') return null;
  const seed = postId.charCodeAt(0);
  return {
    likes: 150 + (seed * 23) % 300,
    comments: 12 + (seed * 7) % 40,
    shares: 5 + (seed * 3) % 20,
    saves: 8 + (seed * 5) % 25,
  };
}

export function FeedPreview({ posts, onEditPost, onDeletePost, onUpdatePost, brandProfile, feedPlatform, setFeedPlatform, feedStatus, setFeedStatus, feedViewMode, setFeedViewMode }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const platColor = (C as any)[feedPlatform] as string;
  const sorted  = [...posts].sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
  
  // Apply filters
  const filtered = sorted
    .filter(p => p.platform === feedPlatform)
    .filter(p => feedStatus === 'all' || p.status === feedStatus);

  const visible = filtered;

  return (
    <div style={{ maxWidth: 920 }} className="enter">
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          color: C.t1, 
          fontSize: 24, 
          fontWeight: 700, 
          letterSpacing: '-0.03em',
          marginBottom: 6,
          lineHeight: 1.2,
        }}>
          Feed Preview
        </h1>
        <p style={{ color: C.t3, fontSize: 13, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
          Preview how your {platLabel[feedPlatform]} content appears — use the sidebar to switch platforms and filters
        </p>
      </div>

      {/* View mode tabs — Instagram only */}
      {feedPlatform === 'instagram' && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([
            { mode: 'feed',   label: 'Feed',   Icon: Rows3 },
            { mode: 'grid',   label: 'Grid',   Icon: LayoutGrid },
            { mode: 'stories',label: 'Stories',Icon: Circle },
          ] as const).map(({ mode, label, Icon }) => (
            <button
              key={mode}
              onClick={() => setFeedViewMode(mode as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: feedViewMode === mode ? '#fff' : 'transparent',
                color: feedViewMode === mode ? C.t1 : C.t3,
                boxShadow: feedViewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div style={{ 
          background: C.surface, 
          border: `1px solid ${C.line}`, 
          borderRadius: 12, 
          padding: '100px 40px', 
          textAlign: 'center', 
          boxShadow: card 
        }}>
          <div style={{ marginBottom: 12 }}>
            <LayoutGrid size={32} style={{ color: C.t3, opacity: 0.4 }} />
          </div>
          <p style={{ color: C.t2, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            No {feedStatus !== 'all' ? STATUS_LABEL[feedStatus as keyof typeof STATUS_LABEL].toLowerCase() : ''} {platLabel[feedPlatform]} posts
          </p>
          <p style={{ color: C.t3, fontSize: 12 }}>
            {feedStatus !== 'all' 
              ? 'Try changing the status filter in the sidebar or create a new post'
              : 'Create your first post to see it previewed here'}
          </p>
        </div>
      ) : feedPlatform === 'instagram' && feedViewMode === 'grid' ? (
        <InstagramGrid posts={visible} brandProfile={brandProfile} platColor={platColor} hovered={hovered} setHovered={setHovered} onEditPost={onEditPost} onDeletePost={onDeletePost} />
      ) : feedPlatform === 'instagram' && feedViewMode === 'stories' ? (
        <InstagramStories posts={visible} brandProfile={brandProfile} />
      ) : feedPlatform === 'instagram' ? (
        <InstagramFeed posts={visible} allPosts={posts} brandProfile={brandProfile} hovered={hovered} setHovered={setHovered} onEditPost={onEditPost} onDeletePost={onDeletePost} onUpdatePost={onUpdatePost} />
      ) : feedPlatform === 'facebook' ? (
        <FacebookFeed posts={visible} brandProfile={brandProfile} hovered={hovered} setHovered={setHovered} onEditPost={onEditPost} onDeletePost={onDeletePost} onUpdatePost={onUpdatePost} />
      ) : feedPlatform === 'twitter' ? (
        <TwitterFeed posts={visible} brandProfile={brandProfile} hovered={hovered} setHovered={setHovered} onEditPost={onEditPost} onDeletePost={onDeletePost} onUpdatePost={onUpdatePost} />
      ) : (
        <LinkedInFeed posts={visible} brandProfile={brandProfile} hovered={hovered} setHovered={setHovered} onEditPost={onEditPost} onDeletePost={onDeletePost} onUpdatePost={onUpdatePost} />
      )}
    </div>
  );
}

// ─── Shared drag helpers ─────────────────────────────────────────────────────
function yTarget(e: React.DragEvent, id: string) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2 ? id : `after:${id}`;
}

function commitPostReorder(dragId: string, target: string, posts: Post[], onUpdatePost: (p: Post) => void) {
  const sorted = [...posts].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  const draggedIdx = sorted.findIndex(p => p.id === dragId);
  if (draggedIdx === -1) return;
  const dragged = sorted[draggedIdx];
  const remaining = sorted.filter(p => p.id !== dragId);
  let insertAt = target.startsWith('after:')
    ? (remaining.findIndex(p => p.id === target.slice(6)) + 1) || remaining.length
    : remaining.findIndex(p => p.id === target) === -1 ? remaining.length : remaining.findIndex(p => p.id === target);
  const newOrder = [...remaining];
  newOrder.splice(insertAt, 0, dragged);
  const dates = sorted.map(p => p.scheduledDate);
  newOrder.forEach((post, i) => {
    if (post.scheduledDate.getTime() !== dates[i].getTime()) onUpdatePost({ ...post, scheduledDate: dates[i] });
  });
}

function commitEntryReorder(dragKey: string, target: string, entries: {key: string; posts: Post[]}[], onUpdatePost: (p: Post) => void) {
  const draggedIdx = entries.findIndex(e => e.key === dragKey);
  if (draggedIdx === -1) return;
  const dragged = entries[draggedIdx];
  const remaining = entries.filter(e => e.key !== dragKey);
  let insertAt = target.startsWith('after:')
    ? (remaining.findIndex(e => e.key === target.slice(6)) + 1) || remaining.length
    : remaining.findIndex(e => e.key === target) === -1 ? remaining.length : remaining.findIndex(e => e.key === target);
  const newOrder = [...remaining];
  newOrder.splice(insertAt, 0, dragged);
  const entryDates = entries.map(e => e.posts.reduce((min, p) => p.scheduledDate < min ? p.scheduledDate : min, e.posts[0].scheduledDate));
  newOrder.forEach((entry, i) => {
    const newDate = entryDates[i];
    entry.posts.forEach(post => {
      if (post.scheduledDate.getTime() !== newDate.getTime()) onUpdatePost({ ...post, scheduledDate: newDate });
    });
  });
}

// ─── Instagram Feed ──────────────────────────────────────────────────────────
function InstagramFeed({ posts, allPosts, brandProfile, hovered, setHovered, onEditPost, onDeletePost, onUpdatePost }: any) {
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});
  const [dragKey, setDragKey]         = useState<string | null>(null);
  const [insertTarget, setInsertTarget] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  function startDrag(e: React.DragEvent, key: string) {
    dragNode.current = e.currentTarget as HTMLDivElement;
    setDragKey(key);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0);
  }
  function endDrag() {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    dragNode.current = null;
    setDragKey(null);
    setInsertTarget(null);
  }
  function drop(e: React.DragEvent, key: string) {
    e.preventDefault();
    if (!dragKey || dragKey === key) { endDrag(); return; }
    commitEntryReorder(dragKey, yTarget(e, key), entries, onUpdatePost);
    endDrag();
  }

  // Group posts: carousels become one entry, solo posts stay solo
  const entries = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: string; posts: Post[] }[] = [];
    posts.forEach((post: Post) => {
      if (post.carouselId) {
        if (!seen.has(post.carouselId)) {
          seen.add(post.carouselId);
          result.push({ key: post.carouselId, posts: posts.filter((p: Post) => p.carouselId === post.carouselId) });
        }
      } else {
        result.push({ key: post.id, posts: [post] });
      }
    });
    return result;
  }, [posts]);

  return (
    <div style={{ maxWidth: 470, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {entries.map(({ key, posts: groupPosts }) => {
        const isCarousel = groupPosts.length > 1;
        const slideIndex = carouselIndexes[key] ?? 0;
        const post = groupPosts[slideIndex] ?? groupPosts[0];
        const engagement = getMockEngagement(post.id, post.status);
        const isDragging = dragKey === key;
        const showBefore = insertTarget === key && !isDragging;
        const showAfter  = insertTarget === `after:${key}` && !isDragging;
        return (
          <div key={key} style={{ position: 'relative' }}>
            {showBefore && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginBottom: 6, boxShadow: `0 0 8px ${C.acc}88` }} />}
          <div
            draggable
            onDragStart={e => startDrag(e, key)}
            onDragEnd={endDrag}
            onDragOver={e => { e.preventDefault(); setInsertTarget(yTarget(e, key)); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertTarget(null); }}
            onDrop={e => drop(e, key)}
            style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', opacity: isDragging ? 0.3 : 1, cursor: dragKey ? 'grabbing' : 'grab', transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: C.t1, fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{brandProfile.handle}</p>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t1, padding: 4, lineHeight: 0 }}>
                <MoreHorizontal size={20} strokeWidth={2} />
              </button>
            </div>

            {post.image && (
              <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: C.bg, borderTop: `1px solid ${C.lineSub}`, borderBottom: `1px solid ${C.lineSub}` }}>
                <ImageWithFallback src={post.image} alt="post" className="w-full h-full object-cover" />
                {/* Carousel nav */}
                {isCarousel && (
                  <>
                    {slideIndex > 0 && (
                      <button onClick={() => setCarouselIndexes(p => ({ ...p, [key]: slideIndex - 1 }))}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>‹</button>
                    )}
                    {slideIndex < groupPosts.length - 1 && (
                      <button onClick={() => setCarouselIndexes(p => ({ ...p, [key]: slideIndex + 1 }))}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>›</button>
                    )}
                    {/* Dots */}
                    <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                      {groupPosts.map((_: Post, i: number) => (
                        <div key={i} onClick={() => setCarouselIndexes(p => ({ ...p, [key]: i }))} style={{ width: 6, height: 6, borderRadius: '50%', background: i === slideIndex ? C.acc : 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    {/* Slide counter */}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '3px 8px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                      {slideIndex + 1}/{groupPosts.length}
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ padding: '4px 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingTop: 8 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[Heart, MessageCircle, Send].map((Icon, i) => (
                    <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t1, lineHeight: 0, padding: 0 }}>
                      <Icon size={24} strokeWidth={2} />
                    </button>
                  ))}
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t1, lineHeight: 0, padding: 0 }}>
                  <Bookmark size={24} strokeWidth={2} />
                </button>
              </div>

              {engagement && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ color: C.t1, fontSize: 14, fontWeight: 600 }}>{engagement.likes.toLocaleString()} likes</p>
                </div>
              )}

              <div style={{ marginBottom: 4 }}>
                <p style={{ color: C.t1, fontSize: 14, lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600, marginRight: 6 }}>{brandProfile.handle}</strong>
                  <span style={{ color: C.t1 }}>{post.content}</span>
                </p>
              </div>

              {engagement && engagement.comments > 0 && (
                <button style={{ background: 'none', border: 'none', padding: 0, color: C.t3, fontSize: 14, cursor: 'pointer', marginBottom: 4 }}>
                  View all {engagement.comments} comments
                </button>
              )}

              <p style={{ color: C.t3, fontSize: 12, marginTop: 6 }}>
                {new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 10px', background: C.bg, borderRadius: 6, border: `1px solid ${C.lineSub}` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[post.status] }} />
                <span style={{ color: C.t3, fontSize: 11, fontWeight: 500 }}>
                  {STATUS_LABEL[post.status]} · {new Date(post.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {hovered === key && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 8 }} className="enter">
                <button onClick={() => onEditPost(post)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: 'none', color: C.t1, borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Edit2 size={15} /> Edit
                </button>
                <button onClick={() => onDeletePost(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.95)', border: 'none', color: '#fff', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
            {showAfter && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginTop: 6, boxShadow: `0 0 8px ${C.acc}88` }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Instagram Grid ──────────────────────────────────────────────────────────
function InstagramGrid({ posts, brandProfile, platColor, hovered, setHovered, onEditPost, onDeletePost }: any) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden', boxShadow: card }}>
      <div style={{ padding: '32px 28px', borderBottom: `1px solid ${C.line}`, background: `linear-gradient(to bottom, ${C.bg}, ${C.surface})` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
          <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0, border: `4px solid ${C.surface}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <p style={{ color: C.t1, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{brandProfile.handle}</p>
              <button style={{ background: platColor, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>Follow</button>
              <button style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.t1, borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Message</button>
            </div>
            <div style={{ display: 'flex', gap: 28, marginBottom: 14 }}>
              {[{ l: 'posts', v: String(posts.length) }, { l: 'followers', v: brandProfile.followers }, { l: 'following', v: brandProfile.following }].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ color: C.t1, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.v}</span>
                  <span style={{ color: C.t3, fontSize: 13, fontWeight: 500 }}>{s.l}</span>
                </div>
              ))}
            </div>
            <p style={{ color: C.t1, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{brandProfile.name}</p>
            <p style={{ color: C.t2, fontSize: 13, lineHeight: 1.6, letterSpacing: '-0.01em', marginBottom: brandProfile.website ? 6 : 0 }}>{brandProfile.bio}</p>
            {brandProfile.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={13} style={{ color: C.t3 }} />
                <span style={{ color: C.blue, fontSize: 13, fontWeight: 500 }}>{brandProfile.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, background: C.lineSub, padding: 3 }}>
        {posts.map((post: Post) => {
          const engagement = getMockEngagement(post.id, post.status);
          return (
            <div key={post.id} style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', cursor: 'pointer', background: C.bg, borderRadius: 6 }} className="group" onMouseEnter={() => setHovered(post.id)} onMouseLeave={() => setHovered(null)}>
              {post.image ? (
                <ImageWithFallback src={post.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${C.bg}, ${C.surface})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  <p style={{ color: C.t3, fontSize: 11, textAlign: 'center', lineHeight: 1.5, fontWeight: 500 }} className="line-clamp-5">{post.content.slice(0, 90)}</p>
                </div>
              )}
              <div style={{ position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: '50%', background: STATUS_DOT[post.status], border: '2.5px solid rgba(255,255,255,0.95)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
              {hovered === post.id && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }} className="enter">
                  {engagement && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Heart size={16} fill="#fff" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{engagement.likes}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageCircle size={16} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{engagement.comments}</span>
                      </div>
                    </div>
                  )}
                  <button onClick={() => onEditPost(post)} style={{ background: 'rgba(255,255,255,0.95)', border: 'none', color: C.t1, borderRadius: 7, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => onDeletePost(post.id)} style={{ background: 'rgba(239,68,68,0.95)', border: 'none', color: '#fff', borderRadius: 7, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Facebook Feed ───────────────────────────────────────────────────────────
function FacebookFeed({ posts, brandProfile, hovered, setHovered, onEditPost, onDeletePost, onUpdatePost }: any) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [insertTarget, setInsertTarget] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  function startDrag(e: React.DragEvent, id: string) { dragNode.current = e.currentTarget as HTMLDivElement; setDragId(id); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0); }
  function endDrag() { if (dragNode.current) dragNode.current.style.opacity = '1'; dragNode.current = null; setDragId(null); setInsertTarget(null); }
  function drop(e: React.DragEvent, id: string) { e.preventDefault(); if (!dragId || dragId === id) { endDrag(); return; } commitPostReorder(dragId, yTarget(e, id), posts, onUpdatePost); endDrag(); }
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {posts.map((post: Post) => {
        const engagement = getMockEngagement(post.id, post.status);
        const isDragging = dragId === post.id;
        const showBefore = insertTarget === post.id && !isDragging;
        const showAfter  = insertTarget === `after:${post.id}` && !isDragging;
        return (
          <div key={post.id} style={{ position: 'relative' }}>
            {showBefore && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginBottom: 6, boxShadow: `0 0 8px ${C.acc}88` }} />}
          <div
            draggable
            onDragStart={e => startDrag(e, post.id)}
            onDragEnd={endDrag}
            onDragOver={e => { e.preventDefault(); setInsertTarget(yTarget(e, post.id)); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertTarget(null); }}
            onDrop={e => drop(e, post.id)}
            style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', opacity: isDragging ? 0.3 : 1, cursor: dragId ? 'grabbing' : 'grab', transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(post.id)} onMouseLeave={() => setHovered(null)}>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.t1, fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{brandProfile.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ color: C.t3, fontSize: 13 }}>{new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span style={{ color: C.t3, fontSize: 13 }}>·</span>
                    <Globe size={12} style={{ color: C.t3 }} />
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, lineHeight: 0 }}>
                  <MoreHorizontal size={20} />
                </button>
              </div>
              
              <p style={{ color: C.t1, fontSize: 15, lineHeight: 1.4, marginBottom: 12 }}>{post.content}</p>
            </div>

            {post.image && (
              <div style={{ overflow: 'hidden', background: C.bg }}>
                <ImageWithFallback src={post.image} alt="post" className="w-full object-cover" style={{ maxHeight: 500 }} />
              </div>
            )}

            <div style={{ padding: '8px 16px', borderTop: `1px solid ${C.lineSub}` }}>
              {engagement && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.lineSub}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white' }}>
                        <ThumbsUp size={10} fill="white" color="white" />
                      </div>
                    </div>
                    <span style={{ color: C.t3, fontSize: 13 }}>{engagement.likes}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: C.t3, fontSize: 13 }}>{engagement.comments} comments</span>
                    <span style={{ color: C.t3, fontSize: 13 }}>{engagement.shares} shares</span>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 4 }}>
                {[
                  { icon: ThumbsUp, label: 'Like' },
                  { icon: MessageCircle, label: 'Comment' },
                  { icon: Share2, label: 'Share' }
                ].map(({ icon: Icon, label }) => (
                  <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: '6px 12px', borderRadius: 4, fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 10px', background: C.bg, borderRadius: 6, border: `1px solid ${C.lineSub}` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[post.status] }} />
                <span style={{ color: C.t3, fontSize: 11, fontWeight: 500 }}>
                  {STATUS_LABEL[post.status]} · {new Date(post.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {hovered === post.id && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 8 }} className="enter">
                <button onClick={() => onEditPost(post)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: 'none', color: C.t1, borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Edit2 size={15} /> Edit
                </button>
                <button onClick={() => onDeletePost(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.95)', border: 'none', color: '#fff', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
            {showAfter && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginTop: 6, boxShadow: `0 0 8px ${C.acc}88` }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Twitter/X Feed ──────────────────────────────────────────────────────────
function TwitterFeed({ posts, brandProfile, hovered, setHovered, onEditPost, onDeletePost, onUpdatePost }: any) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [insertTarget, setInsertTarget] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  function startDrag(e: React.DragEvent, id: string) { dragNode.current = e.currentTarget as HTMLDivElement; setDragId(id); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0); }
  function endDrag() { if (dragNode.current) dragNode.current.style.opacity = '1'; dragNode.current = null; setDragId(null); setInsertTarget(null); }
  function drop(e: React.DragEvent, id: string) { e.preventDefault(); if (!dragId || dragId === id) { endDrag(); return; } commitPostReorder(dragId, yTarget(e, id), posts, onUpdatePost); endDrag(); }
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {posts.map((post: Post) => {
        const engagement = getMockEngagement(post.id, post.status);
        const isDragging = dragId === post.id;
        const showBefore = insertTarget === post.id && !isDragging;
        const showAfter  = insertTarget === `after:${post.id}` && !isDragging;
        return (
          <div key={post.id} style={{ position: 'relative' }}>
            {showBefore && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginBottom: 4, boxShadow: `0 0 8px ${C.acc}88` }} />}
          <div
            draggable
            onDragStart={e => startDrag(e, post.id)}
            onDragEnd={endDrag}
            onDragOver={e => { e.preventDefault(); setInsertTarget(yTarget(e, post.id)); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertTarget(null); }}
            onDrop={e => drop(e, post.id)}
            style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, padding: '12px 16px', position: 'relative', transition: 'opacity 0.15s', opacity: isDragging ? 0.3 : 1, cursor: dragId ? 'grabbing' : 'grab' }}
            onMouseEnter={() => setHovered(post.id)}
            onMouseLeave={() => setHovered(null)}
            onMouseOver={e => (e.currentTarget.style.background = C.bg)}
            onMouseOut={e => (e.currentTarget.style.background = C.surface)}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ color: C.t1, fontSize: 15, fontWeight: 700 }}>{brandProfile.name}</span>
                  <span style={{ color: C.t3, fontSize: 15 }}>@{brandProfile.handle}</span>
                  <span style={{ color: C.t3, fontSize: 15 }}>·</span>
                  <span style={{ color: C.t3, fontSize: 15 }}>
                    {new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p style={{ color: C.t1, fontSize: 15, lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.content}</p>

                {post.image && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.line}`, marginBottom: 12 }}>
                    <ImageWithFallback src={post.image} alt="post" className="w-full object-cover" style={{ maxHeight: 400 }} />
                  </div>
                )}

                {engagement && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 425, paddingTop: 4 }}>
                    {[
                      { icon: MessageCircle, value: engagement.comments },
                      { icon: Repeat2, value: engagement.shares * 2 },
                      { icon: Heart, value: engagement.likes },
                      { icon: BarChart3, value: engagement.likes * 3 }
                    ].map(({ icon: Icon, value }, i) => (
                      <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, fontSize: 13, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = C.t1)}
                        onMouseLeave={e => (e.currentTarget.style.color = C.t3)}>
                        <Icon size={16} />
                        <span>{value}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 10px', background: C.surface, borderRadius: 6, border: `1px solid ${C.lineSub}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[post.status] }} />
                  <span style={{ color: C.t3, fontSize: 11, fontWeight: 500 }}>
                    {STATUS_LABEL[post.status]} · {new Date(post.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, height: 24, lineHeight: 0 }}>
                <MoreHorizontal size={18} />
              </button>
            </div>

            {hovered === post.id && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }} className="enter">
                <button onClick={() => onEditPost(post)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: 'none', color: C.t1, borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Edit2 size={15} /> Edit
                </button>
                <button onClick={() => onDeletePost(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.95)', border: 'none', color: '#fff', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
            {showAfter && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginTop: 4, boxShadow: `0 0 8px ${C.acc}88` }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Instagram Stories ───────────────────────────────────────────────────────
function InstagramStories({ posts, brandProfile }: any) {
  const [current, setCurrent] = useState(0);
  const post: Post = posts[current];
  if (!post) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Story bubbles row */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0', maxWidth: 500, width: '100%' }}>
        {posts.map((p: Post, i: number) => (
          <button
            key={p.id}
            onClick={() => setCurrent(i)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%', padding: 3,
              background: i === current
                ? 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
                : C.line,
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', background: C.bg }}>
                {p.image
                  ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: '100%', height: '100%' }} />
                }
              </div>
            </div>
            <span style={{ fontSize: 11, color: i === current ? C.t1 : C.t3, fontWeight: i === current ? 600 : 400, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {new Date(p.scheduledDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </span>
          </button>
        ))}
      </div>

      {/* Story card */}
      <div style={{
        width: 320, height: 568,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        background: '#111',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        {/* Background image */}
        {post.image
          ? <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: '100%', height: '100%' }} />
        }

        {/* Progress bars */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4 }}>
          {posts.slice(0, Math.min(posts.length, 10)).map((_: any, i: number) => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i < current ? '#fff' : i === current ? '#fff' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', top: 24, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', flexShrink: 0 }}>
            <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: '100%', height: '100%' }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{brandProfile.handle}</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 1.4 }}>
              {new Date(post.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Caption overlay at bottom */}
        {post.content && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
            padding: '40px 16px 24px',
          }}>
            <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.5, textShadow: '0 1px 3px rgba(0,0,0,0.5)', margin: 0 }}>
              {post.content.slice(0, 120)}{post.content.length > 120 ? '…' : ''}
            </p>
          </div>
        )}

        {/* Nav areas */}
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: current > 0 ? 'pointer' : 'default' }}
        />
        <button
          onClick={() => setCurrent(c => Math.min(posts.length - 1, c + 1))}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'transparent', border: 'none', cursor: current < posts.length - 1 ? 'pointer' : 'default' }}
        />
      </div>

      <p style={{ fontSize: 12, color: C.t3 }}>Tap left/right on the story or click a bubble to navigate · {current + 1} of {posts.length}</p>
    </div>
  );
}

// ─── LinkedIn Feed ───────────────────────────────────────────────────────────
function LinkedInFeed({ posts, brandProfile, hovered, setHovered, onEditPost, onDeletePost, onUpdatePost }: any) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [insertTarget, setInsertTarget] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  function startDrag(e: React.DragEvent, id: string) { dragNode.current = e.currentTarget as HTMLDivElement; setDragId(id); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0); }
  function endDrag() { if (dragNode.current) dragNode.current.style.opacity = '1'; dragNode.current = null; setDragId(null); setInsertTarget(null); }
  function drop(e: React.DragEvent, id: string) { e.preventDefault(); if (!dragId || dragId === id) { endDrag(); return; } commitPostReorder(dragId, yTarget(e, id), posts, onUpdatePost); endDrag(); }
  return (
    <div style={{ maxWidth: 550, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {posts.map((post: Post) => {
        const engagement = getMockEngagement(post.id, post.status);
        const isDragging = dragId === post.id;
        const showBefore = insertTarget === post.id && !isDragging;
        const showAfter  = insertTarget === `after:${post.id}` && !isDragging;
        return (
          <div key={post.id} style={{ position: 'relative' }}>
            {showBefore && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginBottom: 4, boxShadow: `0 0 8px ${C.acc}88` }} />}
          <div
            draggable
            onDragStart={e => startDrag(e, post.id)}
            onDragEnd={endDrag}
            onDragOver={e => { e.preventDefault(); setInsertTarget(yTarget(e, post.id)); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertTarget(null); }}
            onDrop={e => drop(e, post.id)}
            style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)', position: 'relative', opacity: isDragging ? 0.3 : 1, cursor: dragId ? 'grabbing' : 'grab', transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(post.id)} onMouseLeave={() => setHovered(null)}>
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div className={`bg-gradient-to-br ${brandProfile.avatarGradient}`} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.t1, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{brandProfile.name}</p>
                  <p style={{ color: C.t3, fontSize: 12, lineHeight: 1.4 }}>{brandProfile.bio.split('|')[0].trim()}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ color: C.t3, fontSize: 12 }}>
                      {new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ color: C.t3, fontSize: 12 }}>·</span>
                    <Globe size={12} style={{ color: C.t3 }} />
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, lineHeight: 0 }}>
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <p style={{ color: C.t1, fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>{post.content}</p>
            </div>

            {post.image && (
              <div style={{ overflow: 'hidden', background: C.bg }}>
                <ImageWithFallback src={post.image} alt="post" className="w-full object-cover" />
              </div>
            )}

            <div style={{ padding: '8px 16px' }}>
              {engagement && (
                <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.lineSub}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', marginRight: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white' }}>
                        <ThumbsUp size={9} fill="white" color="white" />
                      </div>
                    </div>
                    <span style={{ color: C.t3, fontSize: 12 }}>{engagement.likes}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {[
                  { icon: ThumbsUp, label: 'Like' },
                  { icon: MessageCircle, label: 'Comment' },
                  { icon: Repeat2, label: 'Repost' },
                  { icon: Send, label: 'Send' }
                ].map(({ icon: Icon, label }) => (
                  <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: '8px 12px', borderRadius: 4, fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: C.bg, borderRadius: 6, border: `1px solid ${C.lineSub}` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[post.status] }} />
                <span style={{ color: C.t3, fontSize: 11, fontWeight: 500 }}>
                  {STATUS_LABEL[post.status]} · {new Date(post.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {hovered === post.id && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 8 }} className="enter">
                <button onClick={() => onEditPost(post)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: 'none', color: C.t1, borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Edit2 size={15} /> Edit
                </button>
                <button onClick={() => onDeletePost(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.95)', border: 'none', color: '#fff', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
            {showAfter && <div style={{ height: 3, background: C.acc, borderRadius: 2, marginTop: 4, boxShadow: `0 0 8px ${C.acc}88` }} />}
          </div>
        );
      })}
    </div>
  );
}
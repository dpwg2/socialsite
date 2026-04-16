import { useState } from 'react';
import { Post } from '../App';
import { Search, X, Edit2, Trash2, Copy, MoreHorizontal } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { C, card, platLabel } from '../utils/ds';

interface Props {
  posts: Post[];
  onEditPost: (p: Post) => void;
  onDeletePost: (id: string) => void;
  onDuplicatePost: (p: Post) => void;
}

type Status   = 'all' | 'scheduled' | 'draft' | 'posted';
type Platform = 'all' | 'instagram' | 'twitter' | 'facebook' | 'linkedin';

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

const fmt = (d: Date) =>
  new Date(d).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' +
  new Date(d).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

export function ScheduledPosts({ posts, onEditPost, onDeletePost, onDuplicatePost }: Props) {
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState<Status>('all');
  const [platform, setPlatform] = useState<Platform>('all');
  const [open,     setOpen]     = useState<string | null>(null);

  const filtered = posts
    .filter(p => {
      if (status !== 'all'   && p.status   !== status)   return false;
      if (platform !== 'all' && p.platform !== platform) return false;
      if (search) {
        const s = search.toLowerCase();
        return p.content.toLowerCase().includes(s) || p.tags?.some(t => t.toLowerCase().includes(s));
      }
      return true;
    })
    .sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));

  const counts = {
    all: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    posted:    posts.filter(p => p.status === 'posted').length,
    draft:     posts.filter(p => p.status === 'draft').length,
  };

  return (
    <div style={{ maxWidth: 1040 }} className="enter">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.t3 }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.line}`,
              borderRadius: 8, padding: '8px 10px 8px 30px', fontSize: 13, color: C.t1,
              outline: 'none', boxShadow: card, boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.t3, lineHeight: 0, padding: 0 }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: card }}>
          {(['all','scheduled','draft','posted'] as Status[]).map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              height: 36, padding: '0 14px', border: 'none', cursor: 'pointer',
              background: status === s ? C.acc : 'transparent',
              color: status === s ? '#fff' : C.t2,
              fontSize: 12, fontWeight: status === s ? 600 : 400,
              transition: 'all 0.12s', borderRight: `1px solid ${C.line}`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {s !== 'all' && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: status === s ? '#fff' : STATUS_DOT[s], display: 'inline-block' }} />
              )}
              {s === 'all' ? `All (${counts.all})` : `${STATUS_LABEL[s]} (${counts[s]})`}
            </button>
          ))}
        </div>

        {/* Platform filter */}
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value as Platform)}
          style={{
            background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
            padding: '0 12px', height: 36, fontSize: 12, color: C.t2, cursor: 'pointer',
            outline: 'none', boxShadow: card,
          }}
        >
          <option value="all">All platforms</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">X / Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: card }}>
        {/* Head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 100px 160px 52px',
          gap: 0, padding: '0 16px', height: 36,
          borderBottom: `1px solid ${C.line}`, alignItems: 'center',
          background: C.bg,
        }}>
          {['', 'Post', 'Status', 'Scheduled', ''].map((h, i) => (
            <span key={i} style={{ color: C.t3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', paddingRight: i === 1 ? 12 : 0 }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: C.t3, fontSize: 13 }}>No posts match your filters</p>
            {(search || status !== 'all' || platform !== 'all') && (
              <button onClick={() => { setSearch(''); setStatus('all'); setPlatform('all'); }}
                style={{ background: 'none', border: 'none', color: C.acc, fontSize: 13, cursor: 'pointer', marginTop: 8, fontWeight: 500 }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((post, i) => {
            const isLast = i === filtered.length - 1;
            const platColor = (C as any)[post.platform];
            return (
              <div
                key={post.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 100px 160px 52px',
                  gap: 0, padding: '0 16px', height: 58, alignItems: 'center',
                  borderBottom: isLast ? 'none' : `1px solid ${C.lineSub}`,
                  transition: 'background 0.1s',
                  position: 'relative',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Platform dot */}
                <div>
                  <div title={platLabel[post.platform]} style={{ width: 7, height: 7, borderRadius: '50%', background: platColor }} />
                </div>

                {/* Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, paddingRight: 12 }}>
                  {post.image && (
                    <div style={{ width: 36, height: 36, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
                      <ImageWithFallback src={post.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: C.t1, fontSize: 13, lineHeight: 1.4 }} className="truncate">{post.content}</p>
                    {post.tags && post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                        {post.tags.slice(0, 2).map(t => (
                          <span key={t} className="tag">{t}</span>
                        ))}
                        {post.tags.length > 2 && <span className="tag">+{post.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_DOT[post.status], flexShrink: 0 }} />
                  <span style={{ color: C.t2, fontSize: 12 }}>{STATUS_LABEL[post.status]}</span>
                </div>

                {/* Date */}
                <p style={{ color: C.t3, fontSize: 11 }}>
                  {new Date(post.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                  {' · '}
                  {new Date(post.scheduledDate).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <button onClick={() => onEditPost(post)} title="Edit"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 5, color: C.t3, lineHeight: 0 }}
                    className="hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onDuplicatePost(post)} title="Duplicate"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 5, color: C.t3, lineHeight: 0 }}
                    className="hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Copy size={13} />
                  </button>
                  <button onClick={() => onDeletePost(post.id)} title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 5, color: C.t3, lineHeight: 0 }}
                    className="hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p style={{ color: C.t3, fontSize: 11, marginTop: 10 }}>
        {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        {(search || status !== 'all' || platform !== 'all') ? ' — filtered' : ''}
      </p>
    </div>
  );
}

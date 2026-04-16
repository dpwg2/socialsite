import { Post } from '../App';
import { Edit2, Trash2, Copy, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { C, card, platLabel } from '../utils/ds';

interface PostCardProps {
  post: Post;
  onEdit: (p: Post) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (p: Post) => void;
  compact?: boolean;
}

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

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) + ' · ' +
  new Date(d).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

export function PostCard({ post, onEdit, onDelete, onDuplicate, compact }: PostCardProps) {
  const platColor = (C as any)[post.platform] as string;

  if (compact) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: card }}>
        {post.image && (
          <div style={{ height: 60, overflow: 'hidden' }}>
            <ImageWithFallback src={post.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: platColor }} />
            <span style={{ color: C.t3, fontSize: 11 }}>{platLabel[post.platform]}</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: STATUS_DOT[post.status] }} />
              <span style={{ color: C.t3, fontSize: 10 }}>{STATUS_LABEL[post.status]}</span>
            </span>
          </div>
          <p style={{ color: C.t2, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }} className="line-clamp-2">{post.content}</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onEdit(post)} style={{ flex: 1, background: C.bg, border: `1px solid ${C.line}`, color: C.t2, borderRadius: 6, padding: '5px 0', fontSize: 11, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => onDelete(post.id)} style={{ flex: 1, background: C.bg, border: `1px solid ${C.line}`, color: C.red, borderRadius: 6, padding: '5px 0', fontSize: 11, cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group"
      style={{
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
        overflow: 'hidden', boxShadow: card, transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#D0D0D8'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.line; el.style.boxShadow = card; }}
    >
      {/* Image */}
      {post.image ? (
        <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
          <ImageWithFallback src={post.image} alt="post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {/* Platform dot overlay */}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', borderRadius: 99, height: 20, padding: '0 7px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: platColor }} />
              <span style={{ color: C.t1, fontSize: 10, fontWeight: 500 }}>{platLabel[post.platform]}</span>
            </div>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <button onClick={() => onEdit(post)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: 'none', color: C.t1, borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Edit2 size={12} /> Edit
            </button>
            {onDuplicate && (
              <button onClick={() => onDuplicate(post)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer', lineHeight: 0 }}>
                <Copy size={12} />
              </button>
            )}
            <button onClick={() => onDelete(post.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(220,38,38,0.8)', border: 'none', color: '#fff', borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer', lineHeight: 0 }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ height: 3, background: platColor }} />
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {!post.image && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: platColor }} />
              <span style={{ color: C.t3, fontSize: 11 }}>{platLabel[post.platform]}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: post.image ? 'auto' : undefined }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_DOT[post.status] }} />
            <span style={{ color: C.t2, fontSize: 11 }}>{STATUS_LABEL[post.status]}</span>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {post.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        )}

        {/* Content */}
        <p style={{ color: C.t2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }} className="line-clamp-3">{post.content}</p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.lineSub}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.t3 }}>
            <Clock size={10} />
            <span style={{ fontSize: 11 }}>{fmtDate(post.scheduledDate)}</span>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            <button onClick={() => onEdit(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 5, color: C.t3, lineHeight: 0, transition: 'color 0.12s' }} className="hover:text-gray-600">
              <Edit2 size={12} />
            </button>
            {onDuplicate && (
              <button onClick={() => onDuplicate(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 5, color: C.t3, lineHeight: 0 }} className="hover:text-gray-600 transition-colors">
                <Copy size={12} />
              </button>
            )}
            <button onClick={() => onDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 5, color: C.t3, lineHeight: 0 }} className="hover:text-red-500 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

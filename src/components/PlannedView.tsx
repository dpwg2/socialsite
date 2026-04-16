import { useState, useRef, useMemo } from 'react';
import { Post } from '../App';
import { C } from '../utils/ds';
import {
  Instagram, Facebook, Twitter, Linkedin,
  GripVertical, Lock, Unlock, Calendar, Pencil, Trash2, ArrowRight,
} from 'lucide-react';

interface Props {
  posts: Post[];
  onUpdatePost: (p: Post) => void;
  onEditPost: (p: Post) => void;
  onDeletePost: (id: string) => void;
}

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#E1306C',
  facebook:  '#1877F2',
  twitter:   '#1DA1F2',
  linkedin:  '#0A66C2',
};
const PLATFORM_ICON: Record<string, React.ElementType> = {
  instagram: Instagram, facebook: Facebook, twitter: Twitter, linkedin: Linkedin,
};
const STATUS_COLOR: Record<string, string> = {
  scheduled: '#7C3AED', posted: '#16A34A', draft: '#9CA3AF',
};

function pad(n: number) { return String(n).padStart(2, '0'); }
function toLocalInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PlannedView({ posts, onUpdatePost, onEditPost, onDeletePost }: Props) {
  const [dragId, setDragId]           = useState<string | null>(null);
  const [insertBefore, setInsertBefore] = useState<string | null>(null); // post id or 'end'
  const [datePickerId, setDatePickerId] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  const lastInsertRef = useRef<string | null>(null);

  // All non-posted posts, sorted by planOrder then by creation (id)
  const planned = useMemo(() => {
    return [...posts]
      .filter(p => p.status !== 'posted')
      .sort((a, b) => {
        const ao = a.planOrder ?? 999999;
        const bo = b.planOrder ?? 999999;
        if (ao !== bo) return ao - bo;
        return a.id.localeCompare(b.id);
      });
  }, [posts]);

  function startDrag(e: React.DragEvent, id: string) {
    dragNode.current = e.currentTarget as HTMLDivElement;
    lastInsertRef.current = null;
    setDragId(id);
    setInsertBefore(null);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0);
  }
  function endDrag() {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    dragNode.current = null;
    lastInsertRef.current = null;
    setDragId(null);
    setInsertBefore(null);
  }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const target = e.clientY < rect.top + rect.height / 2 ? id : `after:${id}`;
    setInsertBefore(target);
    lastInsertRef.current = target;
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const target = insertBefore ?? lastInsertRef.current;
    if (!dragId || !target) { endDrag(); return; }

    const resolvedId = target.startsWith('after:') ? target.slice(6) : target;
    if (resolvedId === dragId) { endDrag(); return; }

    const dragged = planned.find(p => p.id === dragId);
    if (!dragged || dragged.locked) { endDrag(); return; }

    const remaining = planned.filter(p => p.id !== dragId);
    const targetIdx = remaining.findIndex(p => p.id === resolvedId);
    if (targetIdx === -1) { endDrag(); return; }
    const insertAt = target.startsWith('after:') ? targetIdx + 1 : targetIdx;
    const newOrder = [...remaining];
    newOrder.splice(insertAt, 0, dragged);

    // Assign planOrder as index * 1000 (room to insert later)
    newOrder.forEach((p, i) => {
      if (!p.locked) onUpdatePost({ ...p, planOrder: i * 1000 });
    });
    endDrag();
  }

  function addAllToPlanned() {
    planned.forEach((p, i) => {
      if (p.planOrder === undefined) onUpdatePost({ ...p, planOrder: i * 1000 });
    });
  }

  function sendToSchedule(post: Post) {
    setDatePickerId(post.id);
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Planned</h2>
          <p style={{ fontSize: 13, color: C.t2, marginTop: 3, marginBottom: 0 }}>
            {planned.length} posts in queue · drag to set order, lock to pin position
          </p>
        </div>
        {planned.some(p => p.planOrder === undefined) && (
          <button
            onClick={addAllToPlanned}
            style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.line}`, background: '#fff', color: C.t1, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Set order for all
          </button>
        )}
      </div>

      {/* List */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {planned.map((post, idx) => {
          const Icon = PLATFORM_ICON[post.platform];
          const isDragging = dragId === post.id;
          const showAbove = (insertBefore === post.id) && dragId !== post.id;
          const showBelow = (insertBefore === `after:${post.id}`) && dragId !== post.id;
          const hasDate = post.scheduledDate && post.status === 'scheduled';

          return (
            <div key={post.id}>
              {/* Insert indicator above */}
              {showAbove && (
                <div style={{ height: 3, background: C.acc, borderRadius: 2, margin: '2px 0', boxShadow: `0 0 8px ${C.acc}88` }} />
              )}

              <div
                ref={isDragging ? dragNode : undefined}
                draggable={!post.locked}
                onDragStart={post.locked ? undefined : e => startDrag(e, post.id)}
                onDragEnd={endDrag}
                onDragOver={e => handleDragOver(e, post.id)}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertBefore(null); }}
                onDrop={handleDrop}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', marginBottom: 6,
                  background: '#fff', borderRadius: 12,
                  border: post.locked ? `2px solid #F59E0B` : `1px solid ${C.line}`,
                  boxShadow: post.locked ? '0 2px 6px rgba(245,158,11,0.15)' : isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                  opacity: isDragging ? 0.3 : 1,
                  cursor: post.locked ? 'default' : dragId ? 'grabbing' : 'grab',
                  transition: 'opacity 0.15s, box-shadow 0.15s',
                }}
              >
                {/* Slot number */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: post.locked ? '#FEF3C7' : C.bg, border: `1px solid ${post.locked ? '#F59E0B' : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: post.locked ? '#92400E' : C.t2, flexShrink: 0 }}>
                  {idx + 1}
                </div>

                {/* Drag handle */}
                {!post.locked && (
                  <GripVertical size={15} color={C.t3} style={{ flexShrink: 0 }} />
                )}
                {post.locked && (
                  <Lock size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                )}

                {/* Thumbnail */}
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.bg, border: `1px solid ${C.line}` }}>
                  {post.image
                    ? <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={PLATFORM_COLOR[post.platform]} />
                      </div>
                  }
                </div>

                {/* Platform chip */}
                <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: PLATFORM_COLOR[post.platform], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={12} color="#fff" />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: C.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    {post.content || <span style={{ color: C.t3 }}>No caption</span>}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: C.t3 }}>
                      {hasDate
                        ? post.scheduledDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'No date set'
                      }
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLOR[post.status], background: STATUS_COLOR[post.status] + '18', padding: '1px 6px', borderRadius: 4 }}>
                      {post.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {/* Schedule date button */}
                  {datePickerId === post.id ? (
                    <input
                      autoFocus
                      type="datetime-local"
                      defaultValue={toLocalInputValue(post.scheduledDate)}
                      onChange={e => {
                        if (!e.target.value) return;
                        onUpdatePost({ ...post, scheduledDate: new Date(e.target.value), status: 'scheduled' });
                      }}
                      onBlur={() => setDatePickerId(null)}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.acc}`, outline: 'none', color: C.t1, background: '#fff' }}
                    />
                  ) : (
                    <button
                      onClick={() => sendToSchedule(post)}
                      title="Assign date"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.line}`, background: '#fff', color: C.t2, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                    >
                      <Calendar size={12} />
                      {hasDate ? 'Change date' : 'Schedule'}
                      <ArrowRight size={11} />
                    </button>
                  )}

                  {/* Lock toggle */}
                  <button
                    onClick={() => onUpdatePost({ ...post, locked: !post.locked })}
                    title={post.locked ? 'Unlock' : 'Lock position'}
                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${post.locked ? '#F59E0B' : C.line}`, background: post.locked ? '#FEF3C7' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: post.locked ? '#92400E' : C.t3 }}
                  >
                    {post.locked ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => onEditPost(post)}
                    title="Edit"
                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.t3 }}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeletePost(post.id)}
                    title="Delete"
                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Insert indicator below */}
              {showBelow && (
                <div style={{ height: 3, background: C.acc, borderRadius: 2, margin: '2px 0', boxShadow: `0 0 8px ${C.acc}88` }} />
              )}
            </div>
          );
        })}

        {planned.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.t3, fontSize: 14 }}>
            No posts yet — create one and it'll appear here
          </div>
        )}
      </div>
    </div>
  );
}

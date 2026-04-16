import { useState, useRef, useMemo } from 'react';
import { Post } from '../App';
import { C } from '../utils/ds';
import {
  Instagram, Facebook, Twitter, Linkedin,
  GripVertical, Lock, Unlock, Calendar, Pencil, Trash2, ArrowRight, List, LayoutGrid, Layers,
} from 'lucide-react';

interface Props {
  posts: Post[];
  onUpdatePost: (p: Post) => void;
  onEditPost: (p: Post) => void;
  onDeletePost: (id: string) => void;
}

type Entry = { key: string; posts: Post[] };

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', twitter: '#1DA1F2', linkedin: '#0A66C2',
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

function entryLocked(e: Entry) { return e.posts.some(p => p.locked); }
function entryPlanOrder(e: Entry) {
  return Math.min(...e.posts.map(p => p.planOrder ?? 999999));
}

export function PlannedView({ posts, onUpdatePost, onEditPost, onDeletePost }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [zoom, setZoom]         = useState(100);
  const [dragId, setDragId]     = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<string | null>(null);
  const [datePickerId, setDatePickerId] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  const lastInsertRef = useRef<string | null>(null);

  // Collapse into carousel-aware entries, sort locked first then by planOrder
  const entries = useMemo<Entry[]>(() => {
    const filtered = [...posts].filter(p => p.status !== 'posted');
    filtered.sort((a, b) => {
      const ao = a.planOrder ?? 999999;
      const bo = b.planOrder ?? 999999;
      if (ao !== bo) return ao - bo;
      return a.id.localeCompare(b.id);
    });
    const seen = new Set<string>();
    const result: Entry[] = [];
    filtered.forEach(p => {
      if (p.carouselId) {
        if (!seen.has(p.carouselId)) {
          seen.add(p.carouselId);
          result.push({ key: p.carouselId, posts: filtered.filter(x => x.carouselId === p.carouselId) });
        }
      } else {
        result.push({ key: p.id, posts: [p] });
      }
    });
    // Locked entries float to top
    result.sort((a, b) => {
      const al = entryLocked(a), bl = entryLocked(b);
      if (al && !bl) return -1;
      if (!al && bl) return 1;
      return entryPlanOrder(a) - entryPlanOrder(b);
    });
    return result;
  }, [posts]);

  function toggleLock(entry: Entry) {
    const nowLocked = !entryLocked(entry);
    entry.posts.forEach(p => onUpdatePost({ ...p, locked: nowLocked }));
  }

  function commitReorder(target: string) {
    if (!dragId || !target) { endDrag(); return; }
    const resolvedId = target.startsWith('after:') ? target.slice(6) : target;
    if (resolvedId === dragId) { endDrag(); return; }
    const draggedEntry = entries.find(e => e.key === dragId);
    if (!draggedEntry || entryLocked(draggedEntry)) { endDrag(); return; }
    const remaining = entries.filter(e => e.key !== dragId);
    const targetIdx = remaining.findIndex(e => e.key === resolvedId);
    if (targetIdx === -1) { endDrag(); return; }
    const idx = target.startsWith('after:') ? targetIdx + 1 : targetIdx;
    const newOrder = [...remaining];
    newOrder.splice(idx, 0, draggedEntry);
    newOrder.forEach((e, i) => {
      if (!entryLocked(e)) e.posts.forEach(p => onUpdatePost({ ...p, planOrder: i * 1000 }));
    });
    endDrag();
  }

  // ── List drag ──────────────────────────────────────────────────────────────
  function startListDrag(e: React.DragEvent, key: string) {
    dragNode.current = e.currentTarget as HTMLDivElement;
    lastInsertRef.current = null;
    setDragId(key); setInsertAt(null);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0);
  }
  function handleListDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const t = e.clientY < rect.top + rect.height / 2 ? key : `after:${key}`;
    setInsertAt(t); lastInsertRef.current = t;
  }
  function handleListDrop(e: React.DragEvent) {
    e.preventDefault();
    commitReorder(insertAt ?? lastInsertRef.current ?? '');
  }

  // ── Grid drag ──────────────────────────────────────────────────────────────
  function startGridDrag(e: React.DragEvent, key: string) {
    dragNode.current = e.currentTarget as HTMLDivElement;
    lastInsertRef.current = null;
    setDragId(key); setInsertAt(null);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.25'; }, 0);
  }
  function handleGridDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const t = e.clientX < rect.left + rect.width / 2 ? key : `after:${key}`;
    setInsertAt(t); lastInsertRef.current = t;
  }
  function handleGridDrop(e: React.DragEvent, key: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const t = insertAt ?? lastInsertRef.current ?? (e.clientX < rect.left + rect.width / 2 ? key : `after:${key}`);
    commitReorder(t);
  }

  function endDrag() {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    dragNode.current = null; lastInsertRef.current = null;
    setDragId(null); setInsertAt(null);
  }

  return (
    <div style={{ maxWidth: viewMode === 'grid' ? '100%' : 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 56, zIndex: 20, background: C.bg, paddingTop: 12, paddingBottom: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: `1px solid ${C.line}`, marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Planned</h2>
          <p style={{ fontSize: 13, color: C.t2, marginTop: 3, marginBottom: 0 }}>
            {entries.length} posts · drag to set order · lock to pin &amp; schedule
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {viewMode === 'grid' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.t3 }}>Zoom</span>
              <button onClick={() => setZoom(z => Math.max(30, z - 10))} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', fontSize: 14, color: C.t1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <input type="range" min={30} max={100} step={5} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: 80, accentColor: C.acc, cursor: 'pointer' }} />
              <button onClick={() => setZoom(z => Math.min(100, z + 10))} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', fontSize: 14, color: C.t1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              <span style={{ fontSize: 11, color: C.t3, minWidth: 32 }}>{zoom}%</span>
            </div>
          )}
          <div style={{ display: 'flex', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {([{ mode: 'list' as const, Icon: List, label: 'List' }, { mode: 'grid' as const, Icon: LayoutGrid, label: 'Grid' }]).map(({ mode, Icon, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: viewMode === mode ? '#fff' : 'transparent', color: viewMode === mode ? C.t1 : C.t3, boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div onDragOver={e => e.preventDefault()} onDrop={handleListDrop}>
          {entries.map((entry, idx) => {
            const post = entry.posts[0];
            const Icon = PLATFORM_ICON[post.platform];
            const isCarousel = entry.posts.length > 1;
            const locked = entryLocked(entry);
            const isDragging = dragId === entry.key;
            const showAbove = insertAt === entry.key && dragId !== entry.key;
            const showBelow = insertAt === `after:${entry.key}` && dragId !== entry.key;
            const hasDate = post.scheduledDate && post.status === 'scheduled';
            return (
              <div key={entry.key}>
                {showAbove && <div style={{ height: 3, background: C.acc, borderRadius: 2, margin: '2px 0', boxShadow: `0 0 8px ${C.acc}88` }} />}
                <div
                  draggable={!locked}
                  onDragStart={locked ? undefined : e => startListDrag(e, entry.key)}
                  onDragEnd={endDrag}
                  onDragOver={e => handleListDragOver(e, entry.key)}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertAt(null); }}
                  onDrop={handleListDrop}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 6, background: '#fff', borderRadius: 12, border: locked ? `2px solid #F59E0B` : `1px solid ${C.line}`, boxShadow: isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.06)', opacity: isDragging ? 0.3 : 1, cursor: locked ? 'default' : dragId ? 'grabbing' : 'grab', transition: 'opacity 0.15s' }}
                >
                  {/* Slot number */}
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: locked ? '#FEF3C7' : C.bg, border: `1px solid ${locked ? '#F59E0B' : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: locked ? '#92400E' : C.t2, flexShrink: 0 }}>
                    {idx + 1}
                  </div>

                  {locked ? <Lock size={13} color="#F59E0B" style={{ flexShrink: 0 }} /> : <GripVertical size={15} color={C.t3} style={{ flexShrink: 0 }} />}

                  {/* Thumbnail(s) */}
                  {isCarousel ? (
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      {entry.posts.slice(0, 4).map((p, i) => (
                        <div key={p.id} style={{ width: i === 0 ? 44 : 24, height: 44, borderRadius: i === 0 ? 8 : 6, overflow: 'hidden', background: C.bg, border: `1px solid ${C.line}`, flexShrink: 0 }}>
                          {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.bg, border: `1px solid ${C.line}` }}>
                      {post.image ? <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={PLATFORM_COLOR[post.platform]} /></div>}
                    </div>
                  )}

                  {/* Platform */}
                  <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: PLATFORM_COLOR[post.platform], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={12} color="#fff" />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 13, color: C.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {post.content || <span style={{ color: C.t3 }}>No caption</span>}
                      </p>
                      {isCarousel && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#065F46', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                          <Layers size={9} /> {entry.posts.length} slides
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: C.t3 }}>{hasDate ? post.scheduledDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No date set'}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLOR[post.status], background: STATUS_COLOR[post.status] + '18', padding: '1px 6px', borderRadius: 4 }}>{post.status}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {locked && (datePickerId === entry.key ? (
                      <input autoFocus type="datetime-local" defaultValue={toLocalInputValue(post.scheduledDate)}
                        onChange={e => { if (!e.target.value) return; const d = new Date(e.target.value); entry.posts.forEach(p => onUpdatePost({ ...p, scheduledDate: d, status: 'scheduled' })); }}
                        onBlur={() => setDatePickerId(null)}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.acc}`, outline: 'none', color: C.t1, background: '#fff' }} />
                    ) : (
                      <button onClick={() => setDatePickerId(entry.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid #F59E0B`, background: '#FEF3C7', color: '#92400E', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                        <Calendar size={12} />{hasDate ? 'Change date' : 'Schedule'}<ArrowRight size={11} />
                      </button>
                    ))}
                    <button onClick={() => toggleLock(entry)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${locked ? '#F59E0B' : C.line}`, background: locked ? '#FEF3C7' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: locked ? '#92400E' : C.t3 }}>
                      {locked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                    <button onClick={() => onEditPost(post)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.t3 }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => entry.posts.forEach(p => onDeletePost(p.id))} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {showBelow && <div style={{ height: 3, background: C.acc, borderRadius: 2, margin: '2px 0', boxShadow: `0 0 8px ${C.acc}88` }} />}
              </div>
            );
          })}
          {entries.length === 0 && <div style={{ textAlign: 'center', padding: '80px 0', color: C.t3, fontSize: 14 }}>No posts yet — create one and it'll appear here</div>}
        </div>
      )}

      {/* ── GRID VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div style={{ transformOrigin: 'top left', transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%`, transition: 'transform 0.15s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, background: '#E5E7EB', border: '3px solid #E5E7EB', borderRadius: 4 }}>
            {entries.map((entry, idx) => {
              const post = entry.posts[0];
              const Icon = PLATFORM_ICON[post.platform];
              const isCarousel = entry.posts.length > 1;
              const locked = entryLocked(entry);
              const isDragging = dragId === entry.key;
              const isHovered  = hoverKey === entry.key;
              const insB = insertAt === entry.key && !isDragging;
              const insA = insertAt === `after:${entry.key}` && !isDragging;
              const hasDate = post.scheduledDate && post.status === 'scheduled';
              return (
                <div key={entry.key} style={{ position: 'relative' }}>
                  {insB && <div style={{ position: 'absolute', left: -3, top: 0, bottom: 0, width: 4, background: C.acc, zIndex: 20, boxShadow: `0 0 8px ${C.acc}` }} />}
                  {insA && <div style={{ position: 'absolute', right: -3, top: 0, bottom: 0, width: 4, background: C.acc, zIndex: 20, boxShadow: `0 0 8px ${C.acc}` }} />}
                  <div
                    draggable={!locked}
                    onDragStart={locked ? undefined : e => startGridDrag(e, entry.key)}
                    onDragEnd={endDrag}
                    onDragOver={e => handleGridDragOver(e, entry.key)}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertAt(null); }}
                    onDrop={e => handleGridDrop(e, entry.key)}
                    onMouseEnter={() => setHoverKey(entry.key)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', cursor: locked ? 'default' : dragId ? 'grabbing' : 'grab', background: C.bg, opacity: isDragging ? 0.25 : 1, transition: 'opacity 0.15s', outline: locked ? '2px solid #F59E0B' : 'none', outlineOffset: '-2px' }}
                  >
                    {post.image
                      ? <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.bg}, #e5e7eb)`, gap: 4 }}>
                          <Icon size={20} color={PLATFORM_COLOR[post.platform]} />
                          <span style={{ fontSize: 9, color: C.t3, textAlign: 'center', padding: '0 6px' }}>{post.content.slice(0, 35)}</span>
                        </div>
                    }
                    {/* Slot */}
                    <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{idx + 1}</div>
                    {/* Platform dot */}
                    <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLOR[post.platform], border: '1.5px solid rgba(255,255,255,0.9)' }} />
                    {/* Carousel badge */}
                    {isCarousel && (
                      <div style={{ position: 'absolute', top: 6, right: 18, lineHeight: 0 }}>
                        <Layers size={13} color="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                      </div>
                    )}
                    {/* Carousel strip */}
                    {isCarousel && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 2, padding: '0 3px 3px', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
                        {entry.posts.map((p, si) => (
                          <div key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, background: si === 0 ? '#fff' : 'rgba(255,255,255,0.45)' }} />
                        ))}
                      </div>
                    )}
                    {/* Lock badge */}
                    {locked && <div style={{ position: 'absolute', bottom: 6, left: 6, background: '#F59E0B', borderRadius: 5, padding: '2px 4px', lineHeight: 0, zIndex: 5 }}><Lock size={10} color="#fff" /></div>}
                    {/* Date badge */}
                    {hasDate && <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px', fontSize: 9, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{post.scheduledDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>}
                    {/* Hover overlay */}
                    {isHovered && !isDragging && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 6 }}>
                        {!locked && <GripVertical size={16} color="#fff" />}
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.3, maxWidth: '90%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {post.content || 'No caption'}
                        </span>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button onClick={e => { e.stopPropagation(); toggleLock(entry); }} style={{ background: locked ? '#F59E0B' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 5, padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', color: '#fff', fontSize: 9, fontWeight: 600 }}>
                            {locked ? <Lock size={9} color="#fff" /> : <Unlock size={9} color="#fff" />}
                            {locked ? 'Unlock' : 'Lock'}
                          </button>
                          {locked && (
                            <button onClick={e => { e.stopPropagation(); setDatePickerId(entry.key); }} style={{ background: '#F59E0B', border: 'none', borderRadius: 5, padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', color: '#fff', fontSize: 9, fontWeight: 600 }}>
                              <Calendar size={9} color="#fff" /> Date
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); onEditPost(post); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 5, padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', color: '#fff', fontSize: 9, fontWeight: 600 }}>
                            <Pencil size={9} color="#fff" />
                          </button>
                        </div>
                        {datePickerId === entry.key && (
                          <input autoFocus type="datetime-local" defaultValue={toLocalInputValue(post.scheduledDate)}
                            onChange={e => { if (!e.target.value) return; const d = new Date(e.target.value); entry.posts.forEach(p => onUpdatePost({ ...p, scheduledDate: d, status: 'scheduled' })); }}
                            onBlur={() => setDatePickerId(null)}
                            style={{ fontSize: 10, padding: '3px 6px', borderRadius: 5, border: `1px solid ${C.acc}`, outline: 'none', color: C.t1, background: '#fff', width: '90%' }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: entries.length % 3 === 0 ? 0 : 3 - (entries.length % 3) }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', background: C.bg, opacity: 0.3 }} />
            ))}
          </div>
          {entries.length === 0 && <div style={{ textAlign: 'center', padding: '80px 0', color: C.t3, fontSize: 14 }}>No posts yet — create one and it'll appear here</div>}
        </div>
      )}
    </div>
  );
}

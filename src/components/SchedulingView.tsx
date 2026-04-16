import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Post, Folder } from '../App';
import { C } from '../utils/ds';
import { Instagram, Facebook, Twitter, Linkedin, Calendar, ArrowUpDown, Link, Unlink, Layers, GripVertical, LayoutGrid, List, FolderOpen, FolderPlus, X, Check, Lock, Unlock } from 'lucide-react';

interface Props {
  posts: Post[];
  onUpdatePost: (p: Post) => void;
  folders: Folder[];
  onUpdateFolders: (f: Folder[]) => void;
}

const FOLDER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' },
  blue:   { bg: '#DBEAFE', border: '#2563EB', text: '#1D4ED8' },
  green:  { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  orange: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  pink:   { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  red:    { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  indigo: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
};

const PLATFORM_ICON: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook:  Facebook,
  twitter:   Twitter,
  linkedin:  Linkedin,
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#E1306C',
  facebook:  '#1877F2',
  twitter:   '#1DA1F2',
  linkedin:  '#0A66C2',
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#7C3AED',
  posted:    '#16A34A',
  draft:     '#9CA3AF',
};

type SortKey = 'date-asc' | 'date-desc' | 'status' | 'platform';

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const sel: React.CSSProperties = {
  fontSize: 13, padding: '6px 10px', borderRadius: 8,
  border: `1px solid ${C.line}`, background: '#fff',
  color: C.t1, outline: 'none', cursor: 'pointer',
};

export function SchedulingView({ posts, onUpdatePost, folders, onUpdateFolders }: Props) {
  const [sort, setSort]           = useState<SortKey>('date-asc');
  const [filterStatus, setStatus] = useState<string>('all');
  const [filterPlatform, setPlatform] = useState<string>('all');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]   = useState<'cards' | 'grid'>('cards');
  const [carouselEditKey, setCarouselEditKey] = useState<string | null>(null);
  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = all posts
  const [folderPopupKey, setFolderPopupKey] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName]   = useState('');
  const [newFolderColor, setNewFolderColor] = useState('purple');

  // Close folder popup on outside click
  useEffect(() => {
    if (!folderPopupKey) return;
    const handler = () => setFolderPopupKey(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [folderPopupKey]);

  function createFolder() {
    if (!newFolderName.trim()) return;
    const folder: Folder = { id: `folder_${Date.now()}`, name: newFolderName.trim(), color: newFolderColor };
    onUpdateFolders([...folders, folder]);
    setNewFolderName('');
    setNewFolderColor('purple');
    setCreatingFolder(false);
  }

  function deleteFolder(id: string) {
    // Remove folder from all posts that had it
    posts.filter(p => p.folderId === id).forEach(p => onUpdatePost({ ...p, folderId: undefined }));
    onUpdateFolders(folders.filter(f => f.id !== id));
    if (selectedFolderId === id) setSelectedFolderId(null);
  }

  function moveToFolder(postIds: string[], folderId: string | undefined) {
    postIds.forEach(pid => {
      const p = posts.find(x => x.id === pid);
      if (p) onUpdatePost({ ...p, folderId });
    });
    setFolderPopupKey(null);
  }

  const [dragId, setDragId]           = useState<string | null>(null);
  const [insertBeforeId, setInsertBeforeId] = useState<string | null>(null); // null = end
  const dragNode = useRef<HTMLDivElement | null>(null);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function linkSelected() {
    const carouselId = `carousel_${Date.now()}`;
    const ids = Array.from(selected);
    // All selected posts get the same carouselId; date = first selected post's date
    const firstDate = posts.filter(p => ids.includes(p.id)).sort((a,b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0]?.scheduledDate;
    ids.forEach(id => {
      const post = posts.find(p => p.id === id);
      if (post) onUpdatePost({ ...post, carouselId, scheduledDate: firstDate });
    });
    setSelecting(false);
    setSelected(new Set());
  }

  function unlinkSelected() {
    Array.from(selected).forEach(id => {
      const post = posts.find(p => p.id === id);
      if (post) onUpdatePost({ ...post, carouselId: undefined });
    });
    setSelecting(false);
    setSelected(new Set());
  }

  function handleDragStart(e: React.DragEvent, id: string, node: HTMLDivElement) {
    dragNode.current = node;
    lastInsertRef.current = null; // clear stale ref from previous drag
    setDragId(id);
    setInsertBeforeId(null);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.3'; }, 0);
  }

  function handleDragEnd() {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    dragNode.current = null;
    lastInsertRef.current = null;
    setDragId(null);
    setInsertBeforeId(null);
  }

  // Store last valid insert target in a ref so grid-drop can use it even if pointer left a card
  const lastInsertRef = useRef<string | null>(null);

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const target = e.clientX < rect.left + rect.width / 2 ? id : `after:${id}`;
    setInsertBeforeId(target);
    lastInsertRef.current = target;
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear indicator when pointer actually leaves this card (not moving into a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setInsertBeforeId(null);
    }
  }

  function handleDropOnGrid(e: React.DragEvent) {
    e.preventDefault();
    if (!dragId) { handleDragEnd(); return; }
    // Use last valid insert target; if none, append to end
    const target = insertBeforeId ?? lastInsertRef.current ?? `after:${cardEntries[cardEntries.length - 1]?.key}`;
    if (!target) { handleDragEnd(); return; }
    commitEntryReorder(target);
  }

  function handleDropOnCard(e: React.DragEvent, entryKey: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragId) { handleDragEnd(); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const target = e.clientX < rect.left + rect.width / 2 ? entryKey : `after:${entryKey}`;
    commitEntryReorder(target);
  }

  function commitReorder(target: string) {
    if (!dragId) { handleDragEnd(); return; }

    // Work on all posts sorted by date (not just visible, to preserve non-visible posts)
    const sorted = [...posts].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    const draggedIdx = sorted.findIndex(p => p.id === dragId);
    if (draggedIdx === -1) { handleDragEnd(); return; }

    const dragged = sorted[draggedIdx];
    const remaining = sorted.filter(p => p.id !== dragId);

    let insertAt: number;
    if (target.startsWith('after:')) {
      const afterId = target.slice(6);
      const idx = remaining.findIndex(p => p.id === afterId);
      insertAt = idx === -1 ? remaining.length : idx + 1;
    } else {
      const idx = remaining.findIndex(p => p.id === target);
      insertAt = idx === -1 ? remaining.length : idx;
    }

    // Build new order
    const newOrder = [...remaining];
    newOrder.splice(insertAt, 0, dragged);

    // Extract all original sorted dates and reassign in new order
    const dates = sorted.map(p => p.scheduledDate);
    const allUnique = new Set(dates.map(d => d.getTime())).size === dates.length;
    newOrder.forEach((post, i) => {
      const newDate = allUnique ? dates[i] : new Date(dates[i].getTime() + i);
      if (post.scheduledDate.getTime() !== newDate.getTime()) {
        onUpdatePost({ ...post, scheduledDate: newDate });
      }
    });

    handleDragEnd();
  }

  const visible = useMemo(() => {
    let list = [...posts];
    if (selectedFolderId !== null) {
      list = list.filter(p => p.folderId === selectedFolderId);
    } else {
      // Default view: only show unfiled posts
      list = list.filter(p => !p.folderId);
    }
    if (filterStatus   !== 'all') list = list.filter(p => p.status   === filterStatus);
    if (filterPlatform !== 'all') list = list.filter(p => p.platform === filterPlatform);
    list.sort((a, b) => {
      if (sort === 'date-asc')  return a.scheduledDate.getTime() - b.scheduledDate.getTime();
      if (sort === 'date-desc') return b.scheduledDate.getTime() - a.scheduledDate.getTime();
      if (sort === 'status')    return a.status.localeCompare(b.status);
      if (sort === 'platform')  return a.platform.localeCompare(b.platform);
      return 0;
    });
    return list;
  }, [posts, sort, filterStatus, filterPlatform, selectedFolderId]);

  const selectedHaveCarousel = Array.from(selected).some(id => posts.find(p => p.id === id)?.carouselId);

  // Collapse carousel posts into grouped entries for the cards view
  const cardEntries = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: string; posts: Post[] }[] = [];
    visible.forEach(post => {
      if (post.carouselId) {
        if (!seen.has(post.carouselId)) {
          seen.add(post.carouselId);
          result.push({ key: post.carouselId, posts: visible.filter(p => p.carouselId === post.carouselId) });
        }
      } else {
        result.push({ key: post.id, posts: [post] });
      }
    });
    return result;
  }, [visible]);

  // Entry-aware reorder: moves whole carousel groups together
  function commitEntryReorder(targetKey: string) {
    if (!dragId) { handleDragEnd(); return; }

    const resolvedKey = targetKey.startsWith('after:') ? targetKey.slice(6) : targetKey;
    // Dropped on itself — nothing to do
    if (resolvedKey === dragId) { handleDragEnd(); return; }

    // Build entry list from ALL posts (sorted) so non-visible dates are preserved
    const allSorted = [...posts].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    const seen = new Set<string>();
    const allEntries: { key: string; posts: Post[] }[] = [];
    allSorted.forEach(p => {
      if (p.carouselId) {
        if (!seen.has(p.carouselId)) {
          seen.add(p.carouselId);
          allEntries.push({ key: p.carouselId, posts: allSorted.filter(pp => pp.carouselId === p.carouselId) });
        }
      } else {
        allEntries.push({ key: p.id, posts: [p] });
      }
    });
    const draggedEntry = allEntries.find(e => e.key === dragId);
    if (!draggedEntry) { handleDragEnd(); return; }
    // Don't allow dragging a locked entry
    if (draggedEntry.posts.some(p => p.locked)) { handleDragEnd(); return; }
    const remaining = allEntries.filter(e => e.key !== dragId);
    const targetIdx = remaining.findIndex(e => e.key === resolvedKey);
    // If target not found, bail rather than silently appending to end
    if (targetIdx === -1) { handleDragEnd(); return; }
    // Don't allow dropping adjacent to a locked entry
    const targetEntry = remaining[targetIdx];
    if (targetEntry.posts.some(p => p.locked)) { handleDragEnd(); return; }
    const insertAt = targetKey.startsWith('after:') ? targetIdx + 1 : targetIdx;
    const newOrder = [...remaining];
    newOrder.splice(insertAt, 0, draggedEntry);
    const entryDates = allEntries.map(e =>
      e.posts.reduce((min, p) => p.scheduledDate < min ? p.scheduledDate : min, e.posts[0].scheduledDate)
    );
    // If dates aren't all unique, add sub-millisecond offsets so the sort has a stable tiebreaker.
    const dateMs = entryDates.map(d => d.getTime());
    const allUnique = new Set(dateMs).size === dateMs.length;
    newOrder.forEach((entry, i) => {
      // Skip locked entries — they keep their current dates
      if (entry.posts.some(p => p.locked)) return;
      const newDate = allUnique ? entryDates[i] : new Date(entryDates[i].getTime() + i);
      entry.posts.forEach(post => {
        if (post.scheduledDate.getTime() !== newDate.getTime()) onUpdatePost({ ...post, scheduledDate: newDate });
      });
    });
    handleDragEnd();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ position: 'sticky', top: 56, zIndex: 20, background: C.bg, paddingTop: 12, paddingBottom: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: `1px solid ${C.line}`, marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: 0 }}>Scheduling</h2>
          <p style={{ fontSize: 13, color: C.t2, marginTop: 3, marginBottom: 0 }}>
            {visible.length} {selectedFolderId ? `in folder` : 'unfiled'} · {posts.length} total posts
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* View mode toggle */}
          {!selecting && (
            <div style={{ display: 'flex', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: 3, gap: 2 }}>
              {([
                { mode: 'cards', Icon: List,        label: 'Cards' },
                { mode: 'grid',  Icon: LayoutGrid,  label: 'Grid Preview' },
              ] as const).map(({ mode, Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: viewMode === mode ? '#fff' : 'transparent',
                    color: viewMode === mode ? C.t1 : C.t3,
                    boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
          {/* Carousel link mode */}
          {!selecting ? (
            <button
              onClick={() => setSelecting(true)}
              style={{ ...sel, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: C.bg }}
            >
              <Layers size={13} />
              Link carousel
            </button>
          ) : (
            <>
              <span style={{ fontSize: 13, color: C.t2 }}>{selected.size} selected</span>
              {selected.size >= 2 && (
                <button onClick={linkSelected} style={{ ...sel, background: C.acc, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link size={13} /> Link as carousel
                </button>
              )}
              {selected.size >= 1 && selectedHaveCarousel && (
                <button onClick={unlinkSelected} style={{ ...sel, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Unlink size={13} /> Unlink
                </button>
              )}
              <button onClick={() => { setSelecting(false); setSelected(new Set()); }} style={{ ...sel, cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          )}

          {/* Sort */}
          {!selecting && <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpDown size={13} color={C.t3} />
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={sel}>
                <option value="date-asc">Date ↑ earliest first</option>
                <option value="date-desc">Date ↓ latest first</option>
                <option value="status">Status</option>
                <option value="platform">Platform</option>
              </select>
            </div>
            <select value={filterStatus} onChange={e => setStatus(e.target.value)} style={sel}>
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
              <option value="draft">Draft</option>
            </select>
            <select value={filterPlatform} onChange={e => setPlatform(e.target.value)} style={sel}>
              <option value="all">All platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </>}
        </div>
      </div>

      {/* Folder bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 12, flexWrap: 'nowrap' }}>
        {/* All posts chip */}
        <button
          onClick={() => setSelectedFolderId(null)}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1px solid ${selectedFolderId === null ? C.acc : C.line}`, background: selectedFolderId === null ? C.acc + '18' : '#fff', color: selectedFolderId === null ? C.acc : C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
        >
          All posts <span style={{ opacity: 0.6, fontWeight: 400 }}>({posts.filter(p => !p.folderId).length})</span>
        </button>

        {folders.map(f => {
          const fc = FOLDER_COLORS[f.color] ?? FOLDER_COLORS.purple;
          const isActive = selectedFolderId === f.id;
          const count = posts.filter(p => p.folderId === f.id).length;
          return (
            <div key={f.id} style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedFolderId(isActive ? null : f.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px 5px 12px', paddingRight: 28, borderRadius: 20, border: `1px solid ${isActive ? fc.border : C.line}`, background: isActive ? fc.bg : '#fff', color: isActive ? fc.text : C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
              >
                <FolderOpen size={11} />
                {f.name} <span style={{ opacity: 0.6, fontWeight: 400 }}>({count})</span>
              </button>
              <button
                onClick={() => deleteFolder(f.id)}
                title="Delete folder"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 2, lineHeight: 0 }}
              >
                <X size={10} />
              </button>
            </div>
          );
        })}

        {/* New folder */}
        {creatingFolder ? (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setCreatingFolder(false); }}
              placeholder="Folder name"
              style={{ fontSize: 12, padding: '5px 10px', borderRadius: 20, border: `1px solid ${C.acc}`, outline: 'none', width: 130 }}
            />
            <div style={{ display: 'flex', gap: 3 }}>
              {Object.keys(FOLDER_COLORS).map(c => (
                <button key={c} onClick={() => setNewFolderColor(c)} style={{ width: 14, height: 14, borderRadius: '50%', background: FOLDER_COLORS[c].border, border: newFolderColor === c ? `2px solid ${C.t1}` : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
            <button onClick={createFolder} style={{ background: C.acc, border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', padding: 0 }}>
              <Check size={12} />
            </button>
            <button onClick={() => setCreatingFolder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 2, lineHeight: 0 }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1px dashed ${C.line}`, background: 'transparent', color: C.t3, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <FolderPlus size={11} /> New folder
          </button>
        )}
      </div>

      {viewMode === 'grid' ? (
        <InstagramGridPreview posts={visible} allPosts={posts} onUpdatePost={onUpdatePost} />
      ) : null}

      {/* Cards */}
      {viewMode === 'cards' && <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}
        onDragOver={selecting ? undefined : e => e.preventDefault()}
        onDrop={selecting ? undefined : handleDropOnGrid}
      >
        {cardEntries.map(({ key, posts: groupPosts }) => {
          const post       = groupPosts[0];
          const Icon       = PLATFORM_ICON[post.platform];
          const isCarousel = groupPosts.length > 1;
          const isLocked   = groupPosts.some(p => p.locked);
          const isSelected = groupPosts.some(p => selected.has(p.id));
          const isDragging = dragId === key;
          const insertBefore = insertBeforeId === key;
          const insertAfter  = insertBeforeId === `after:${key}`;
          const stackDepth   = Math.min(groupPosts.length - 1, 2); // show up to 2 shadow cards

          return (
            // Outer wrapper — overflow visible so shadows bleed into gap
            <div key={key} style={{ position: 'relative', overflow: 'visible' }}>

              {/* Shadow cards — same size as main, shifted down-right */}
              {isCarousel && stackDepth >= 2 && (
                <div style={{ position: 'absolute', inset: 0, background: '#6ee7b7', border: '2px solid #10B981', borderRadius: 12, transform: 'translate(12px, 12px)', zIndex: 0 }} />
              )}
              {isCarousel && stackDepth >= 1 && (
                <div style={{ position: 'absolute', inset: 0, background: '#a7f3d0', border: '2px solid #10B981', borderRadius: 12, transform: 'translate(6px, 6px)', zIndex: 1 }} />
              )}

              {/* Main card */}
              <div
                draggable={!selecting && !isLocked}
                onDragStart={selecting || isLocked ? undefined : e => handleDragStart(e, key, e.currentTarget as HTMLDivElement)}
                onDragEnd={handleDragEnd}
                onDragOver={selecting ? undefined : e => handleDragOver(e, key)}
                onDragLeave={selecting ? undefined : handleDragLeave}
                onDrop={selecting ? undefined : e => handleDropOnCard(e, key)}
                onClick={selecting ? () => groupPosts.forEach(p => toggleSelect(p.id)) : undefined}
                style={{
                  position: 'relative', zIndex: 2,
                  background: '#fff',
                  borderRadius: 12,
                  overflow: 'visible',
                  border: isLocked ? `2px solid #F59E0B` : isSelected ? `2px solid ${C.acc}` : isCarousel ? `2px solid #10B981` : `1px solid ${C.line}`,
                  boxShadow: isLocked ? '0 2px 6px rgba(245,158,11,0.2)' : isSelected ? `0 0 0 3px ${C.acc}33` : isDragging ? 'none' : '0 2px 6px rgba(0,0,0,0.08)',
                  display: 'flex', flexDirection: 'column',
                  cursor: selecting ? 'pointer' : isLocked ? 'default' : dragId ? 'grabbing' : 'grab',
                  transition: 'opacity 0.15s',
                  opacity: isDragging ? 0.3 : 1,
                }}
              >
                {/* Insert indicators */}
                {insertBefore && !isDragging && <div style={{ position: 'absolute', left: -10, top: 0, bottom: 0, width: 4, background: C.acc, borderRadius: 2, zIndex: 10, boxShadow: `0 0 8px ${C.acc}88` }} />}
                {insertAfter  && !isDragging && <div style={{ position: 'absolute', right: -10, top: 0, bottom: 0, width: 4, background: C.acc, borderRadius: 2, zIndex: 10, boxShadow: `0 0 8px ${C.acc}88` }} />}

                {/* Inner clip wrapper */}
                <div style={{ borderRadius: 11, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>

                  {/* Image area */}
                  <div style={{ position: 'relative', aspectRatio: '1', background: '#f3f4f6', flexShrink: 0 }}>
                    {!selecting && !isLocked && <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2, color: 'rgba(255,255,255,0.85)', lineHeight: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}><GripVertical size={14} /></div>}
                    {!selecting && (
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); groupPosts.forEach(p => onUpdatePost({ ...p, locked: !isLocked })); }}
                        title={isLocked ? 'Unlock position' : 'Lock position'}
                        style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 3, background: isLocked ? '#F59E0B' : 'rgba(0,0,0,0.35)', border: 'none', borderRadius: 6, padding: '3px 5px', lineHeight: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
                      >
                        {isLocked ? <Lock size={11} color="#fff" /> : <Unlock size={11} color="rgba(255,255,255,0.8)" />}
                      </button>
                    )}
                    {post.image
                      ? <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontSize: 12 }}>No image</div>
                    }
                    <div style={{ position: 'absolute', top: 8, left: 8, background: PLATFORM_COLOR[post.platform], borderRadius: 6, padding: '3px 5px', display: 'flex', alignItems: 'center' }}>
                      <Icon size={11} color="#fff" strokeWidth={2} />
                    </div>
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                      {isCarousel && (
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); if (!selecting) setCarouselEditKey(key); }}
                          style={{ background: '#10B981', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 3, border: 'none', cursor: 'pointer' }}
                          title="Reorder slides"
                        >
                          <Layers size={9} /> {groupPosts.length} slides
                        </button>
                      )}
                      <div style={{ background: STATUS_COLOR[post.status], borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>
                        {post.status}
                      </div>
                    </div>
                    {selecting && (
                      <div style={{ position: 'absolute', bottom: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: isSelected ? C.acc : 'rgba(255,255,255,0.8)', border: `2px solid ${isSelected ? C.acc : 'rgba(0,0,0,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1 }}>✓</span>}
                      </div>
                    )}
                  </div>

                  {/* Slide thumbnail strip for carousels */}
                  {isCarousel && (
                    <div style={{ display: 'flex', gap: 2, padding: '4px 6px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
                      {groupPosts.map((p, i) => (
                        <div key={p.id} style={{ flex: 1, aspectRatio: '1', borderRadius: 3, overflow: 'hidden', border: i === 0 ? '1.5px solid #10B981' : '1px solid #d1fae5', maxHeight: 32 }}>
                          {p.image
                            ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', background: '#d1fae5' }} />
                          }
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 12, color: C.t2, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                      {post.content || <span style={{ color: C.t3 }}>No caption</span>}
                    </p>
                    <div style={{ marginTop: 'auto' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.t3, marginBottom: 4, fontWeight: 500 }}>
                        <Calendar size={11} />
                        {isCarousel ? `Scheduled date · all ${groupPosts.length} slides` : 'Scheduled date'}
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(post.scheduledDate)}
                        onChange={e => {
                          if (!e.target.value) return;
                          const d = new Date(e.target.value);
                          groupPosts.forEach(p => onUpdatePost({ ...p, scheduledDate: d }));
                        }}
                        style={{ width: '100%', fontSize: 11, padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.line}`, background: C.bg, color: C.t1, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Folder assignment */}
                    {!selecting && (
                      <div style={{ position: 'relative', marginTop: 4 }} onMouseDown={e => e.stopPropagation()}>
                        {(() => {
                          const currentFolder = folders.find(f => f.id === post.folderId);
                          const fc = currentFolder ? (FOLDER_COLORS[currentFolder.color] ?? FOLDER_COLORS.purple) : null;
                          return (
                            <>
                              <button
                                onClick={e => { e.stopPropagation(); setFolderPopupKey(folderPopupKey === key ? null : key); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: `1px solid ${fc ? fc.border : C.line}`, background: fc ? fc.bg : 'transparent', color: fc ? fc.text : C.t3, fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                              >
                                <FolderOpen size={10} />
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {currentFolder ? currentFolder.name : 'Add to folder'}
                                </span>
                              </button>
                              {folderPopupKey === key && (
                                <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, zIndex: 200, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 160, padding: 4 }}>
                                  {folders.length === 0 && (
                                    <div style={{ padding: '6px 10px', fontSize: 11, color: C.t3 }}>No folders yet — create one above</div>
                                  )}
                                  {folders.map(f => {
                                    const ffc = FOLDER_COLORS[f.color] ?? FOLDER_COLORS.purple;
                                    const isAssigned = post.folderId === f.id;
                                    return (
                                      <button key={f.id}
                                        onClick={() => moveToFolder(groupPosts.map(p => p.id), isAssigned ? undefined : f.id)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: 'none', background: isAssigned ? ffc.bg : 'transparent', color: isAssigned ? ffc.text : C.t1, fontSize: 12, fontWeight: isAssigned ? 600 : 400, cursor: 'pointer', textAlign: 'left' }}
                                      >
                                        <FolderOpen size={12} color={ffc.border} />
                                        {f.name}
                                        {isAssigned && <Check size={11} style={{ marginLeft: 'auto' }} />}
                                      </button>
                                    );
                                  })}
                                  {post.folderId && (
                                    <button
                                      onClick={() => moveToFolder(groupPosts.map(p => p.id), undefined)}
                                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: C.t3, fontSize: 12, cursor: 'pointer', textAlign: 'left', borderTop: `1px solid ${C.line}`, marginTop: 2 }}
                                    >
                                      <X size={11} /> Remove from folder
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {cardEntries.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: C.t3, fontSize: 14 }}>
            No posts match your filters
          </div>
        )}
      </div>}

      {/* Carousel slide reorder modal */}
      {carouselEditKey && (() => {
        const carouselPosts = [...posts]
          .filter(p => p.carouselId === carouselEditKey)
          .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
        if (!carouselPosts.length) { setCarouselEditKey(null); return null; }
        return (
          <CarouselReorderModal
            slides={carouselPosts}
            onSave={(reordered) => {
              const baseTime = reordered[0].scheduledDate.getTime();
              reordered.forEach((p, i) => {
                onUpdatePost({ ...p, scheduledDate: new Date(baseTime + i) });
              });
              setCarouselEditKey(null);
            }}
            onClose={() => setCarouselEditKey(null)}
          />
        );
      })()}
    </div>
  );
}

// ─── Carousel Reorder Modal ───────────────────────────────────────────────────
function CarouselReorderModal({ slides, onSave, onClose }: {
  slides: Post[];
  onSave: (reordered: Post[]) => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<Post[]>(slides);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  function startDrag(e: React.DragEvent, idx: number) {
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNodeRef.current) dragNodeRef.current.style.opacity = '0.3'; }, 0);
  }
  function endDrag() {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = '1';
    dragNodeRef.current = null;
    setDragIdx(null);
    setInsertIdx(null);
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setInsertIdx(e.clientY < rect.top + rect.height / 2 ? idx : idx + 1);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (dragIdx === null || insertIdx === null) { endDrag(); return; }
    const next = [...order];
    const [moved] = next.splice(dragIdx, 1);
    const target = insertIdx > dragIdx ? insertIdx - 1 : insertIdx;
    next.splice(target, 0, moved);
    setOrder(next);
    endDrag();
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.t1, margin: 0 }}>Reorder carousel slides</h3>
            <p style={{ fontSize: 12, color: C.t3, margin: '2px 0 0' }}>Drag to change slide order</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, lineHeight: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Slide list */}
        <div style={{ padding: '12px 16px', maxHeight: 480, overflowY: 'auto' }}>
          {order.map((slide, idx) => {
            const isDragging = dragIdx === idx;
            const showInsertAbove = insertIdx === idx && dragIdx !== null && dragIdx !== idx && dragIdx !== idx - 1;
            const showInsertBelow = insertIdx === idx + 1 && dragIdx !== null && dragIdx !== idx && dragIdx !== idx + 1;
            return (
              <div key={slide.id}>
                {showInsertAbove && (
                  <div style={{ height: 3, background: C.acc, borderRadius: 2, margin: '2px 0', boxShadow: `0 0 6px ${C.acc}88` }} />
                )}
                <div
                  draggable
                  onDragStart={e => startDrag(e, idx)}
                  onDragEnd={endDrag}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px',
                    borderRadius: 10, border: `1px solid ${C.line}`,
                    background: isDragging ? C.bg : '#fff',
                    opacity: isDragging ? 0.4 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    marginBottom: 6,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {/* Slide number */}
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {idx + 1}
                  </div>

                  {/* Thumbnail */}
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.bg, border: `1px solid ${C.line}` }}>
                    {slide.image
                      ? <img src={slide.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontSize: 10 }}>No img</div>
                    }
                  </div>

                  {/* Caption */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: C.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                      {slide.content || <span style={{ color: C.t3 }}>No caption</span>}
                    </p>
                    <p style={{ fontSize: 11, color: C.t3, margin: '2px 0 0' }}>
                      Slide {idx + 1} of {order.length}
                    </p>
                  </div>

                  {/* Drag handle */}
                  <GripVertical size={16} color={C.t3} style={{ flexShrink: 0 }} />
                </div>
                {showInsertBelow && (
                  <div style={{ height: 3, background: C.acc, borderRadius: 2, margin: '2px 0', boxShadow: `0 0 6px ${C.acc}88` }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.line}`, background: '#fff', color: C.t1, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={() => onSave(order)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
          >
            Save order
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Instagram Grid Preview ───────────────────────────────────────────────────
function InstagramGridPreview({ posts, allPosts, onUpdatePost }: { posts: Post[]; allPosts: Post[]; onUpdatePost: (p: Post) => void }) {
  const [dragKey, setDragKey]           = useState<string | null>(null);
  const [insertBeforeKey, setInsertBeforeKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey]         = useState<string | null>(null);
  const [editKey, setEditKey]           = useState<string | null>(null);
  const [zoom, setZoom]                 = useState(100); // percent: 40–100
  const dragNode = useRef<HTMLDivElement | null>(null);
  const lastInsertRef = useRef<string | null>(null);

  // Collapse carousel posts into single entries
  const entries = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: string; posts: Post[] }[] = [];
    posts.forEach(post => {
      if (post.carouselId) {
        if (!seen.has(post.carouselId)) {
          seen.add(post.carouselId);
          result.push({ key: post.carouselId, posts: posts.filter(p => p.carouselId === post.carouselId) });
        }
      } else {
        result.push({ key: post.id, posts: [post] });
      }
    });
    return result;
  }, [posts]);

  function startDrag(e: React.DragEvent, key: string) {
    dragNode.current = e.currentTarget as HTMLDivElement;
    lastInsertRef.current = null;
    setDragKey(key);
    setInsertBeforeKey(null);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.25'; }, 0);
  }
  function endDrag() {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    dragNode.current = null;
    lastInsertRef.current = null;
    setDragKey(null);
    setInsertBeforeKey(null);
  }
  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const target = e.clientX < rect.left + rect.width / 2 ? key : `after:${key}`;
    setInsertBeforeKey(target);
    lastInsertRef.current = target;
  }
  function handleDrop(e: React.DragEvent, targetKey: string) {
    e.preventDefault();
    const resolvedInsert = insertBeforeKey ?? lastInsertRef.current;
    const resolvedKey = resolvedInsert?.startsWith('after:') ? resolvedInsert.slice(6) : resolvedInsert;
    if (!dragKey || resolvedKey === dragKey) { endDrag(); return; }
    const target = resolvedInsert ?? (e.clientX < (e.currentTarget as HTMLElement).getBoundingClientRect().left + (e.currentTarget as HTMLElement).getBoundingClientRect().width / 2 ? targetKey : `after:${targetKey}`);

    // Build new entry order
    const draggedEntry = entries.find(e => e.key === dragKey);
    if (!draggedEntry) { endDrag(); return; }
    // Don't drag locked entries
    if (draggedEntry.posts.some(p => p.locked)) { endDrag(); return; }
    const remaining = entries.filter(e => e.key !== dragKey);
    const targetId = target.startsWith('after:') ? target.slice(6) : target;
    const targetIdx = remaining.findIndex(e => e.key === targetId);
    if (targetIdx === -1) { endDrag(); return; }
    let insertAt = target.startsWith('after:') ? targetIdx + 1 : targetIdx;
    const newOrder = [...remaining];
    newOrder.splice(insertAt, 0, draggedEntry);

    // Canonical date per entry (earliest post in group)
    const entryDates = entries.map(entry =>
      entry.posts.reduce((min, p) => p.scheduledDate < min ? p.scheduledDate : min, entry.posts[0].scheduledDate)
    );
    // If dates aren't all unique add ms offsets so the sort has a stable tiebreaker
    const dateMs = entryDates.map(d => d.getTime());
    const allUnique = new Set(dateMs).size === dateMs.length;
    // Reassign dates in new order
    newOrder.forEach((entry, i) => {
      const newDate = allUnique ? entryDates[i] : new Date(entryDates[i].getTime() + i);
      entry.posts.forEach(post => {
        if (post.scheduledDate.getTime() !== newDate.getTime()) onUpdatePost({ ...post, scheduledDate: newDate });
      });
    });
    endDrag();
  }

  return (
    <div>
      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E1306C', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Instagram Grid Preview</span>
        <span style={{ fontSize: 12, color: C.t3 }}>Drag to reorder · {entries.length} posts</span>
        {/* Zoom control */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>Zoom</span>
          <button onClick={() => setZoom(z => Math.max(30, z - 10))} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, color: C.t1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <input
            type="range" min={30} max={100} step={5} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ width: 80, accentColor: C.acc, cursor: 'pointer' }}
          />
          <button onClick={() => setZoom(z => Math.min(100, z + 10))} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, color: C.t1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <span style={{ fontSize: 11, color: C.t3, minWidth: 32, textAlign: 'right' }}>{zoom}%</span>
        </div>
      </div>

      {/* 3-col grid — zoom scales the whole grid while keeping 3 columns */}
      <div style={{ transformOrigin: 'top left', transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%`, transition: 'transform 0.15s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, background: C.lineSub, border: `3px solid ${C.lineSub}`, borderRadius: 4 }}>
        {entries.map(({ key, posts: groupPosts }, idx) => {
          const firstPost   = groupPosts[0];
          const isCarousel  = groupPosts.length > 1;
          const isLocked    = groupPosts.some(p => p.locked);
          const isDragging  = dragKey === key;
          const insertBefore = insertBeforeKey === key && !isDragging;
          const insertAfter  = insertBeforeKey === `after:${key}` && !isDragging;
          const isHovered   = hoverKey === key;
          const isEditing   = editKey === key;
          return (
            <div key={key} style={{ position: 'relative' }}>
              {insertBefore && <div style={{ position: 'absolute', left: -3, top: 0, bottom: 0, width: 4, background: C.acc, zIndex: 20, boxShadow: `0 0 8px ${C.acc}` }} />}
              {insertAfter  && <div style={{ position: 'absolute', right: -3, top: 0, bottom: 0, width: 4, background: C.acc, zIndex: 20, boxShadow: `0 0 8px ${C.acc}` }} />}

              <div
                draggable={!isLocked}
                onDragStart={isLocked ? undefined : e => startDrag(e, key)}
                onDragEnd={endDrag}
                onDragOver={e => handleDragOver(e, key)}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInsertBeforeKey(null); }}
                onDrop={e => handleDrop(e, key)}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey(null)}
                style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', cursor: isLocked ? 'default' : dragKey ? 'grabbing' : 'grab', background: C.bg, opacity: isDragging ? 0.25 : 1, transition: 'opacity 0.15s', outline: isLocked ? '2px solid #F59E0B' : 'none', outlineOffset: '-2px' }}
              >
                {firstPost.image ? (
                  <img src={firstPost.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.bg}, ${C.surface})` }}>
                    <span style={{ fontSize: 10, color: C.t3, textAlign: 'center', padding: 4 }}>{firstPost.content.slice(0, 40)}</span>
                  </div>
                )}

                {/* Position number */}
                <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {idx + 1}
                </div>

                {/* Status dot */}
                <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[firstPost.status], border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />

                {/* Lock badge — always visible when locked */}
                {isLocked && (
                  <div style={{ position: 'absolute', bottom: 6, left: 6, background: '#F59E0B', borderRadius: 5, padding: '2px 4px', lineHeight: 0, zIndex: 5 }}>
                    <Lock size={10} color="#fff" />
                  </div>
                )}

                {/* Carousel icon (top-right corner, Instagram style) */}
                {isCarousel && (
                  <div style={{ position: 'absolute', top: 6, right: 18, lineHeight: 0 }}>
                    <Layers size={14} color="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                  </div>
                )}

                {/* Carousel slide strip at bottom */}
                {isCarousel && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 2, padding: '0 3px 3px', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
                    {groupPosts.map((p, si) => (
                      <div key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, background: si === 0 ? '#fff' : 'rgba(255,255,255,0.45)' }} />
                    ))}
                  </div>
                )}

                {/* Hover overlay */}
                {isHovered && !isDragging && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    onClick={() => setEditKey(editKey === key ? null : key)}>
                    {!isLocked && <GripVertical size={18} color="#fff" />}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      {new Date(firstPost.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                    </span>
                    {/* Lock toggle in hover overlay */}
                    <button
                      onClick={e => { e.stopPropagation(); groupPosts.forEach(p => onUpdatePost({ ...p, locked: !isLocked })); }}
                      style={{ marginTop: 2, background: isLocked ? '#F59E0B' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 600 }}
                    >
                      {isLocked ? <Lock size={10} color="#fff" /> : <Unlock size={10} color="#fff" />}
                      {isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    {isCarousel && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{groupPosts.length} images</span>}
                  </div>
                )}
              </div>

              {/* Inline date picker */}
              {isEditing && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 210 }}>
                  <p style={{ fontSize: 11, color: C.t3, margin: '0 0 6px', fontWeight: 500 }}>
                    {isCarousel ? `Carousel · ${groupPosts.length} images` : 'Scheduled date'}
                  </p>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(firstPost.scheduledDate)}
                    autoFocus
                    onChange={e => {
                      if (!e.target.value) return;
                      const d = new Date(e.target.value);
                      groupPosts.forEach(p => onUpdatePost({ ...p, scheduledDate: d }));
                    }}
                    onBlur={() => setEditKey(null)}
                    style={{ fontSize: 12, padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.line}`, background: C.bg, color: C.t1, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: 10, color: C.t3, margin: '6px 0 0', lineHeight: 1.4 }}>{firstPost.content.slice(0, 60)}{firstPost.content.length > 60 ? '…' : ''}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty cells to complete last row */}
        {Array.from({ length: entries.length % 3 === 0 ? 0 : 3 - (entries.length % 3) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ aspectRatio: '1', background: C.bg, opacity: 0.3 }} />
        ))}
      </div>
      </div>{/* end zoom wrapper */}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.t3, fontSize: 14 }}>
          No posts match your filters
        </div>
      )}
    </div>
  );
}

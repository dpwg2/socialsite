import { useState } from 'react';
import { HashtagGroup } from '../App';
import { Plus, Copy, Edit2, Trash2, Check, Hash, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { C, card, inp, lbl } from '../utils/ds';

interface Props {
  hashtagGroups: HashtagGroup[];
  onAddGroup: (g: Omit<HashtagGroup,'id'>) => void;
  onUpdateGroup: (g: HashtagGroup) => void;
  onDeleteGroup: (id: string) => void;
}

// Accent dot colours for groups (no tinted backgrounds)
const DOTS: Record<string, string> = {
  purple: '#7C3AED', orange: '#EA580C', blue: '#2563EB',
  green:  '#16A34A', pink:   '#DB2777', red:  '#DC2626',
  teal:   '#0D9488', slate:  '#64748B',
};

const SB: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 };

function GroupForm({ initial, onSave, onCancel }: {
  initial?: HashtagGroup;
  onSave: (d: { name: string; hashtags: string[]; color: string }) => void;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState(initial?.name || '');
  const [tagInput, setTagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(initial?.hashtags || []);
  const [color,    setColor]    = useState(initial?.color || 'purple');

  const addTag = (v: string) => {
    v.split(',').forEach(raw => {
      const t = raw.trim().replace(/\s+/g,'');
      if (!t) return;
      const f = t.startsWith('#') ? t : `#${t}`;
      if (!hashtags.includes(f)) setHashtags(p => [...p, f]);
    });
    setTagInput('');
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.acc}`, borderRadius: 8, padding: 20, marginBottom: 14 }}>
      <p style={{ color: C.t1, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{initial ? 'Edit Group' : 'New Group'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label style={lbl}>Group name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kitchen Renovation" autoFocus style={inp} />
        </div>
        <div>
          <label style={lbl}>Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            {Object.entries(DOTS).map(([k, c]) => (
              <button key={k} onClick={() => setColor(k)} style={{
                ...SB,
                width: 22, height: 22, borderRadius: '50%', background: c,
                boxShadow: color === k ? `0 0 0 2px #fff, 0 0 0 3.5px ${c}` : 'none',
                transform: color === k ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s',
              }} />
            ))}
          </div>
        </div>
      </div>
      <label style={lbl}>Hashtags</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
          placeholder="#renovation" style={{ ...inp, flex: 1 }} />
        <button onClick={() => addTag(tagInput)} style={{ background: C.acc, border: 'none', color: '#fff', borderRadius: 7, padding: '0 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 7, padding: 10, minHeight: 42 }}>
        {hashtags.length === 0 ? (
          <span style={{ color: C.t3, fontSize: 12 }}>Your hashtags appear here</span>
        ) : hashtags.map((tag, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, color: C.t2 }}>
            {tag}
            <button onClick={() => setHashtags(p => p.filter((_,x) => x !== i))} style={{ ...SB, color: C.t3 }}><X size={8} /></button>
          </span>
        ))}
      </div>
      <p style={{ color: C.t3, fontSize: 11, marginTop: 4 }}>{hashtags.length} hashtags</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} style={{ flex: 1, background: C.bg, border: `1px solid ${C.line}`, color: C.t2, borderRadius: 7, padding: '9px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => { if (name.trim() && hashtags.length) onSave({ name, hashtags, color }); }}
          disabled={!name.trim() || hashtags.length === 0}
          style={{ flex: 1, background: name.trim() && hashtags.length ? C.acc : C.bg, border: 'none', color: name.trim() && hashtags.length ? '#fff' : C.t3, borderRadius: 7, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: name.trim() && hashtags.length ? 'pointer' : 'default' }}>
          {initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  );
}

export function HashtagManager({ hashtagGroups, onAddGroup, onUpdateGroup, onDeleteGroup }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<HashtagGroup | null>(null);
  const [copied,   setCopied]   = useState<string | null>(null);

  const copy = (g: HashtagGroup) => {
    navigator.clipboard.writeText(g.hashtags.join(' ')).then(() => {
      setCopied(g.id); setTimeout(() => setCopied(null), 2000);
      toast.success(`Copied ${g.hashtags.length} hashtags!`);
    });
  };

  const total = hashtagGroups.reduce((s, g) => s + g.hashtags.length, 0);

  return (
    <div style={{ maxWidth: 860 }} className="enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ color: C.t3, fontSize: 12 }}>
          <strong style={{ color: C.t2 }}>{hashtagGroups.length}</strong> groups · <strong style={{ color: C.t2 }}>{total}</strong> tags
        </p>
        {!showForm && !editing && (
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: C.acc, border: 'none', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} strokeWidth={2.5} /> New Group
          </button>
        )}
      </div>

      {showForm && (
        <GroupForm
          onSave={d => { onAddGroup(d); setShowForm(false); toast.success('Group created!'); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {hashtagGroups.length === 0 && !showForm ? (
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: '56px 0', textAlign: 'center', boxShadow: card }}>
          <p style={{ color: C.t3, fontSize: 13 }}>No hashtag groups yet</p>
          <button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', color: C.acc, fontSize: 13, cursor: 'pointer', marginTop: 6, fontWeight: 500 }}>Create one →</button>
        </div>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: card }}>
          {hashtagGroups.map((group, i) => {
            const dot = DOTS[group.color] || DOTS.purple;
            return editing?.id === group.id ? (
              <div key={group.id} style={{ padding: 20, borderBottom: i < hashtagGroups.length - 1 ? `1px solid ${C.lineSub}` : 'none' }}>
                <GroupForm
                  initial={group}
                  onSave={d => { onUpdateGroup({ ...group, ...d }); setEditing(null); toast.success('Updated!'); }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={group.id}
                style={{ padding: '14px 18px', borderBottom: i < hashtagGroups.length - 1 ? `1px solid ${C.lineSub}` : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      <p style={{ color: C.t1, fontSize: 13, fontWeight: 500 }}>{group.name}</p>
                      <span style={{ color: C.t3, fontSize: 11 }}>{group.hashtags.length} tags</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {group.hashtags.map((tag, j) => (
                        <span key={j} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <button onClick={() => {
                      const text = group.hashtags.join(' ');
                      navigator.clipboard.writeText(text).then(() => {
                        setCopied(group.id);
                        setTimeout(() => setCopied(null), 2000);
                        toast.success(`Copied ${group.hashtags.length} hashtags!`);
                      }).catch(() => {
                        // Fallback for older browsers
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                          document.execCommand('copy');
                          setCopied(group.id);
                          setTimeout(() => setCopied(null), 2000);
                          toast.success(`Copied ${group.hashtags.length} hashtags!`);
                        } catch (err) {
                          toast.error('Failed to copy hashtags');
                        }
                        document.body.removeChild(textarea);
                      });
                    }} style={{ ...SB, padding: '6px', borderRadius: 5, color: copied === group.id ? C.green : C.t3 }} className="hover:bg-gray-100 transition-colors">
                      {copied === group.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button onClick={() => { setEditing(group); setShowForm(false); }} style={{ ...SB, padding: '6px', borderRadius: 5, color: C.t3 }} className="hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => { onDeleteGroup(group.id); toast.success('Deleted'); }} style={{ ...SB, padding: '6px', borderRadius: 5, color: C.t3 }} className="hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
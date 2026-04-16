import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Post } from '../App';
import { PostCard } from './PostCard';
import { getMilestonesForMonth, Milestone } from '../data/milestones';
import { C, card, platLabel } from '../utils/ds';

interface Props {
  posts: Post[];
  onEditPost: (p: Post) => void;
  onDeletePost: (id: string) => void;
  onCreateFromIdea: (partial: Partial<Post>) => void;
}

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CAPTION_IDEAS: Record<string, { caption: string; tags: string[] }> = {
  'World Plumbing Day':        { caption: "Happy World Plumbing Day! Did you know a dripping tap wastes 9,000L of water per year? Our team is committed to quality plumbing. #WorldPlumbingDay", tags: ['Milestone','Plumbing'] },
  'National Home Improvement': { caption: "May is National Home Improvement Month! Whether it's a kitchen refresh or a full renovation — contact us for a free quote! #HomeImprovement", tags: ['Milestone','Promotion'] },
  'World Architecture Day':    { caption: "Happy World Architecture Day! Great design changes lives. Here are some of our favourite projects where function meets beauty. #WorldArchitectureDay", tags: ['Milestone'] },
  'Earth Day':                 { caption: "Happy Earth Day! At BuildRight we're committed to sustainable building — recycled materials, energy-efficient designs, and less waste. #EarthDay", tags: ['Milestone','Tips'] },
  'World Water Day':           { caption: "Today is World Water Day. Your plumbing choices matter — water-efficient tapware can save thousands of litres annually. #WorldWaterDay", tags: ['Milestone','Plumbing'] },
};

function getIdea(ms: Milestone) {
  const key = Object.keys(CAPTION_IDEAS).find(k => ms.name.toLowerCase().includes(k.toLowerCase()));
  return key ? CAPTION_IDEAS[key] : null;
}

export function Calendar({ posts, onEditPost, onDeletePost, onCreateFromIdea }: Props) {
  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(new Set(['instagram', 'twitter', 'facebook', 'linkedin']));

  const togglePlatform = (platform: string) => {
    setEnabledPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const yr    = current.getFullYear();
  const mo    = current.getMonth();
  const first = new Date(yr, mo, 1).getDay();
  const days  = new Date(yr, mo + 1, 0).getDate();
  const milMap = getMilestonesForMonth(yr, mo);
  const today  = new Date();
  const isNow  = today.getMonth() === mo && today.getFullYear() === yr;

  const postsForDay = (d: number) =>
    posts.filter(p => {
      const x = new Date(p.scheduledDate);
      return x.getDate() === d && x.getMonth() === mo && x.getFullYear() === yr && enabledPlatforms.has(p.platform);
    });

  const selDay   = selected?.getDate();
  const selPosts = selected ? postsForDay(selDay!) : [];
  const selMs    = selected ? (milMap.get(selDay!) || []) : [];

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < first; i++) cells.push(<div key={`e${i}`} />);

  for (let day = 1; day <= days; day++) {
    const dp      = postsForDay(day);
    const ms      = milMap.get(day) || [];
    const isToday = isNow && today.getDate() === day;
    const isSel   = selected?.getDate() === day && selected.getMonth() === mo && selected.getFullYear() === yr;
    const hasMil  = ms.length > 0;

    cells.push(
      <button
        key={day}
        onClick={() => setSelected(new Date(yr, mo, day))}
        style={{
          minHeight: 64, padding: '6px', borderRadius: 8,
          background: isSel ? C.acc : 'transparent',
          border: `1px solid ${isSel ? C.acc : isToday ? '#C4B5FD' : 'transparent'}`,
          cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = C.bg; }}
        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <div style={{
          fontSize: 12, fontWeight: isToday ? 700 : 400,
          color: isSel ? '#fff' : isToday ? C.acc : C.t1,
          marginBottom: 4,
        }}>
          {day}
        </div>

        {/* Platform icons and milestone indicator */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingBottom: 2, alignItems: 'center' }}>
          {hasMil && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : C.orange, flexShrink: 0 }} />
          )}
          {dp.slice(0, 3).map(p => {
            const PlatformIcon = p.platform === 'instagram' ? Instagram : 
                                p.platform === 'facebook' ? Facebook : 
                                p.platform === 'twitter' ? Twitter : Linkedin;
            return (
              <PlatformIcon 
                key={p.id} 
                size={9} 
                style={{ color: isSel ? 'rgba(255,255,255,0.8)' : (C as any)[p.platform], flexShrink: 0 }} 
                strokeWidth={2.5}
              />
            );
          })}
          {dp.length > 3 && (
            <span style={{ fontSize: 9, color: isSel ? 'rgba(255,255,255,0.7)' : C.t3, lineHeight: '9px', fontWeight: 600 }}>+{dp.length - 3}</span>
          )}
        </div>

        {/* Post count label (medium+ only) */}
        {(dp.length > 0 || hasMil) && (
          <div className="hidden sm:block">
            {hasMil && ms.slice(0,1).map(m => (
              <p key={m.id} style={{ fontSize: 9, color: isSel ? 'rgba(255,255,255,0.8)' : C.orange, fontWeight: 600, lineHeight: 1.3, marginTop: 2 }} className="truncate">
                {m.name.length > 14 ? m.name.slice(0,12) + '…' : m.name}
              </p>
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Grid */}
      <div style={{ flex: '1 1 520px', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: 20, boxShadow: card }}>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.t1, fontSize: 14, fontWeight: 600 }}>{MONTHS[mo]}</span>
            <span style={{ color: C.t3, fontSize: 13 }}>{yr}</span>
            <button onClick={() => { const t = new Date(); setCurrent(new Date(t.getFullYear(), t.getMonth(), 1)); setSelected(t); }}
              style={{ height: 24, padding: '0 9px', background: C.bg, border: `1px solid ${C.line}`, color: C.t2, borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
              Today
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[-1, 1].map(d => (
              <button key={d} onClick={() => setCurrent(new Date(yr, mo + d, 1))}
                style={{ width: 28, height: 28, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.t2, lineHeight: 0 }}
                className="hover:border-gray-300 transition-colors">
                {d === -1 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {/* Row 1: Status Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            {[
              { l: 'Scheduled', c: C.acc   },
              { l: 'Published', c: C.green },
              { l: 'Milestone', c: C.orange },
            ].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: x.c }} />
                <span style={{ color: C.t3, fontSize: 11 }}>{x.l}</span>
              </div>
            ))}
          </div>
          
          {/* Row 2: Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* Filter Label */}
            <span style={{ color: C.t3, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 6 }}>
              Filter
            </span>
            
            {/* Platform Filters */}
            {[
              { platform: 'instagram', icon: Instagram, color: C.instagram, label: 'Instagram' },
              { platform: 'facebook', icon: Facebook, color: C.facebook, label: 'Facebook' },
              { platform: 'twitter', icon: Twitter, color: C.twitter, label: 'Twitter' },
              { platform: 'linkedin', icon: Linkedin, color: C.linkedin, label: 'LinkedIn' },
            ].map(({ platform, icon: Icon, color, label }) => {
              const enabled = enabledPlatforms.has(platform);
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: enabled ? C.bg : 'transparent',
                    border: `1px solid ${enabled ? C.line : 'transparent'}`,
                    cursor: 'pointer',
                    padding: '5px 8px', 
                    borderRadius: 6,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (enabled) {
                      (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB';
                    } else {
                      (e.currentTarget as HTMLElement).style.background = C.bg;
                      (e.currentTarget as HTMLElement).style.borderColor = C.line;
                    }
                  }}
                  onMouseLeave={e => {
                    if (enabled) {
                      (e.currentTarget as HTMLElement).style.borderColor = C.line;
                    } else {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }
                  }}
                  title={`${enabled ? 'Hide' : 'Show'} ${label} posts`}
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1.5px solid ${enabled ? color : C.line}`,
                    background: enabled ? color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {enabled && (
                      <Icon size={9} style={{ color: '#fff' }} strokeWidth={3} />
                    )}
                  </div>
                  <span style={{ 
                    color: enabled ? C.t1 : C.t3, 
                    fontSize: 11, 
                    fontWeight: enabled ? 600 : 500,
                    transition: 'all 0.15s',
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', color: C.t3, fontSize: 10, fontWeight: 600, letterSpacing: '0.03em', padding: '2px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>{cells}</div>
      </div>

      {/* Side panel */}
      <div style={{ width: 264, flexShrink: 0 }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
          overflow: 'hidden', boxShadow: card,
          position: 'sticky', top: 84, maxHeight: 'calc(100vh - 104px)', overflowY: 'auto',
        }}>
          {selected ? (
            <>
              {/* Day header */}
              <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: C.t3, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {MONTHS[selected.getMonth()].slice(0,3)} {selected.getFullYear()}
                  </p>
                  <p style={{ color: C.t1, fontSize: 36, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', marginTop: 2 }}>
                    {selected.getDate()}
                  </p>
                </div>
                <button
                  onClick={() => onCreateFromIdea({ scheduledDate: new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 9, 0) })}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.acc, border: 'none', color: '#fff', borderRadius: 7, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 2 }}>
                  <Plus size={12} /> Post
                </button>
              </div>

              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Milestones */}
                {selMs.length > 0 && (
                  <div>
                    <p style={{ color: C.t3, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>Milestone Days</p>
                    {selMs.map(ms => {
                      const idea = getIdea(ms);
                      return (
                        <div key={ms.id} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: idea ? 8 : 0 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange, flexShrink: 0 }} />
                            <span style={{ color: C.t1, fontSize: 12, fontWeight: 500 }}>{ms.name}</span>
                          </div>
                          {idea && (
                            <>
                              <p style={{ color: C.t2, fontSize: 11, lineHeight: 1.55 }} className="line-clamp-3">{idea.caption}</p>
                              <button
                                onClick={() => onCreateFromIdea({ content: idea.caption, platform: 'instagram', scheduledDate: new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 9, 0), tags: idea.tags, status: 'draft' })}
                                style={{ marginTop: 8, background: 'none', border: `1px solid ${C.line}`, color: C.acc, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'all 0.12s' }}
                                className="hover:bg-violet-50 hover:border-violet-200 transition-all"
                              >
                                Use as template
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Posts */}
                {selPosts.length > 0 && (
                  <div>
                    <p style={{ color: C.t3, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>
                      {selPosts.length} Post{selPosts.length !== 1 ? 's' : ''}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selPosts.map(p => <PostCard key={p.id} post={p} onEdit={onEditPost} onDelete={onDeletePost} compact />)}
                    </div>
                  </div>
                )}

                {selPosts.length === 0 && selMs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <p style={{ color: C.t3, fontSize: 13 }}>Nothing on this day</p>
                    <button onClick={() => onCreateFromIdea({ scheduledDate: new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 9, 0) })}
                      style={{ background: 'none', border: 'none', color: C.acc, fontSize: 12, marginTop: 6, cursor: 'pointer', fontWeight: 500 }}>
                      Add a post
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <p style={{ color: C.t3, fontSize: 13 }}>Select a day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
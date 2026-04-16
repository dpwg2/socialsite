import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Hash, Tag, MessageSquare, ChevronDown, AlertCircle, Plus, Check, Clock, Sparkles, Loader } from 'lucide-react';
import { Post, HashtagGroup } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { C, modal, inp, lbl, platLabel } from '../utils/ds';
import { generatePostContent, getAiKey } from '../utils/ai';

interface Props {
  post?: Post;
  prefill?: Partial<Post>;
  hashtagGroups: HashtagGroup[];
  onSave: (p: any) => void;
  onClose: () => void;
}

const CHAR_LIMITS: Record<Post['platform'], number> = {
  instagram: 2200, twitter: 280, facebook: 63206, linkedin: 3000,
};
const PLATS: Post['platform'][] = ['instagram','twitter','facebook','linkedin'];

const TAGS = [
  'Project Showcase','Client Win','Tips','Promotion','Milestone',
  'Behind the Scenes','Construction','Kitchen','Bathroom',
  'Landscaping','Plumbing','Safety','New Build','Company News',
];

const SB: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 0 };

export function PostCreator({ post, prefill, hashtagGroups, onSave, onClose }: Props) {
  const [content,  setContent]  = useState(post?.content  || prefill?.content  || '');
  const [image,    setImage]    = useState(post?.image    || prefill?.image    || '');
  const [date,     setDate]     = useState(() => {
    const src = post?.scheduledDate || prefill?.scheduledDate;
    return src ? new Date(src).toISOString().slice(0,16) : '';
  });
  const [platform, setPlatform] = useState<Post['platform']>(post?.platform || prefill?.platform || 'instagram');
  const [status,   setStatus]   = useState<'draft'|'scheduled'>(
    (post?.status === 'posted' ? 'scheduled' : post?.status as any) ||
    (prefill?.status === 'posted' ? 'scheduled' : prefill?.status as any) || 'scheduled'
  );
  const [tags,     setTags]     = useState<string[]>(post?.tags || prefill?.tags || []);
  const [comment,  setComment]  = useState(post?.firstComment || '');
  const [notes,    setNotes]    = useState(post?.notes || '');
  const [hashOpen, setHashOpen] = useState(false);
  const [adv,      setAdv]      = useState(!!(post?.firstComment || post?.notes));
  const [uploads,    setUploads]    = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const limit  = CHAR_LIMITS[platform];
  const len    = content.length;
  const isOver = len > limit;
  const isWarn = len > limit * 0.85;
  const barCol = isOver ? C.red : isWarn ? C.orange : C.acc;
  const platColor = (C as any)[platform] as string;

  const appendGroup = (g: HashtagGroup) => {
    const sep = content.trim() ? '\n\n' : '';
    setContent(p => p.trim() + sep + g.hashtags.join(' '));
    setHashOpen(false);
    textRef.current?.focus();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const r = new FileReader();
      r.onloadend = () => {
        const url = r.result as string;
        setUploads(p => [...p, url]);
        if (!image) setImage(url);
      };
      r.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !date || isOver) return;
    const data: Omit<Post,'id'> = {
      content: content.trim(), image: image || undefined,
      scheduledDate: new Date(date), platform, status,
      tags: tags.length ? tags : undefined,
      firstComment: comment.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    onSave(post ? { ...post, ...data } : data);
  };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', borderRadius:10, background:'#fff', border:`1px solid ${C.line}`, boxShadow:modal }}
        className="enter"
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${C.line}`, position:'sticky', top:0, background:'#fff', zIndex:10, borderRadius:'10px 10px 0 0' }}>
          <p style={{ color:C.t1, fontSize:14, fontWeight:600 }}>{post ? 'Edit Post' : 'New Post'}</p>
          <button onClick={onClose} style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, border:`1px solid ${C.line}`, borderRadius:6, cursor:'pointer', color:C.t2, lineHeight:0 }}>
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* Platform */}
          <div>
            <label style={lbl}>Platform</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
              {PLATS.map(p => {
                const pc = (C as any)[p] as string;
                const active = platform === p;
                return (
                  <button key={p} type="button" onClick={() => setPlatform(p)} style={{
                    height:34, borderRadius:8, border:`1px solid ${active ? pc : C.line}`,
                    background: active ? pc : C.surface,
                    color: active ? '#fff' : C.t2,
                    fontSize:12, fontWeight: active ? 600 : 400, cursor:'pointer', transition:'all 0.12s',
                  }}>
                    {platLabel[p].split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...lbl, margin: 0 }}>Content</label>
              {image ? (
                <button
                  type="button"
                  disabled={generating}
                  onClick={async () => {
                    if (!getAiKey()) { setGenError('Add your Anthropic API key in Brand Settings → Preferences first.'); return; }
                    setGenerating(true);
                    setGenError('');
                    try {
                      const result = await generatePostContent(image, platform);
                      setContent(result);
                      textRef.current?.focus();
                    } catch (e: any) {
                      setGenError(e.message === 'no_key' ? 'Add your Anthropic API key in Brand Settings → Preferences.' : (e.message || 'Generation failed'));
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.acc}`, background: generating ? C.bg : C.accFill, color: generating ? C.t3 : C.acc, fontSize: 12, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                >
                  {generating
                    ? <><Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> Writing…</>
                    : <><Sparkles size={11} /> Write with AI</>
                  }
                </button>
              ) : (
                <span style={{ fontSize: 11, color: C.t3 }}>Add an image to use AI write</span>
              )}
            </div>
            {genError && <p style={{ fontSize: 11, color: C.red, marginBottom: 6, marginTop: 0 }}>{genError}</p>}
            <textarea
              ref={textRef} value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write your post…" rows={6} required
              style={{ ...inp, resize:'none', lineHeight:1.65, borderColor: isOver ? C.red : C.line }}
              onFocus={e => { e.currentTarget.style.borderColor = isOver ? C.red : C.acc; }}
              onBlur={e => { e.currentTarget.style.borderColor = isOver ? C.red : C.line; }}
            />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:5 }}>
              <button type="button" onClick={() => setHashOpen(!hashOpen)} style={{ ...SB, display:'flex', alignItems:'center', gap:4, color:C.acc, fontSize:12 }}>
                <Hash size={11} /> {hashOpen ? 'Close' : 'Insert hashtags'}
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:44, height:3, borderRadius:99, background:C.bg }}>
                  <div style={{ width:`${Math.min((len/limit)*100,100)}%`, height:'100%', background:barCol, borderRadius:99, transition:'width 0.3s, background 0.3s' }} />
                </div>
                <span style={{ color:barCol, fontSize:11 }}>{len}/{limit.toLocaleString()}</span>
              </div>
            </div>
            {isOver && (
              <div style={{ display:'flex', alignItems:'center', gap:4, color:C.red, fontSize:11, marginTop:4 }}>
                <AlertCircle size={11} /> {len - limit} over limit
              </div>
            )}
            {hashOpen && (
              <div style={{ marginTop:8, background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:10 }} className="enter">
                {hashtagGroups.length > 0 ? hashtagGroups.map(g => (
                  <button key={g.id} type="button" onClick={() => appendGroup(g)}
                    style={{ display:'block', width:'100%', textAlign:'left', background:'#fff', border:`1px solid ${C.line}`, borderRadius:7, padding:'8px 11px', fontSize:12, color:C.t2, cursor:'pointer', marginBottom:4, transition:'all 0.12s' }}
                    className="hover:border-violet-300 hover:bg-violet-50 transition-all">
                    <strong style={{ color:C.t1 }}>{g.name}</strong>
                    <span style={{ marginLeft:8, color:C.t3 }}>{g.hashtags.slice(0,4).join(' ')}{g.hashtags.length > 4 ? ` +${g.hashtags.length-4}` : ''}</span>
                  </button>
                )) : (
                  <p style={{ color:C.t3, fontSize:12, textAlign:'center', padding:'8px 0' }}>No groups — create some in Hashtag Manager</p>
                )}
              </div>
            )}
          </div>

          {/* Image */}
          <div>
            <label style={lbl}>Image (optional)</label>
            <div style={{ display:'flex', gap:7 }}>
              <input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://…" style={{ ...inp, flex:1 }} />
              <button type="button" onClick={() => fileRef.current?.click()} style={{ background:C.bg, border:`1px solid ${C.line}`, color:C.t2, borderRadius:8, padding:'0 12px', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap', height:38 }}>
                <ImageIcon size={12} /> Upload
              </button>
            </div>
            {image && (
              <div style={{ marginTop:7, position:'relative' }}>
                <ImageWithFallback src={image} alt="Preview" className="w-full object-cover rounded-lg" style={{ height:120 }} />
                <button type="button" onClick={() => setImage('')} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.55)', border:'none', color:'#fff', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <X size={10} />
                </button>
              </div>
            )}
            {uploads.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, marginTop:6 }}>
                {uploads.map((u, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <ImageWithFallback src={u} alt="" className="w-full object-cover rounded cursor-pointer"
                      style={{ height:40, outline: image === u ? `2px solid ${C.acc}` : 'none', outlineOffset:1 }}
                      onClick={() => setImage(u)} />
                    {image === u && <div style={{ position:'absolute', top:2, right:2, background:C.acc, borderRadius:'50%', width:12, height:12, display:'flex', alignItems:'center', justifyContent:'center' }}><Check size={7} color="#fff" /></div>}
                  </div>
                ))}
              </div>
            )}
            <input type="file" ref={fileRef} onChange={handleFile} multiple accept="image/*" style={{ display:'none' }} />
          </div>

          {/* Tags */}
          <div>
            <label style={lbl}>Tags</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => setTags(p => p.includes(tag) ? p.filter(x => x !== tag) : [...p, tag])} style={{
                  height:26, padding:'0 10px', borderRadius:5,
                  background: tags.includes(tag) ? C.acc : C.surface,
                  color: tags.includes(tag) ? '#fff' : C.t2,
                  border: `1px solid ${tags.includes(tag) ? 'transparent' : C.line}`,
                  fontSize:11, fontWeight: tags.includes(tag) ? 600 : 400, cursor:'pointer', transition:'all 0.12s',
                }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Date & Time</label>
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required style={inp} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <div style={{ display:'flex', gap:4 }}>
                {(['draft','scheduled'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setStatus(s)} style={{
                    flex:1, height:38, borderRadius:8, border:`1px solid ${status === s ? C.acc : C.line}`,
                    background: status === s ? C.accFill : C.surface,
                    color: status === s ? C.acc : C.t2,
                    fontSize:12, fontWeight: status === s ? 600 : 400, cursor:'pointer', transition:'all 0.12s',
                    textTransform:'capitalize',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto comment */}
          <div style={{ background: '#F5F3FF', border: `1px solid #DDD6FE`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={13} color={C.acc} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.acc }}>Auto comment</span>
              <span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>posted automatically after publishing</span>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment to auto-post after publishing… (e.g. hashtags, links, questions)"
              rows={3}
              style={{ ...inp, resize: 'none', background: '#fff', fontSize: 12 }}
            />
            {comment.trim() && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fff', border: `1px solid #DDD6FE`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.acc, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>ME</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.t1, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{comment}</p>
              </div>
            )}
          </div>

          {/* Advanced */}
          <div>
            <button type="button" onClick={() => setAdv(!adv)} style={{ ...SB, display:'flex', alignItems:'center', gap:5, color:C.t3, fontSize:12 }}>
              <ChevronDown size={13} style={{ transform:adv?'rotate(180deg)':'none', transition:'transform 0.2s' }} />
              Advanced options
              {notes && <div style={{ width:5, height:5, borderRadius:'50%', background:C.acc }} />}
            </button>
            {adv && (
              <div style={{ marginTop:12, paddingLeft:12, borderLeft:`2px solid ${C.line}`, display:'flex', flexDirection:'column', gap:12 }} className="enter">
                <div>
                  <label style={lbl}>Internal note <span style={{ fontWeight:400, textTransform:'none' }}>not published</span></label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Check with client first…" rows={2} style={{ ...inp, resize:'none' }} />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:`1px solid ${C.line}` }}>
            <button type="button" onClick={onClose} style={{ flex:1, background:C.surface, border:`1px solid ${C.line}`, color:C.t2, borderRadius:8, height:40, fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isOver || !content.trim()} style={{
              flex:2, border:'none', borderRadius:8, height:40, fontSize:13, fontWeight:600, cursor: isOver || !content.trim() ? 'not-allowed' : 'pointer',
              background: isOver || !content.trim() ? C.bg : C.acc,
              color: isOver || !content.trim() ? C.t3 : '#fff',
              transition:'all 0.15s',
            }}>
              {post ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Plus, Zap, Edit2, Trash2, X, MessageSquare, UserPlus,
  MessageCircle, AtSign, Heart, Copy, Check
} from 'lucide-react';
import { C, card, modal, inp, lbl } from '../utils/ds';
import { toast } from 'sonner@2.0.3';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface DmTemplate { id: string; name: string; message: string; usedIn: number; }
export interface DmAutomation {
  id: string; name: string;
  trigger: 'new_follower' | 'comment_keyword' | 'dm_keyword' | 'story_mention' | 'post_like';
  keyword?: string; templateId: string;
  platform: string; isActive: boolean;
  sentCount: number; respondedCount: number; delay: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const seedTemplates: DmTemplate[] = [
  { id:'t1', name:'New Follower Welcome', usedIn:2, message:"Hey {name}! 👋 Thanks for following BuildRight Co. We share home renovation tips, project reveals, and behind-the-scenes every week. If you're thinking about a renovation, we'd love to chat — drop us a DM or check the link in bio." },
  { id:'t2', name:'Quote Request Response', usedIn:1, message:"Hi {name}! Thanks for reaching out. We'd love to help with your project. One of our team will get back to you within 24 hours with a free, no-obligation quote." },
  { id:'t3', name:'Renovation Enquiry', usedIn:1, message:"Hi {name}! Saw you're interested in renovating — perfect timing! We specialise in kitchens, bathrooms, and full home transformations across Sydney. What are you thinking?" },
  { id:'t4', name:'Contest Entry', usedIn:0, message:"Hey {name}! 🎉 You're entered! We'll announce the winner on {post_date}. Good luck, and don't forget to tag a friend to double your chances." },
];

const seedAutomations: DmAutomation[] = [
  { id:'a1', name:'Welcome New Followers', trigger:'new_follower',    templateId:'t1', platform:'instagram', isActive:true,  sentCount:842,  respondedCount:187, delay:5  },
  { id:'a2', name:'Renovation Keyword',    trigger:'comment_keyword', keyword:'renovation', templateId:'t3', platform:'instagram', isActive:true, sentCount:213, respondedCount:94, delay:0 },
  { id:'a3', name:'Quote Requests',        trigger:'dm_keyword',      keyword:'quote',  templateId:'t2', platform:'instagram', isActive:true,  sentCount:119,  respondedCount:62,  delay:0  },
  { id:'a4', name:'Story Mention Thanks',  trigger:'story_mention',   templateId:'t1', platform:'instagram', isActive:false, sentCount:48,   respondedCount:11,  delay:30 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TRIGGER_META: Record<DmAutomation['trigger'], { label: string; icon: React.ElementType }> = {
  new_follower:    { label: 'New Follower',    icon: UserPlus       },
  comment_keyword: { label: 'Comment Keyword', icon: MessageCircle  },
  dm_keyword:      { label: 'DM Keyword',      icon: MessageSquare  },
  story_mention:   { label: 'Story Mention',   icon: AtSign         },
  post_like:       { label: 'Like Milestone',  icon: Heart          },
};

const SB: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 };

// ─── AutomationModal ──────────────────────────────────────────────────────────
function AutomationModal({ initial, templates, onSave, onClose }: {
  initial?: DmAutomation;
  templates: DmTemplate[];
  onSave: (d: Omit<DmAutomation,'id'|'sentCount'|'respondedCount'>) => void;
  onClose: () => void;
}) {
  const [name,       setName]       = useState(initial?.name || '');
  const [trigger,    setTrigger]    = useState<DmAutomation['trigger']>(initial?.trigger || 'new_follower');
  const [keyword,    setKeyword]    = useState(initial?.keyword || '');
  const [templateId, setTemplateId] = useState(initial?.templateId || templates[0]?.id || '');
  const [platform,   setPlatform]   = useState(initial?.platform || 'instagram');
  const [isActive,   setIsActive]   = useState(initial?.isActive ?? true);
  const [delay,      setDelay]      = useState(initial?.delay ?? 0);

  const needsKw = trigger === 'comment_keyword' || trigger === 'dm_keyword';
  const canSave = name.trim() && templateId && (!needsKw || keyword.trim());

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)' }}
      onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:480, background:C.surface, borderRadius:10, border:`1px solid ${C.line}`, boxShadow:modal, overflow:'hidden' }} className="enter">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${C.line}` }}>
          <p style={{ color:C.t1, fontSize:14, fontWeight:600 }}>{initial ? 'Edit Automation' : 'New Automation'}</p>
          <button onClick={onClose} style={{ ...SB, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color:C.t3, background:C.bg, borderRadius:6 }}><X size={13} /></button>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16, maxHeight:'65vh', overflowY:'auto' }}>
          <div>
            <label style={lbl}>Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Welcome New Followers" style={inp} autoFocus />
          </div>
          <div>
            <label style={lbl}>Trigger</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {(Object.entries(TRIGGER_META) as [DmAutomation['trigger'], typeof TRIGGER_META[DmAutomation['trigger']]][]).map(([key, meta]) => {
                const TIcon = meta.icon;
                const active = trigger === key;
                return (
                  <button key={key} type="button" onClick={()=>setTrigger(key)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, cursor:'pointer', background:active ? C.accFill : C.bg, border:`1px solid ${active ? C.acc : C.line}`, textAlign:'left', transition:'all 0.12s' }}>
                    <TIcon size={13} style={{ color: active ? C.acc : C.t3 }} />
                    <span style={{ color: active ? C.acc : C.t2, fontSize:12, fontWeight: active ? 600 : 400 }}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {needsKw && (
            <div>
              <label style={lbl}>Keyword</label>
              <input type="text" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. quote, renovation" style={inp} />
              <p style={{ color:C.t3, fontSize:11, marginTop:4 }}>Comma-separated for multiple keywords</p>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Platform</label>
              <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="instagram">Instagram</option>
                <option value="twitter">X / Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Delay (mins)</label>
              <input type="number" min={0} max={1440} value={delay} onChange={e=>setDelay(+e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Template</label>
            <select value={templateId} onChange={e=>setTemplateId(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="">— Select template —</option>
              {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:C.bg, borderRadius:8 }}>
            <div>
              <p style={{ color:C.t1, fontSize:13, fontWeight:500 }}>Active</p>
              <p style={{ color:C.t3, fontSize:11, marginTop:1 }}>Start immediately on save</p>
            </div>
            <button className={`toggle ${isActive?'on':''}`} type="button" onClick={()=>setIsActive(!isActive)} />
          </div>
        </div>
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.line}`, display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, background:C.bg, border:`1px solid ${C.line}`, color:C.t2, borderRadius:8, padding:'9px 0', fontSize:13, fontWeight:500, cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{ if(canSave) onSave({name,trigger,keyword:keyword||undefined,templateId,platform,isActive,delay}); }}
            disabled={!canSave}
            style={{ flex:2, background:canSave?C.acc:C.bg, border:'none', color:canSave?'#fff':C.t3, borderRadius:8, padding:'9px 0', fontSize:13, fontWeight:600, cursor:canSave?'pointer':'default' }}>
            {initial?'Update':'Create Automation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template form ────────────────────────────────────────────────────────────
function TemplateForm({ initial, onSave, onCancel }: { initial?: DmTemplate; onSave:(d:{name:string;message:string})=>void; onCancel:()=>void; }) {
  const [name,    setName]    = useState(initial?.name || '');
  const [message, setMessage] = useState(initial?.message || '');
  const vars = ['{name}','{handle}','{post_date}','{business_name}'];
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.acc}`, borderRadius:8, padding:20 }}>
      <p style={{ color:C.t1, fontSize:13, fontWeight:600, marginBottom:14 }}>{initial?'Edit Template':'New Template'}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <label style={lbl}>Name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Welcome Message" style={inp} autoFocus />
        </div>
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <label style={{ ...lbl, marginBottom:0 }}>Message</label>
            <div style={{ display:'flex', gap:4 }}>
              {vars.map(v=>(
                <button key={v} type="button" onClick={()=>setMessage(p=>p+v)}
                  style={{ background:C.bg, border:`1px solid ${C.line}`, color:C.t2, padding:'2px 7px', borderRadius:4, fontSize:10, cursor:'pointer', fontFamily:'monospace' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder="Write your DM…"
            style={{ ...inp, resize:'none', lineHeight:1.65 }} />
          <p style={{ color:C.t3, fontSize:11, textAlign:'right', marginTop:3 }}>{message.length} chars</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, background:C.bg, border:`1px solid ${C.line}`, color:C.t2, borderRadius:7, padding:'8px 0', fontSize:12, fontWeight:500, cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{ if(name.trim()&&message.trim()) onSave({name,message}); }}
            disabled={!name.trim()||!message.trim()}
            style={{ flex:2, background:name.trim()&&message.trim()?C.acc:C.bg, border:'none', color:name.trim()&&message.trim()?'#fff':C.t3, borderRadius:7, padding:'8px 0', fontSize:12, fontWeight:600, cursor:name.trim()&&message.trim()?'pointer':'default' }}>
            {initial?'Update':'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AutoDMs() {
  const [automations, setAutomations] = useState<DmAutomation[]>(seedAutomations);
  const [templates,   setTemplates]   = useState<DmTemplate[]>(seedTemplates);
  const [tab,         setTab]         = useState<'automations'|'templates'>('automations');
  const [showModal,   setShowModal]   = useState(false);
  const [editAutom,   setEditAutom]   = useState<DmAutomation|undefined>();
  const [showTplForm, setTplForm]     = useState(false);
  const [editTpl,     setEditTpl]     = useState<DmTemplate|undefined>();

  const totalSent      = automations.reduce((s,a)=>s+a.sentCount, 0);
  const totalResponded = automations.reduce((s,a)=>s+a.respondedCount, 0);
  const activeCount    = automations.filter(a=>a.isActive).length;
  const rate           = totalSent > 0 ? Math.round((totalResponded/totalSent)*100) : 0;

  const STATS = [
    { label:'Active rules',  value:activeCount },
    { label:'DMs sent',      value:totalSent.toLocaleString() },
    { label:'Replies',       value:totalResponded.toLocaleString() },
    { label:'Reply rate',    value:`${rate}%` },
  ];

  const saveAutomation = (data: Omit<DmAutomation,'id'|'sentCount'|'respondedCount'>) => {
    if (editAutom) {
      setAutomations(p=>p.map(a=>a.id===editAutom.id?{...a,...data}:a));
      toast.success('Automation updated');
    } else {
      setAutomations(p=>[...p,{...data,id:Date.now().toString(),sentCount:0,respondedCount:0}]);
      toast.success('Automation created!');
    }
    setShowModal(false); setEditAutom(undefined);
  };

  const saveTemplate = (data:{name:string;message:string}) => {
    if (editTpl) {
      setTemplates(p=>p.map(t=>t.id===editTpl.id?{...t,...data}:t));
      toast.success('Template updated');
    } else {
      setTemplates(p=>[...p,{...data,id:Date.now().toString(),usedIn:0}]);
      toast.success('Template saved!');
    }
    setTplForm(false); setEditTpl(undefined);
  };

  return (
    <div style={{ maxWidth:960 }} className="enter">
      {/* ── Stats strip ──────────────────────────────────────── */}
      <div style={{ background:C.surface, border:`1px solid ${C.line}`, borderRadius:8, boxShadow:card, display:'flex', marginBottom:20 }}>
        {STATS.map(({label,value},i)=>(
          <div key={label} style={{ flex:1, padding:'20px 24px', borderRight:i<STATS.length-1?`1px solid ${C.line}`:'none' }}>
            <p style={{ color:C.t3, fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{label}</p>
            <p style={{ color:C.t1, fontSize:28, fontWeight:700, letterSpacing:'-0.04em', lineHeight:1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Card ─────────────────────────────────────────────── */}
      <div style={{ background:C.surface, border:`1px solid ${C.line}`, borderRadius:8, overflow:'hidden', boxShadow:card }}>
        {/* Tab bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`1px solid ${C.line}`, background:C.bg }}>
          <div style={{ display:'flex', background:C.surface, border:`1px solid ${C.line}`, borderRadius:7, padding:2, gap:1 }}>
            {[{k:'automations',l:'Automations'},{k:'templates',l:'Templates'}].map(({k,l})=>(
              <button key={k} onClick={()=>setTab(k as any)} style={{ height:28, padding:'0 14px', borderRadius:5, border:'none', cursor:'pointer', fontSize:12, fontWeight:tab===k?600:400, background:tab===k?C.surface:C.bg, color:tab===k?C.t1:C.t2, boxShadow:tab===k?'0 1px 2px rgba(0,0,0,0.06)':undefined, transition:'all 0.12s' }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={()=>{ if(tab==='automations'){setEditAutom(undefined);setShowModal(true);}else{setEditTpl(undefined);setTplForm(true);} }}
            style={{ display:'flex', alignItems:'center', gap:5, height:32, padding:'0 14px', background:C.acc, border:'none', color:'#fff', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <Plus size={13} strokeWidth={2.5} />
            {tab==='automations'?'New Automation':'New Template'}
          </button>
        </div>

        <div style={{ padding:16 }}>
          {tab==='automations' ? (
            <div>
              {/* Info bar */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:C.accFill, borderRadius:7, border:`1px solid #DDD6FE`, marginBottom:14 }}>
                <Zap size={12} style={{ color:C.acc, flexShrink:0 }} />
                <p style={{ color:'#5B21B6', fontSize:12 }}>Auto DMs use the Instagram Graph API. Connect your business account in Brand Settings to go live.</p>
              </div>

              {automations.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <p style={{ color:C.t3, fontSize:13 }}>No automations yet</p>
                  <button onClick={()=>setShowModal(true)} style={{ background:'none', border:'none', color:C.acc, fontSize:13, cursor:'pointer', marginTop:6 }}>Create one →</button>
                </div>
              ) : (
                <div style={{ border:`1px solid ${C.line}`, borderRadius:8, overflow:'hidden' }}>
                  {automations.map((a, i) => {
                    const meta = TRIGGER_META[a.trigger];
                    const TIcon = meta.icon;
                    const respRate = a.sentCount > 0 ? Math.round((a.respondedCount/a.sentCount)*100) : 0;
                    const tpl = templates.find(t=>t.id===a.templateId);
                    return (
                      <div key={a.id} style={{ display:'grid', gridTemplateColumns:'1fr 200px 100px', alignItems:'center', padding:'14px 16px', borderBottom:i<automations.length-1?`1px solid ${C.lineSub}`:'none', transition:'background 0.1s' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.bg}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                        {/* Left */}
                        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                          <div style={{ width:32, height:32, background:C.bg, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${C.line}` }}>
                            <TIcon size={14} style={{ color:C.t2 }} />
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                              <p style={{ color:C.t1, fontSize:13, fontWeight:500 }} className="truncate">{a.name}</p>
                              <span style={{ color:C.t3, fontSize:11, background:C.bg, border:`1px solid ${C.line}`, borderRadius:4, padding:'1px 6px', flexShrink:0 }}>{a.platform}</span>
                            </div>
                            <p style={{ color:C.t3, fontSize:11 }}>
                              {meta.label}
                              {a.keyword && <span style={{ color:C.t2 }}> · "{a.keyword}"</span>}
                              {a.delay > 0 && <span> · {a.delay}m delay</span>}
                              {tpl && <span> · {tpl.name}</span>}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display:'flex', gap:20 }}>
                          {[{l:'Sent',v:a.sentCount.toLocaleString()},{l:'Replied',v:a.respondedCount.toLocaleString()},{l:'Rate',v:`${respRate}%`}].map(s=>(
                            <div key={s.l}>
                              <p style={{ color:C.t1, fontSize:13, fontWeight:600, lineHeight:1 }}>{s.v}</p>
                              <p style={{ color:C.t3, fontSize:10, marginTop:3 }}>{s.l}</p>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                          <button className={`toggle ${a.isActive?'on':''}`} onClick={()=>{ setAutomations(p=>p.map(x=>x.id===a.id?{...x,isActive:!x.isActive}:x)); toast.success(a.isActive?'Paused':'Activated'); }} />
                          <button onClick={()=>{setEditAutom(a);setShowModal(true);}} style={{ ...SB, padding:5, color:C.t3, borderRadius:5 }} className="hover:text-gray-600 hover:bg-gray-100 transition-colors"><Edit2 size={12} /></button>
                          <button onClick={()=>{setAutomations(p=>p.filter(x=>x.id!==a.id));toast.success('Deleted');}} style={{ ...SB, padding:5, color:C.t3, borderRadius:5 }} className="hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {showTplForm && (
                <div style={{ marginBottom:14 }}>
                  <TemplateForm initial={editTpl} onSave={saveTemplate} onCancel={()=>{setTplForm(false);setEditTpl(undefined);}} />
                </div>
              )}
              {templates.length === 0 && !showTplForm ? (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <p style={{ color:C.t3, fontSize:13 }}>No templates yet</p>
                  <button onClick={()=>setTplForm(true)} style={{ background:'none', border:'none', color:C.acc, fontSize:13, cursor:'pointer', marginTop:6 }}>Create one →</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:1, border:`1px solid ${C.line}`, borderRadius:8, overflow:'hidden' }}>
                  {templates.map((tpl, i) => {
                    const [copied, setCopied] = useState(false);
                    const doCopy = () => { navigator.clipboard.writeText(tpl.message); setCopied(true); setTimeout(()=>setCopied(false),2000); toast.success('Copied!'); };
                    return (
                      <div key={tpl.id} style={{ padding:'14px 16px', borderBottom:i<templates.length-1?`1px solid ${C.lineSub}`:'none', transition:'background 0.1s' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.bg}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                              <p style={{ color:C.t1, fontSize:13, fontWeight:500 }}>{tpl.name}</p>
                              {tpl.usedIn > 0 && <span style={{ color:C.t3, fontSize:11 }}>Used in {tpl.usedIn} automation{tpl.usedIn!==1?'s':''}</span>}
                            </div>
                            <p style={{ color:C.t2, fontSize:12, lineHeight:1.6 }} className="line-clamp-2">{tpl.message}</p>
                            <div style={{ display:'flex', gap:4, marginTop:7 }}>
                              {['{name}','{handle}','{post_date}'].map(v=>(
                                <code key={v} style={{ background:C.accFill, color:'#5B21B6', padding:'1px 6px', borderRadius:3, fontSize:10, fontFamily:'monospace' }}>{v}</code>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:1, flexShrink:0 }}>
                            <button onClick={doCopy} style={{ ...SB, padding:5, borderRadius:5, color:copied?C.green:C.t3 }} className="hover:bg-gray-100 transition-colors">{copied?<Check size={12}/>:<Copy size={12}/>}</button>
                            <button onClick={()=>{setEditTpl(tpl);setTplForm(true);}} style={{ ...SB, padding:5, borderRadius:5, color:C.t3 }} className="hover:text-gray-600 hover:bg-gray-100 transition-colors"><Edit2 size={12}/></button>
                            <button onClick={()=>{setTemplates(p=>p.filter(t=>t.id!==tpl.id));toast.success('Deleted');}} style={{ ...SB, padding:5, borderRadius:5, color:C.t3 }} className="hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AutomationModal initial={editAutom} templates={templates} onSave={saveAutomation} onClose={()=>{setShowModal(false);setEditAutom(undefined);}} />
      )}
    </div>
  );
}

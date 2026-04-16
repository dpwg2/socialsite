import { useState } from 'react';
import { BrandProfile } from '../App';
import { Save, Globe, Instagram, Facebook, Twitter, Linkedin, User, Link2, Settings, Bell, Users, Palette, Clock, Mail, Calendar, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { C, card, inp, lbl } from '../utils/ds';
import { getAiKey, setAiKey } from '../utils/ai';
import { getAllMilestones, Milestone } from '../data/milestones';

interface Props {
  brandProfile: BrandProfile;
  onUpdateBrandProfile: (p: BrandProfile) => void;
}

const GRADIENTS = [
  { k: 'from-orange-500 to-amber-400',  bg: 'linear-gradient(135deg,#f97316,#fbbf24)' },
  { k: 'from-violet-600 to-purple-500', bg: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { k: 'from-blue-500 to-cyan-400',     bg: 'linear-gradient(135deg,#3b82f6,#22d3ee)' },
  { k: 'from-green-500 to-emerald-400', bg: 'linear-gradient(135deg,#22c55e,#34d399)' },
  { k: 'from-red-500 to-rose-400',      bg: 'linear-gradient(135deg,#ef4444,#fb7185)' },
  { k: 'from-slate-600 to-slate-800',   bg: 'linear-gradient(135deg,#475569,#1e293b)' },
  { k: 'from-indigo-600 to-blue-500',   bg: 'linear-gradient(135deg,#4f46e5,#3b82f6)' },
  { k: 'from-orange-400 to-pink-500',   bg: 'linear-gradient(135deg,#fb923c,#ec4899)' },
];

const SB: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 0 };

type Section = 'profile' | 'connections' | 'brand' | 'preferences' | 'milestones' | 'notifications';

const SECTIONS = [
  { id: 'profile' as Section, label: 'Profile', icon: User },
  { id: 'connections' as Section, label: 'Connected Accounts', icon: Link2 },
  { id: 'brand' as Section, label: 'Brand Settings', icon: Palette },
  { id: 'preferences' as Section, label: 'Preferences', icon: Settings },
  { id: 'milestones' as Section, label: 'Milestone Days', icon: Calendar },
  { id: 'notifications' as Section, label: 'Notifications', icon: Bell },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: card }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.line}` }}>
        <p style={{ color: C.t1, fontSize: 13, fontWeight: 600 }}>{title}</p>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

interface ConnectionCardProps {
  platform: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  connected: boolean;
  onConnect: () => void;
  description: string;
}

function ConnectionCard({ platform, icon: Icon, color, gradient, connected, onConnect, description }: ConnectionCardProps) {
  return (
    <div style={{
      border: `1px solid ${C.line}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: C.surface,
      transition: 'all 0.15s',
    }}
      className="hover:border-gray-300"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          background: gradient,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ color: C.t1, fontSize: 13, fontWeight: 600 }}>{platform}</p>
            {connected && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 4,
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ color: '#059669', fontSize: 10, fontWeight: 600 }}>Connected</span>
              </div>
            )}
          </div>
          <p style={{ color: C.t3, fontSize: 12, marginTop: 2 }}>{description}</p>
        </div>
      </div>
      <button
        onClick={onConnect}
        style={{
          padding: '6px 12px',
          background: connected ? C.bg : gradient,
          border: connected ? `1px solid ${C.line}` : 'none',
          color: connected ? C.t2 : '#fff',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        className={connected ? 'hover:border-gray-300' : ''}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}

export function BrandSettings({ brandProfile, onUpdateBrandProfile }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [form, setForm] = useState({ ...brandProfile });
  const [hasChanges, setHasChanges] = useState(false);
  const [connections, setConnections] = useState({
    instagram: false,
    facebook: false,
    twitter: false,
    linkedin: false,
  });
  const [preferences, setPreferences] = useState({
    timezone: 'Australia/Sydney',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
  });
  const [aiKey, setAiKeyState] = useState(getAiKey);
  const [notifications, setNotifications] = useState({
    postPublished: true,
    postFailed: true,
    weeklyReport: false,
    milestoneReminders: true,
  });
  
  // Milestone state - all enabled by default
  const yearMilestones = getAllMilestones(new Date().getFullYear());
  const [enabledMilestones, setEnabledMilestones] = useState<Set<string>>(
    new Set(yearMilestones.map(m => m.id))
  );
  const [customMilestones, setCustomMilestones] = useState<Array<{ id: string; name: string; date: string; category: string }>>([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', date: '', category: 'observance' as const });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMilestone = (id: string) => {
    setEnabledMilestones(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addCustomMilestone = () => {
    if (!newMilestone.name || !newMilestone.date) {
      toast.error('Please fill in all fields');
      return;
    }
    const id = `custom-${Date.now()}`;
    setCustomMilestones(prev => [...prev, { ...newMilestone, id, category: 'custom' }]);
    setEnabledMilestones(prev => new Set([...prev, id]));
    setNewMilestone({ name: '', date: '', category: 'observance' });
    setShowAddMilestone(false);
    toast.success('Custom milestone added!');
  };

  const removeCustomMilestone = (id: string) => {
    setCustomMilestones(prev => prev.filter(m => m.id !== id));
    setEnabledMilestones(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success('Custom milestone removed');
  };

  const allMilestones = [...yearMilestones, ...customMilestones];
  const filteredMilestones = allMilestones.filter(m => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const enabledCount = enabledMilestones.size;
  const totalCount = allMilestones.length;

  const upd = (k: keyof BrandProfile, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setHasChanges(true);
  };

  const save = () => {
    onUpdateBrandProfile(form);
    setHasChanges(false);
    toast.success('Settings saved successfully!');
  };

  const toggleConnection = (platform: keyof typeof connections) => {
    setConnections(prev => ({ ...prev, [platform]: !prev[platform] }));
    toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} ${connections[platform] ? 'disconnected' : 'connected'}!`);
  };

  return (
    <div style={{ maxWidth: 1040 }} className="enter">
      {/* Top Tab Navigation */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        padding: 6,
        marginBottom: 20,
        boxShadow: card,
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {SECTIONS.map(section => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                background: isActive ? C.bg : 'transparent',
                border: `1px solid ${isActive ? C.line : 'transparent'}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = C.bg;
                  (e.currentTarget as HTMLElement).style.borderColor = C.line;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }
              }}
            >
              <Icon size={14} style={{ color: isActive ? C.acc : C.t3 }} strokeWidth={2} />
              <span style={{ color: isActive ? C.t1 : C.t2, fontSize: 13, fontWeight: isActive ? 600 : 500 }}>
                {section.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <>
            <Card title="Profile preview">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8 }}>
                <div className={`bg-gradient-to-br ${form.avatarGradient} flex-shrink-0`} style={{ width: 52, height: 52, borderRadius: '50%' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.t1, fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{form.name || 'Brand Name'}</p>
                  <p style={{ color: C.t3, fontSize: 12, marginTop: 2 }}>@{form.handle || 'handle'}</p>
                  {form.bio && <p style={{ color: C.t2, fontSize: 12, marginTop: 5, lineHeight: 1.5 }}>{form.bio}</p>}
                  {form.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Globe size={10} style={{ color: C.blue }} />
                      <span style={{ color: C.blue, fontSize: 12 }}>{form.website}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                    {[{ l: 'followers', v: form.followers }, { l: 'following', v: form.following }].map(s => (
                      <div key={s.l}>
                        <span style={{ color: C.t1, fontSize: 12, fontWeight: 600 }}>{s.v}</span>
                        <span style={{ color: C.t3, fontSize: 11, marginLeft: 3 }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Profile details">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Avatar */}
                <div>
                  <label style={lbl}>Avatar</label>
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                    {GRADIENTS.map(g => (
                      <button key={g.k} onClick={() => upd('avatarGradient', g.k)} style={{
                        ...SB, width: 26, height: 26, borderRadius: '50%', background: g.bg,
                        boxShadow: form.avatarGradient === g.k ? `0 0 0 2px #fff, 0 0 0 3.5px ${C.acc}` : '0 1px 3px rgba(0,0,0,0.12)',
                        transform: form.avatarGradient === g.k ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.15s',
                      }} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={lbl}>Brand name</label>
                    <input type="text" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="BuildRight Co." style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Handle</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.t3, fontSize: 13 }}>@</span>
                      <input type="text" value={form.handle} onChange={e => upd('handle', e.target.value.replace(/[@\s]/g, ''))} placeholder="buildright_co" style={{ ...inp, paddingLeft: 24 }} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Bio</label>
                  <textarea value={form.bio} onChange={e => upd('bio', e.target.value)} rows={3} maxLength={150}
                    placeholder="Building & renovation specialists | Sydney, Australia"
                    style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
                  <p style={{ color: form.bio.length >= 140 ? C.orange : C.t3, fontSize: 11, textAlign: 'right', marginTop: 3 }}>{form.bio.length}/150</p>
                </div>

                <div>
                  <label style={lbl}>Website</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.t3 }} />
                    <input type="text" value={form.website} onChange={e => upd('website', e.target.value)} placeholder="www.buildright.com.au" style={{ ...inp, paddingLeft: 30 }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={lbl}>Followers</label>
                    <input type="text" value={form.followers} onChange={e => upd('followers', e.target.value)} placeholder="0" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Following</label>
                    <input type="text" value={form.following} onChange={e => upd('following', e.target.value)} placeholder="0" style={inp} />
                  </div>
                </div>

                <button onClick={save} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  height: 40, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all 0.15s',
                  background: hasChanges ? C.acc : C.bg,
                  color: hasChanges ? '#fff' : C.t3,
                }}>
                  <Save size={13} /> {hasChanges ? 'Save changes' : 'All changes saved'}
                </button>
              </div>
            </Card>
          </>
        )}

        {/* Connected Accounts Section */}
        {activeSection === 'connections' && (
          <Card title="Social media accounts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: C.t2, fontSize: 13, marginBottom: 8 }}>
                Connect your social media accounts to enable cross-posting, analytics, and live post fetching.
              </p>
              <ConnectionCard
                platform="Instagram"
                icon={Instagram}
                color={C.instagram}
                gradient="linear-gradient(135deg,#c13584,#fd1d1d,#fcb045)"
                connected={connections.instagram}
                onConnect={() => toggleConnection('instagram')}
                description="Pull live posts, real stats, and enable Auto DMs"
              />
              <ConnectionCard
                platform="Facebook"
                icon={Facebook}
                color={C.facebook}
                gradient="linear-gradient(135deg,#1877f2,#0a66c2)"
                connected={connections.facebook}
                onConnect={() => toggleConnection('facebook')}
                description="Manage pages and schedule posts to Facebook"
              />
              <ConnectionCard
                platform="Twitter"
                icon={Twitter}
                color={C.twitter}
                gradient="linear-gradient(135deg,#1da1f2,#14171a)"
                connected={connections.twitter}
                onConnect={() => toggleConnection('twitter')}
                description="Tweet and monitor engagement across Twitter"
              />
              <ConnectionCard
                platform="LinkedIn"
                icon={Linkedin}
                color={C.linkedin}
                gradient="linear-gradient(135deg,#0077b5,#004182)"
                connected={connections.linkedin}
                onConnect={() => toggleConnection('linkedin')}
                description="Share professional updates on LinkedIn"
              />
            </div>
          </Card>
        )}

        {/* Brand Settings Section */}
        {activeSection === 'brand' && (
          <>
            <Card title="Brand identity">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={lbl}>Primary color</label>
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                    {GRADIENTS.map(g => (
                      <button key={g.k} onClick={() => toast.success('Brand color updated!')} style={{
                        ...SB, width: 32, height: 32, borderRadius: 8, background: g.bg,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        transition: 'all 0.15s',
                      }}
                        className="hover:scale-110"
                      />
                    ))}
                  </div>
                  <p style={{ color: C.t3, fontSize: 11, marginTop: 6 }}>Used for accent elements across the app</p>
                </div>

                <div>
                  <label style={lbl}>Brand voice</label>
                  <select style={inp}>
                    <option>Professional</option>
                    <option>Casual & Friendly</option>
                    <option>Bold & Energetic</option>
                    <option>Minimal & Modern</option>
                  </select>
                  <p style={{ color: C.t3, fontSize: 11, marginTop: 6 }}>AI will use this to suggest captions</p>
                </div>

                <div>
                  <label style={lbl}>Industry tags</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Building', 'Renovation', 'Plumbing', 'Architecture', 'Design'].map(tag => (
                      <div key={tag} style={{
                        padding: '5px 10px',
                        background: C.bg,
                        border: `1px solid ${C.line}`,
                        borderRadius: 6,
                        fontSize: 12,
                        color: C.t1,
                      }}>
                        {tag}
                      </div>
                    ))}
                    <button style={{
                      padding: '5px 10px',
                      background: 'none',
                      border: `1px dashed ${C.line}`,
                      borderRadius: 6,
                      fontSize: 12,
                      color: C.t3,
                      cursor: 'pointer',
                    }}>
                      + Add tag
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Default hashtags">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: C.t2, fontSize: 13 }}>
                  These hashtags will be automatically suggested when creating new posts.
                </p>
                <textarea
                  placeholder="#building #renovation #sydney #architecture"
                  rows={3}
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                />
              </div>
            </Card>
          </>
        )}

        {/* Preferences Section */}
        {activeSection === 'preferences' && (
          <Card title="System preferences">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={e => setPreferences(p => ({ ...p, timezone: e.target.value }))}
                  style={inp}
                >
                  <option>Australia/Sydney</option>
                  <option>Australia/Melbourne</option>
                  <option>Australia/Brisbane</option>
                  <option>Australia/Perth</option>
                  <option>Pacific/Auckland</option>
                  <option>America/Los_Angeles</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
                <p style={{ color: C.t3, fontSize: 11, marginTop: 6 }}>Used for scheduling and analytics</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={lbl}>Date format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={e => setPreferences(p => ({ ...p, dateFormat: e.target.value }))}
                    style={inp}
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Time format</label>
                  <select
                    value={preferences.timeFormat}
                    onChange={e => setPreferences(p => ({ ...p, timeFormat: e.target.value }))}
                    style={inp}
                  >
                    <option>12h</option>
                    <option>24h</option>
                  </select>
                </div>
              </div>

              {/* AI key */}
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ ...lbl, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} color={C.acc} /> Anthropic API key <span style={{ fontWeight: 400, textTransform: 'none', color: C.t3 }}>for AI content generation</span>
                </label>
                <input
                  type="password"
                  value={aiKey}
                  onChange={e => setAiKeyState(e.target.value)}
                  placeholder="sk-ant-…"
                  style={inp}
                />
                <button
                  type="button"
                  onClick={() => { setAiKey(aiKey); toast.success('API key saved'); }}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: C.acc, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Save size={11} /> Save key
                </button>
              </div>

              <button onClick={() => toast.success('Preferences saved!')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                height: 40, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: 'none', transition: 'all 0.15s',
                background: C.acc,
                color: '#fff',
              }}>
                <Save size={13} /> Save preferences
              </button>
            </div>
          </Card>
        )}

        {/* Milestones Section */}
        {activeSection === 'milestones' && (
          <Card title={`Milestone Days (${enabledCount} of ${totalCount} enabled)`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: C.t2, fontSize: 13, marginBottom: 4 }}>
                Choose which milestone days appear in your calendar. All 113 industry-relevant dates are enabled by default.
              </p>

              {/* Search and Filter Bar */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search milestones..."
                  style={{ ...inp, flex: 1, minWidth: 200 }}
                />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  style={{ ...inp, width: 'auto' }}
                >
                  <option value="all">All Categories</option>
                  <option value="awareness">Awareness</option>
                  <option value="holiday">Holiday</option>
                  <option value="observance">Observance</option>
                  <option value="cultural">Cultural</option>
                  <option value="custom">Custom</option>
                </select>
                <button
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0 14px',
                    height: 38,
                    background: C.acc,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={14} /> Add Custom
                </button>
              </div>

              {/* Add Custom Milestone Form */}
              {showAddMilestone && (
                <div style={{
                  background: C.bg,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: 16,
                }}>
                  <p style={{ color: C.t1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add Custom Milestone</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                      <div>
                        <label style={lbl}>Milestone name</label>
                        <input
                          type="text"
                          value={newMilestone.name}
                          onChange={e => setNewMilestone(p => ({ ...p, name: e.target.value }))}
                          placeholder="Company Anniversary"
                          style={inp}
                        />
                      </div>
                      <div style={{ minWidth: 140 }}>
                        <label style={lbl}>Date (MM-DD)</label>
                        <input
                          type="text"
                          value={newMilestone.date}
                          onChange={e => setNewMilestone(p => ({ ...p, date: e.target.value }))}
                          placeholder="03-15"
                          maxLength={5}
                          style={inp}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button
                        onClick={() => {
                          setShowAddMilestone(false);
                          setNewMilestone({ name: '', date: '', category: 'observance' });
                        }}
                        style={{
                          padding: '7px 12px',
                          background: 'transparent',
                          border: `1px solid ${C.line}`,
                          color: C.t2,
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addCustomMilestone}
                        style={{
                          padding: '7px 12px',
                          background: C.acc,
                          border: 'none',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Plus size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        Add Milestone
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestone List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 500, overflowY: 'auto' }}>
                {filteredMilestones.length === 0 ? (
                  <p style={{ color: C.t3, fontSize: 13, textAlign: 'center', padding: 20 }}>
                    No milestones found matching your search
                  </p>
                ) : (
                  filteredMilestones.map((milestone) => {
                    const isCustom = milestone.id.startsWith('custom-');
                    const isEnabled = enabledMilestones.has(milestone.id);
                    
                    return (
                      <div
                        key={milestone.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: C.surface,
                          border: `1px solid ${C.line}`,
                          borderRadius: 6,
                          transition: 'all 0.15s',
                        }}
                        className="hover:border-gray-300"
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleMilestone(milestone.id)}
                          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: C.acc, flexShrink: 0 }}
                        />

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <p style={{ color: C.t1, fontSize: 13, fontWeight: 500 }}>{milestone.name}</p>
                            {isCustom && (
                              <span style={{
                                padding: '2px 5px',
                                background: C.bg,
                                border: `1px solid ${C.line}`,
                                borderRadius: 3,
                                fontSize: 9,
                                fontWeight: 600,
                                color: C.t3,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                              }}>
                                Custom
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                            <span style={{ color: C.t3, fontSize: 11 }}>{milestone.date}</span>
                            <span style={{
                              padding: '1px 5px',
                              background: C.bg,
                              borderRadius: 3,
                              fontSize: 10,
                              color: C.t3,
                              textTransform: 'capitalize',
                            }}>
                              {milestone.category}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {isCustom && (
                          <button
                            onClick={() => removeCustomMilestone(milestone.id)}
                            style={{
                              padding: 6,
                              background: 'transparent',
                              border: 'none',
                              color: C.t3,
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Remove custom milestone"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
                <button
                  onClick={() => {
                    setEnabledMilestones(new Set(allMilestones.map(m => m.id)));
                    toast.success('All milestones enabled');
                  }}
                  style={{
                    padding: '7px 12px',
                    background: 'transparent',
                    border: `1px solid ${C.line}`,
                    color: C.t2,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Enable All
                </button>
                <button
                  onClick={() => {
                    setEnabledMilestones(new Set());
                    toast.success('All milestones disabled');
                  }}
                  style={{
                    padding: '7px 12px',
                    background: 'transparent',
                    border: `1px solid ${C.line}`,
                    color: C.t2,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Disable All
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => toast.success(`Saved ${enabledCount} enabled milestones!`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 16px',
                    background: C.acc,
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Save size={12} /> Save Milestone Settings
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <Card title="Notification settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: C.t2, fontSize: 13, marginBottom: 4 }}>
                Choose what updates you'd like to receive via email.
              </p>

              {[
                { key: 'postPublished' as const, label: 'Post published', desc: 'When a scheduled post goes live' },
                { key: 'postFailed' as const, label: 'Post failed', desc: 'When a post fails to publish' },
                { key: 'weeklyReport' as const, label: 'Weekly reports', desc: 'Analytics summary every Monday' },
                { key: 'milestoneReminders' as const, label: 'Milestone reminders', desc: 'Upcoming milestone days in your industry' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={e => setNotifications(p => ({ ...p, [item.key]: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.acc }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.t1, fontSize: 13, fontWeight: 500 }}>{item.label}</p>
                    <p style={{ color: C.t3, fontSize: 12, marginTop: 1 }}>{item.desc}</p>
                  </div>
                </label>
              ))}

              <button onClick={() => toast.success('Notification settings saved!')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                height: 40, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: 'none', transition: 'all 0.15s',
                background: C.acc,
                color: '#fff',
                marginTop: 8,
              }}>
                <Save size={13} /> Save notification settings
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
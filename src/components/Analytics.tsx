import { Post } from '../App';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Clock, Hash, Award } from 'lucide-react';
import { C, card, platLabel } from '../utils/ds';

interface Props { posts: Post[]; }

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}>
      {label && <p style={{ color: C.t3, marginBottom: 6, fontWeight: 600 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.fill || p.stroke || p.color }} />
          <span style={{ color: C.t1 }}>{p.name}: <strong>{p.value.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, sub, children, icon }: { title: string; sub?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', boxShadow: card }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <div style={{ color: C.acc, lineHeight: 0 }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <p style={{ color: C.t1, fontSize: 13, fontWeight: 600 }}>{title}</p>
          {sub && <p style={{ color: C.t3, fontSize: 11, marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color || C.acc }} />
        <span style={{ color: C.t3, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: C.t1, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ color: C.t3, fontSize: 11 }}>{unit}</span>}
      </div>
    </div>
  );
}

export function Analytics({ posts }: Props) {
  const now = new Date();

  // ─── Basic counts ───────────────────────────────────────────────────────────
  const total     = posts.length;
  const scheduled = posts.filter(p => p.status === 'scheduled').length;
  const published = posts.filter(p => p.status === 'posted').length;
  const draft     = posts.filter(p => p.status === 'draft').length;
  const thisWeek  = posts.filter(p => {
    const diff = new Date(p.scheduledDate).getTime() - now.getTime();
    return p.status === 'scheduled' && diff > 0 && diff < 7 * 864e5;
  }).length;

  // ─── Engagement metrics ─────────────────────────────────────────────────────
  const postedPosts = posts.filter(p => p.status === 'posted');
  const totalLikes = postedPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = postedPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
  const totalReach = postedPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
  const totalSaves = postedPosts.reduce((sum, p) => sum + (p.saves || 0), 0);
  
  const avgLikes = postedPosts.length > 0 ? Math.round(totalLikes / postedPosts.length) : 0;
  const avgComments = postedPosts.length > 0 ? Math.round(totalComments / postedPosts.length) : 0;
  const avgReach = postedPosts.length > 0 ? Math.round(totalReach / postedPosts.length) : 0;
  const engagementRate = totalReach > 0 ? ((totalLikes + totalComments) / totalReach * 100).toFixed(1) : '0.0';

  // ─── Monthly activity ───────────────────────────────────────────────────────
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mp = posts.filter(p => { const x = new Date(p.scheduledDate); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); });
    return {
      month:     d.toLocaleString('default', { month: 'short' }),
      Published: mp.filter(p => p.status === 'posted').length,
      Scheduled: mp.filter(p => p.status === 'scheduled').length,
      total:     mp.length,
    };
  });

  // ─── Platform breakdown ─────────────────────────────────────────────────────
  const platforms = ['instagram','twitter','facebook','linkedin']
    .map(k => ({ key: k, label: platLabel[k], count: posts.filter(p => p.platform === k).length, color: (C as any)[k] }))
    .filter(p => p.count > 0);

  // ─── Day of week cadence ────────────────────────────────────────────────────
  const dayData = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => ({
    day: d, count: posts.filter(p => new Date(p.scheduledDate).getDay() === i).length,
  }));

  // ─── Engagement over time ───────────────────────────────────────────────────
  const engData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mp = postedPosts.filter(p => { const x = new Date(p.scheduledDate); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); });
    const reach = mp.reduce((s, p) => s + (p.reach || 0), 0);
    const likes = mp.reduce((s, p) => s + (p.likes || 0), 0);
    return { month: d.toLocaleString('default', { month: 'short' }), Reach: reach, Likes: likes };
  });

  // ─── Best posting times (hour analysis) ─────────────────────────────────────
  const hourData = Array.from({ length: 24 }, (_, h) => {
    const postsAtHour = postedPosts.filter(p => new Date(p.scheduledDate).getHours() === h);
    const avgEng = postsAtHour.length > 0 
      ? postsAtHour.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0) / postsAtHour.length
      : 0;
    return { hour: h, engagement: Math.round(avgEng), posts: postsAtHour.length };
  }).filter(d => d.posts > 0);

  // ─── Content type performance ───────────────────────────────────────────────
  const allTags = posts.flatMap(p => p.tags || []);
  const uniqueTags = Array.from(new Set(allTags));
  const tagPerformance = uniqueTags.map(tag => {
    const tagPosts = postedPosts.filter(p => p.tags?.includes(tag));
    const avgLikes = tagPosts.length > 0 ? tagPosts.reduce((s, p) => s + (p.likes || 0), 0) / tagPosts.length : 0;
    return { tag, count: tagPosts.length, avgLikes: Math.round(avgLikes) };
  }).sort((a, b) => b.avgLikes - a.avgLikes).slice(0, 6);

  // ─── Top performing posts ───────────────────────────────────────────────────
  const topPosts = [...postedPosts]
    .sort((a, b) => ((b.likes || 0) + (b.comments || 0) * 2) - ((a.likes || 0) + (a.comments || 0) * 2))
    .slice(0, 5);

  // ─── Platform-specific metrics ──────────────────────────────────────────────
  const platformMetrics = platforms.map(p => {
    const platPosts = postedPosts.filter(post => post.platform === p.key);
    const likes = platPosts.reduce((s, post) => s + (post.likes || 0), 0);
    const comments = platPosts.reduce((s, post) => s + (post.comments || 0), 0);
    const reach = platPosts.reduce((s, post) => s + (post.reach || 0), 0);
    const avgEng = platPosts.length > 0 ? Math.round((likes + comments) / platPosts.length) : 0;
    return { ...p, avgEngagement: avgEng, totalReach: reach, posts: platPosts.length };
  });

  // ─── Growth trajectory (mock month-over-month) ──────────────────────────────
  const growthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const baseFollowers = 2000;
    const growth = baseFollowers + (i * 80) + Math.floor(Math.random() * 100);
    return { month: d.toLocaleString('default', { month: 'short' }), followers: growth };
  });

  const STATS = [
    { label: 'Total posts',  value: total,     delta: '+12%', up: true  },
    { label: 'Scheduled',    value: scheduled,  delta: '+4',   up: true  },
    { label: 'Published',    value: published,  delta: '+8',   up: true  },
    { label: 'Drafts',       value: draft,      delta: null,   up: null  },
    { label: 'This week',    value: thisWeek,   delta: '+2',   up: true  },
  ];

  return (
    <div style={{ maxWidth: 1200 }} className="enter">
      {/* ── Stats strip ────────────────────────────────────── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
        boxShadow: card, display: 'flex', marginBottom: 20,
      }}>
        {STATS.map(({ label, value, delta, up }, i) => (
          <div
            key={label}
            style={{
              flex: 1, padding: '20px 24px',
              borderRight: i < STATS.length - 1 ? `1px solid ${C.line}` : 'none',
            }}
          >
            <p style={{ color: C.t3, fontSize: 11, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: C.t1, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {value}
              </span>
              {delta && (
                <span style={{ color: up ? C.green : C.red, fontSize: 11, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Engagement overview ──────────────────────────────── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8,
        boxShadow: card, padding: '24px 28px', marginBottom: 20,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24,
      }}>
        <MiniStat label="Avg. Likes" value={avgLikes} />
        <MiniStat label="Avg. Comments" value={avgComments} />
        <MiniStat label="Avg. Reach" value={avgReach} />
        <MiniStat label="Engagement Rate" value={engagementRate} unit="%" />
        <MiniStat label="Total Saves" value={totalSaves} />
      </div>

      {/* ── Row 2: bar chart + pie ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <Section title="Post Activity" sub="Last 6 months — published vs scheduled" icon={<TrendingUp size={14} />}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthly} barSize={10} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.lineSub} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} allowDecimals={false} width={22} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="Published" fill={C.acc}  radius={[3,3,0,0]} name="Published" />
                <Bar dataKey="Scheduled" fill="#D4C2FC" radius={[3,3,0,0]} name="Scheduled" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[{ l: 'Published', c: C.acc }, { l: 'Scheduled', c: '#D4C2FC' }].map(x => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                  <span style={{ color: C.t3, fontSize: 11 }}>{x.l}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Platform split" sub="Posts by channel">
          {platforms.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={platforms} cx="50%" cy="50%" innerRadius={30} outerRadius={50}
                    paddingAngle={4} dataKey="count" strokeWidth={0}>
                    {platforms.map(p => <Cell key={p.key} fill={p.color} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                {platforms.map(p => (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ color: C.t2, fontSize: 12, flex: 1 }}>{p.label}</span>
                    <div style={{ width: 48, height: 3, borderRadius: 99, background: C.bg }}>
                      <div style={{ width: `${total > 0 ? (p.count / total) * 100 : 0}%`, height: '100%', background: p.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ color: C.t3, fontSize: 11, width: 18, textAlign: 'right' }}>{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: C.t3, fontSize: 12, textAlign: 'center', padding: '30px 0' }}>No posts yet</p>
          )}
        </Section>
      </div>

      {/* ── Row 3: Engagement trends + Growth ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Section title="Engagement trends" sub="Reach and likes over time" icon={<TrendingUp size={14} />}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={engData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lineSub} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="Reach" stroke={C.acc} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Likes" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[{ l: 'Reach', c: C.acc }, { l: 'Likes', c: '#16A34A' }].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: x.c }} />
                <span style={{ color: C.t3, fontSize: 11 }}>{x.l}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Growth trajectory" sub="Follower growth (mock data)" icon={<TrendingUp size={14} />}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="fillGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.acc} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={C.acc} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lineSub} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="followers" stroke={C.acc} strokeWidth={2} fill="url(#fillGrowth)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── Row 4: Best times + Posting cadence ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Section title="Best posting times" sub="Avg engagement by hour" icon={<Clock size={14} />}>
          {hourData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hourData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lineSub} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.t3 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="engagement" fill={C.acc} radius={[3,3,0,0]} name="Engagement" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: C.t3, fontSize: 12, textAlign: 'center', padding: '50px 0' }}>No posted content yet</p>
          )}
        </Section>

        <Section title="Posting cadence" sub="Posts by day of week">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            {dayData.map(({ day, count }, i) => {
              const max = Math.max(...dayData.map(d => d.count), 1);
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: C.t3, fontSize: 12, width: 28, flexShrink: 0 }}>{day}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 99, background: C.bg }}>
                    <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: count > 0 ? C.acc : 'transparent', borderRadius: 99, transition: 'width 0.5s ease', opacity: 0.5 + (count / max) * 0.5 }} />
                  </div>
                  <span style={{ color: C.t3, fontSize: 12, width: 16, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── Row 5: Content type performance + Platform metrics ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Section title="Content type performance" sub="Avg likes by tag" icon={<Hash size={14} />}>
          {tagPerformance.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tagPerformance.map(({ tag, count, avgLikes }) => {
                const max = Math.max(...tagPerformance.map(t => t.avgLikes), 1);
                return (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: C.t2, fontSize: 12, flex: 1, minWidth: 100 }}>{tag}</span>
                    <div style={{ flex: 2, height: 4, borderRadius: 99, background: C.bg }}>
                      <div style={{ 
                        width: `${(avgLikes / max) * 100}%`, 
                        height: '100%', 
                        background: C.acc, 
                        borderRadius: 99,
                        opacity: 0.5 + (avgLikes / max) * 0.5 
                      }} />
                    </div>
                    <span style={{ color: C.t3, fontSize: 11, width: 32, textAlign: 'right' }}>{avgLikes}</span>
                    <span style={{ color: C.t3, fontSize: 10, width: 40, textAlign: 'right' }}>({count} posts)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: C.t3, fontSize: 12, textAlign: 'center', padding: '30px 0' }}>No tagged posts yet</p>
          )}
        </Section>

        <Section title="Platform metrics" sub="Performance by channel">
          {platformMetrics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {platformMetrics.map(p => (
                <div key={p.key} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  padding: '10px 14px',
                  background: C.bg,
                  borderRadius: 6,
                  border: `1px solid ${C.lineSub}`,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ color: C.t2, fontSize: 12, flex: 1 }}>{p.label}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: C.t1, fontSize: 14, fontWeight: 600 }}>{p.avgEngagement}</span>
                    <span style={{ color: C.t3, fontSize: 10 }}>avg eng.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: C.t1, fontSize: 14, fontWeight: 600 }}>{p.totalReach.toLocaleString()}</span>
                    <span style={{ color: C.t3, fontSize: 10 }}>reach</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: C.t3, fontSize: 12, textAlign: 'center', padding: '30px 0' }}>No posts yet</p>
          )}
        </Section>
      </div>

      {/* ── Row 6: Top performing posts ──────────────────────────── */}
      <Section title="Top performing posts" sub="Ranked by engagement (likes + comments × 2)" icon={<Award size={14} />}>
        {topPosts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {topPosts.map((post, idx) => {
              const engagement = (post.likes || 0) + (post.comments || 0) * 2;
              return (
                <div 
                  key={post.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    borderBottom: idx < topPosts.length - 1 ? `1px solid ${C.lineSub}` : 'none',
                  }}
                >
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 6, 
                    background: idx === 0 ? C.acc : C.bg,
                    color: idx === 0 ? '#fff' : C.t2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: C.t2, fontSize: 12, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.content}
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: (C as any)[post.platform] }} />
                      <span style={{ color: C.t3, fontSize: 10 }}>
                        {new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <span style={{ color: C.t3, fontSize: 10 }}>• {post.tags[0]}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: C.t1, fontSize: 16, fontWeight: 600, lineHeight: 1 }}>{post.likes || 0}</div>
                      <div style={{ color: C.t3, fontSize: 10, marginTop: 2 }}>likes</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: C.t1, fontSize: 16, fontWeight: 600, lineHeight: 1 }}>{post.comments || 0}</div>
                      <div style={{ color: C.t3, fontSize: 10, marginTop: 2 }}>comments</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: C.acc, fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{engagement}</div>
                      <div style={{ color: C.t3, fontSize: 10, marginTop: 2 }}>total eng.</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: C.t3, fontSize: 12, textAlign: 'center', padding: '30px 0' }}>No posted content yet</p>
        )}
      </Section>
    </div>
  );
}

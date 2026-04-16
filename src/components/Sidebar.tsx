import { ViewType, BrandProfile } from '../App';
import {
  CalendarDays, Eye, List, BarChart2, Hash, Settings,
  Plus, MessageSquare, X, Zap, Instagram, Facebook, Twitter, Linkedin, LayoutGrid, List as ListIcon, ChevronDown, CalendarClock, ClipboardList
} from 'lucide-react';
import { C } from '../utils/ds';
import type { Post, FeedPlatform, FeedStatusFilter, FeedViewMode } from '../App';
import { useState } from 'react';

interface SidebarProps {
  currentView:  ViewType;
  onViewChange: (v: ViewType) => void;
  onNewPost:    () => void;
  isOpen:       boolean;
  onClose:      () => void;
  brandProfile: BrandProfile;
  feedPlatform: FeedPlatform;
  setFeedPlatform: (p: FeedPlatform) => void;
  feedStatus: FeedStatusFilter;
  setFeedStatus: (s: FeedStatusFilter) => void;
  feedViewMode: FeedViewMode;
  setFeedViewMode: (m: FeedViewMode) => void;
  posts: Post[];
}

const NAV: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'calendar',   label: 'Calendar',         icon: CalendarDays },
  { view: 'planned',    label: 'Planned',           icon: ClipboardList },
  { view: 'feed',       label: 'Feed Preview',      icon: Eye },
  { view: 'list',       label: 'Post Queue',        icon: List },
  { view: 'scheduling', label: 'Scheduling',        icon: CalendarClock },
  { view: 'autodms',    label: 'Auto DMs',          icon: MessageSquare },
  { view: 'analytics',  label: 'Analytics',         icon: BarChart2 },
  { view: 'hashtags',   label: 'Hashtag Manager',   icon: Hash },
  { view: 'settings',   label: 'Brand Settings',    icon: Settings },
];

const W = 228;

export function Sidebar({ currentView, onViewChange, onNewPost, isOpen, onClose, brandProfile, feedPlatform, setFeedPlatform, feedStatus, setFeedStatus, feedViewMode, setFeedViewMode, posts }: SidebarProps) {
  const [isFeedSubMenuOpen, setIsFeedSubMenuOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-250 ease-out`}
        style={{ width: W, background: C.sb }}
      >
        {/* Wordmark */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 18px',
          borderBottom: `1px solid ${C.line}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, background: C.acc,
              borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ color: C.sbText, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Social Scheduler
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.sbMuted, lineHeight: 0, padding: 4 }}>
            <X size={14} />
          </button>
        </div>

        {/* New Post */}
        <div style={{ padding: '14px 12px 4px' }}>
          <button
            onClick={() => { onNewPost(); onClose(); }}
            className="w-full flex items-center justify-center gap-2"
            style={{
              background: C.acc, border: 'none', color: '#fff',
              borderRadius: 8, height: 36, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.01em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = C.accHov}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = C.acc}
          >
            <Plus size={14} strokeWidth={2.5} />
            New Post
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {NAV.map(({ view, label, icon: Icon }) => {
            const active = currentView === view;
            const hasFeedSubmenu = view === 'feed';
            return (
              <div key={view}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { onViewChange(view); onClose(); }}
                    className="w-full flex items-center gap-2.5"
                    style={{
                      height: 36, padding: '0 10px',
                      borderRadius: 7, marginBottom: 1,
                      cursor: 'pointer', textAlign: 'left', border: 'none',
                      background: active ? C.sbAct : 'transparent',
                      color: active ? C.acc : C.sbMuted,
                      transition: 'all 0.12s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.sbHov; if (!active) (e.currentTarget as HTMLElement).style.color = C.sbText; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; if (!active) (e.currentTarget as HTMLElement).style.color = C.sbMuted; }}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span style={{
                        position: 'absolute', left: 0, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 2, height: 16, background: C.acc, borderRadius: 99,
                      }} />
                    )}
                    <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{label}</span>
                    {view === 'autodms' && (
                      <span style={{
                        marginLeft: 'auto', background: C.acc, color: '#fff',
                        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        New
                      </span>
                    )}
                  </button>

                  {/* Chevron toggle for Feed Preview */}
                  {hasFeedSubmenu && active && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsFeedSubMenuOpen(!isFeedSubMenuOpen); 
                      }}
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        lineHeight: 0,
                        color: C.acc,
                        borderRadius: 4,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.sbHov}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                    >
                      <ChevronDown 
                        size={13} 
                        style={{ 
                          transition: 'transform 0.2s',
                          transform: isFeedSubMenuOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                        }} 
                      />
                    </button>
                  )}
                </div>

                {/* Feed Preview Submenu */}
                {view === 'feed' && active && isFeedSubMenuOpen && (
                  <div 
                    style={{ 
                      paddingLeft: 12, 
                      marginTop: 4, 
                      marginBottom: 8,
                      overflow: 'hidden',
                      animation: 'slideDown 0.2s ease-out'
                    }}
                  >
                    <style>{`
                      @keyframes slideDown {
                        from {
                          opacity: 0;
                          max-height: 0;
                        }
                        to {
                          opacity: 1;
                          max-height: 500px;
                        }
                      }
                    `}</style>
                    {/* Platform filters */}
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ color: C.sbMuted, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px', marginBottom: 6 }}>
                        Platform
                      </p>
                      {[
                        { platform: 'instagram' as const, icon: Instagram, label: 'Instagram' },
                        { platform: 'facebook' as const, icon: Facebook, label: 'Facebook' },
                        { platform: 'twitter' as const, icon: Twitter, label: 'Twitter' },
                        { platform: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn' },
                      ].map(({ platform, icon: PIcon, label: pLabel }) => {
                        const isActive = feedPlatform === platform;
                        const count = posts.filter(p => p.platform === platform).length;
                        const color = (C as any)[platform];
                        return (
                          <button
                            key={platform}
                            onClick={() => setFeedPlatform(platform)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              height: 28,
                              padding: '0 10px',
                              borderRadius: 6,
                              marginBottom: 1,
                              cursor: 'pointer',
                              textAlign: 'left',
                              border: 'none',
                              background: isActive ? C.sbHov : 'transparent',
                              color: isActive ? C.sbText : C.sbMuted,
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.sbHov; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? color : C.sbMuted, flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
                            <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, flex: 1 }}>{pLabel}</span>
                            <span style={{ fontSize: 10, color: C.sbMuted }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Status filters */}
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ color: C.sbMuted, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px', marginBottom: 6 }}>
                        Status
                      </p>
                      {[
                        { status: 'all' as const, label: 'All Posts', color: C.sbMuted },
                        { status: 'scheduled' as const, label: 'Scheduled', color: C.scheduled },
                        { status: 'draft' as const, label: 'Drafts', color: C.draft },
                        { status: 'posted' as const, label: 'Published', color: C.published },
                      ].map(({ status, label: sLabel, color }) => {
                        const isActive = feedStatus === status;
                        const count = status === 'all' 
                          ? posts.filter(p => p.platform === feedPlatform).length 
                          : posts.filter(p => p.platform === feedPlatform && p.status === status).length;
                        return (
                          <button
                            key={status}
                            onClick={() => setFeedStatus(status)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              height: 28,
                              padding: '0 10px',
                              borderRadius: 6,
                              marginBottom: 1,
                              cursor: 'pointer',
                              textAlign: 'left',
                              border: 'none',
                              background: isActive ? C.sbHov : 'transparent',
                              color: isActive ? C.sbText : C.sbMuted,
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.sbHov; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? color : C.sbMuted, flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
                            <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, flex: 1 }}>{sLabel}</span>
                            <span style={{ fontSize: 10, color: C.sbMuted }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* View mode - only for Instagram */}
                    {feedPlatform === 'instagram' && (
                      <div>
                        <p style={{ color: C.sbMuted, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px', marginBottom: 6 }}>
                          View
                        </p>
                        {[
                          { mode: 'feed' as const, icon: ListIcon, label: 'Feed' },
                          { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
                        ].map(({ mode, icon: MIcon, label: mLabel }) => {
                          const isActive = feedViewMode === mode;
                          return (
                            <button
                              key={mode}
                              onClick={() => setFeedViewMode(mode)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                                height: 28,
                                padding: '0 10px',
                                borderRadius: 6,
                                marginBottom: 1,
                                cursor: 'pointer',
                                textAlign: 'left',
                                border: 'none',
                                background: isActive ? C.sbHov : 'transparent',
                                color: isActive ? C.sbText : C.sbMuted,
                                transition: 'all 0.12s',
                              }}
                              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.sbHov; }}
                              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <MIcon size={11} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                              <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400 }}>{mLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Profile */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              className={`bg-gradient-to-br ${brandProfile.avatarGradient} flex-shrink-0`}
              style={{ width: 28, height: 28, borderRadius: '50%' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.sbText, fontSize: 12, fontWeight: 500, lineHeight: 1.25 }} className="truncate">
                {brandProfile.name}
              </p>
              <p style={{ color: C.sbMuted, fontSize: 11, marginTop: 1 }} className="truncate">
                @{brandProfile.handle}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
              <span style={{ color: C.sbMuted, fontSize: 10 }}>Live</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
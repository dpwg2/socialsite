import { useState, useEffect, useRef } from 'react';
import {
  loadPosts, savePosts, loadGroups, saveGroups, loadBrand, saveBrand,
  loadFolders, saveFolders,
  loadPostsFromSupabase, syncPostsToSupabase,
  loadGroupsFromSupabase, syncGroupsToSupabase,
  loadBrandFromSupabase, syncBrandToSupabase,
  loadFoldersFromSupabase, syncFoldersToSupabase,
} from './utils/storage';
import { Calendar } from './components/Calendar';
import { PostCreator } from './components/PostCreator';
import { FeedPreview } from './components/FeedPreview';
import { ScheduledPosts } from './components/ScheduledPosts';
import { Analytics } from './components/Analytics';
import { HashtagManager } from './components/HashtagManager';
import { BrandSettings } from './components/BrandSettings';
import { AutoDMs } from './components/AutoDMs';
import { SchedulingView } from './components/SchedulingView';
import { PlannedView } from './components/PlannedView';
import { Sidebar } from './components/Sidebar';
import { Menu, Plus } from 'lucide-react';
import { Toaster } from 'sonner@2.0.3';
import { C } from './utils/ds';

export interface Post {
  id: string;
  content: string;
  image?: string;
  scheduledDate: Date;
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin';
  status: 'draft' | 'scheduled' | 'posted';
  tags?: string[];
  firstComment?: string;
  notes?: string;
  // Mock engagement metrics
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
  saves?: number;
  // Carousel grouping — posts sharing the same carouselId render as one swipeable post
  carouselId?: string;
  // Folder organisation
  folderId?: string;
  // Lock — prevents drag reorder
  locked?: boolean;
  // Planned queue order (lower = earlier in queue)
  planOrder?: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
}

export interface HashtagGroup {
  id: string;
  name: string;
  hashtags: string[];
  color: string;
}

export interface BrandProfile {
  name: string;
  handle: string;
  bio: string;
  website: string;
  followers: string;
  following: string;
  avatarGradient: string;
}

export type ViewType = 'calendar' | 'feed' | 'list' | 'scheduling' | 'planned' | 'analytics' | 'hashtags' | 'settings' | 'autodms';

export type FeedPlatform = 'instagram' | 'twitter' | 'facebook' | 'linkedin';
export type FeedStatusFilter = 'all' | 'scheduled' | 'draft' | 'posted';
export type FeedViewMode = 'feed' | 'grid';

const VIEW_LABEL: Record<ViewType, string> = {
  calendar:   'Calendar',
  feed:       'Feed Preview',
  list:       'Post Queue',
  scheduling: 'Scheduling',
  planned:    'Planned',
  analytics:  'Analytics',
  hashtags:   'Hashtag Manager',
  settings:   'Brand Settings',
  autodms:    'Auto DMs',
};

const defaultBrand: BrandProfile = {
  name: 'BuildRight Co.',
  handle: 'buildright_co',
  bio: '🏗️ Building & renovation specialists | Sydney, Australia | Transforming homes since 2005',
  website: 'www.buildright.com.au',
  followers: '2,431',
  following: '518',
  avatarGradient: 'from-orange-500 to-amber-400',
};

const defaultHashtagGroups: HashtagGroup[] = [
  { id: '1', name: 'General Building',   color: 'orange', hashtags: ['#building','#construction','#architecture','#design','#homes','#buildingaustralia','#newbuild'] },
  { id: '2', name: 'Interior Design',    color: 'pink',   hashtags: ['#interiordesign','#homedecor','#renovation','#modernhome','#interiorinspiration','#homestyling','#australianhomes'] },
  { id: '3', name: 'Plumbing & Services',color: 'blue',   hashtags: ['#plumbing','#plumber','#plumbinglife','#waterwise','#qualityplumbing','#sydneyplumber'] },
  { id: '4', name: 'Sustainability',     color: 'green',  hashtags: ['#sustainablebuild','#ecodesign','#greenbuild','#energyefficient','#sustainableliving','#greenbuilding'] },
  { id: '5', name: 'Sydney Real Estate', color: 'purple', hashtags: ['#sydneyhomes','#sydneyrealestate','#sydney','#nswproperty','#sydneyliving','#sydneybuilders'] },
];


export default function App() {
  const [posts,   setPosts]   = useState<Post[]>(loadPosts);
  const [view,    setView]    = useState<ViewType>('calendar');
  const [creator, setCreator] = useState(false);
  const [editing, setEditing] = useState<Post | undefined>();
  const [prefill, setPrefill] = useState<Partial<Post> | undefined>();
  const [sbOpen,  setSbOpen]  = useState(false);
  const [groups,  setGroups]  = useState<HashtagGroup[]>(() => loadGroups(defaultHashtagGroups));
  const [brand,   setBrand]   = useState<BrandProfile>(() => loadBrand(defaultBrand));
  const [folders, setFolders] = useState<Folder[]>(loadFolders);
  const [syncing, setSyncing] = useState(true);

  // Ref guards so Supabase sync effects don't fire before initial remote load
  const sbReady = useRef(false);

  // On mount: load remote state from Supabase; seed Supabase from localStorage if empty
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const localPosts = loadPosts();
        const [remotePosts, remoteGroups, remoteBrand, remoteFolders] = await Promise.all([
          loadPostsFromSupabase(),
          loadGroupsFromSupabase(defaultHashtagGroups),
          loadBrandFromSupabase(defaultBrand),
          loadFoldersFromSupabase(),
        ]);
        if (cancelled) return;

        if (remotePosts.length === 0 && localPosts.length > 0) {
          // First-time seed: push localStorage data to Supabase
          await syncPostsToSupabase(localPosts);
          setPosts(localPosts);
        } else {
          setPosts(remotePosts);
          savePosts(remotePosts);
        }
        setGroups(remoteGroups);
        setBrand(remoteBrand);
        setFolders(remoteFolders);
        saveFolders(remoteFolders);
      } catch (e) {
        console.error('Supabase init error:', e);
      } finally {
        if (!cancelled) {
          sbReady.current = true;
          setSyncing(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist to localStorage immediately; sync to Supabase after init
  useEffect(() => { savePosts(posts); if (sbReady.current) syncPostsToSupabase(posts); },     [posts]);
  useEffect(() => { saveGroups(groups); if (sbReady.current) syncGroupsToSupabase(groups); }, [groups]);
  useEffect(() => { saveBrand(brand); if (sbReady.current) syncBrandToSupabase(brand); },     [brand]);
  useEffect(() => { saveFolders(folders); if (sbReady.current) syncFoldersToSupabase(folders); }, [folders]);

  // Feed Preview filter state
  const [feedPlatform, setFeedPlatform] = useState<FeedPlatform>('instagram');
  const [feedStatus, setFeedStatus] = useState<FeedStatusFilter>('all');
  const [feedViewMode, setFeedViewMode] = useState<FeedViewMode>('feed');

  const closeCreator = () => { setCreator(false); setEditing(undefined); setPrefill(undefined); };
  const openNew  = (p?: Partial<Post>) => { setEditing(undefined); setPrefill(p); setCreator(true); };
  const openEdit = (p: Post)           => { setEditing(p); setPrefill(undefined); setCreator(true); };

  const addPost  = (d: Omit<Post,'id'>) => { setPosts(p => [...p, { ...d, id: Date.now().toString() }]); closeCreator(); };
  const updPost  = (p: Post)            => { setPosts(all => all.map(x => x.id === p.id ? p : x)); closeCreator(); };
  const delPost  = (id: string)         => setPosts(p => p.filter(x => x.id !== id));
  const dupPost  = (p: Post)            => setPosts(all => [...all, { ...p, id: Date.now().toString(), status: 'draft' }]);

  const SB_W = 228;

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff', border: `1px solid ${C.line}`, color: C.t1,
            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            fontSize: 13, padding: '11px 14px',
          },
        }}
      />

      <Sidebar
        currentView={view}
        onViewChange={v => { setView(v); setSbOpen(false); }}
        onNewPost={() => openNew()}
        isOpen={sbOpen}
        onClose={() => setSbOpen(false)}
        brandProfile={brand}
        feedPlatform={feedPlatform}
        setFeedPlatform={setFeedPlatform}
        feedStatus={feedStatus}
        setFeedStatus={setFeedStatus}
        feedViewMode={feedViewMode}
        setFeedViewMode={setFeedViewMode}
        posts={posts}
      />

      <div className="flex-1 flex flex-col min-w-0" id="main">
        <style>{`@media(min-width:1024px){#main{margin-left:${SB_W}px}}`}</style>

        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(245,245,247,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.line}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSbOpen(true)}
              className="lg:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t2, lineHeight: 0, padding: 4, borderRadius: 6 }}
            >
              <Menu size={18} />
            </button>
            <span style={{ color: C.t1, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {VIEW_LABEL[view]}
            </span>
            {syncing && (
              <span style={{ fontSize: 11, color: C.t3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.acc, display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
                Syncing…
              </span>
            )}
          </div>

          <button
            onClick={() => openNew()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 14px',
              background: C.acc, border: 'none', color: '#fff',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = C.accHov}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = C.acc}
          >
            <Plus size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Post</span>
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 24px 64px', minWidth: 0 }} className="enter">
          {view === 'calendar'  && <Calendar posts={posts} onEditPost={openEdit} onDeletePost={delPost} onCreateFromIdea={openNew} />}
          {view === 'feed'      && <FeedPreview posts={posts} onEditPost={openEdit} onDeletePost={delPost} onUpdatePost={updPost} brandProfile={brand} feedPlatform={feedPlatform} setFeedPlatform={setFeedPlatform} feedStatus={feedStatus} setFeedStatus={setFeedStatus} feedViewMode={feedViewMode} setFeedViewMode={setFeedViewMode} />}
          {view === 'list'      && <ScheduledPosts posts={posts} onEditPost={openEdit} onDeletePost={delPost} onDuplicatePost={dupPost} />}
          {view === 'scheduling' && <SchedulingView posts={posts} onUpdatePost={updPost} folders={folders} onUpdateFolders={setFolders} />}
          {view === 'planned'    && <PlannedView posts={posts} onUpdatePost={updPost} onEditPost={openEdit} onDeletePost={delPost} />}
          {view === 'analytics' && <Analytics posts={posts} />}
          {view === 'hashtags'  && <HashtagManager hashtagGroups={groups} onAddGroup={g => setGroups(p => [...p, { ...g, id: Date.now().toString() }])} onUpdateGroup={g => setGroups(p => p.map(x => x.id === g.id ? g : x))} onDeleteGroup={id => setGroups(p => p.filter(g => g.id !== id))} />}
          {view === 'settings'  && <BrandSettings brandProfile={brand} onUpdateBrandProfile={setBrand} />}
          {view === 'autodms'   && <AutoDMs />}
        </main>
      </div>

      {creator && (
        <PostCreator
          post={editing}
          prefill={prefill}
          hashtagGroups={groups}
          onSave={editing ? updPost : addPost}
          onClose={closeCreator}
        />
      )}
    </div>
  );
}
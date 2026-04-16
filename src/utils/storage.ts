import { Post, HashtagGroup, BrandProfile, Folder } from '../App';
import { supabase } from './supabase/client';

const KEYS = {
  posts:   'smcm_posts',
  groups:  'smcm_groups',
  brand:   'smcm_brand',
  folders: 'smcm_folders',
} as const;

// ── localStorage ─────────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function loadPosts(): Post[] {
  return get<Post[]>(KEYS.posts, []).map(p => ({
    ...p,
    scheduledDate: new Date(p.scheduledDate),
  }));
}

export function savePosts(posts: Post[]): void {
  set(KEYS.posts, posts);
}

export function loadGroups<T>(fallback: T): T {
  return get(KEYS.groups, fallback);
}

export function saveGroups<T>(groups: T): void {
  set(KEYS.groups, groups);
}

export function loadBrand<T>(fallback: T): T {
  return get(KEYS.brand, fallback);
}

export function saveBrand<T>(brand: T): void {
  set(KEYS.brand, brand);
}

export function loadFolders(): Folder[] {
  return get<Folder[]>(KEYS.folders, []);
}

export function saveFolders(folders: Folder[]): void {
  set(KEYS.folders, folders);
}

// ── Row converters ────────────────────────────────────────────────────────────

function postToRow(p: Post) {
  return {
    id:             p.id,
    content:        p.content,
    image:          p.image ?? null,
    scheduled_date: p.scheduledDate.toISOString(),
    platform:       p.platform,
    status:         p.status,
    tags:           p.tags ?? [],
    first_comment:  p.firstComment ?? null,
    notes:          p.notes ?? null,
    likes:          p.likes ?? null,
    comments:       p.comments ?? null,
    shares:         p.shares ?? null,
    reach:          p.reach ?? null,
    saves:          p.saves ?? null,
    carousel_id:    p.carouselId ?? null,
    folder_id:      p.folderId ?? null,
    locked:         p.locked ?? false,
    plan_order:     p.planOrder ?? null,
  };
}

function rowToPost(row: Record<string, unknown>): Post {
  return {
    id:            row.id as string,
    content:       row.content as string,
    image:         (row.image as string) ?? undefined,
    scheduledDate: new Date(row.scheduled_date as string),
    platform:      row.platform as Post['platform'],
    status:        row.status as Post['status'],
    tags:          (row.tags as string[]) ?? [],
    firstComment:  (row.first_comment as string) ?? undefined,
    notes:         (row.notes as string) ?? undefined,
    likes:         (row.likes as number) ?? undefined,
    comments:      (row.comments as number) ?? undefined,
    shares:        (row.shares as number) ?? undefined,
    reach:         (row.reach as number) ?? undefined,
    saves:         (row.saves as number) ?? undefined,
    carouselId:    (row.carousel_id as string) ?? undefined,
    folderId:      (row.folder_id as string) ?? undefined,
    locked:        (row.locked as boolean) ?? false,
    planOrder:     (row.plan_order as number) ?? undefined,
  };
}

// ── Supabase — posts ──────────────────────────────────────────────────────────

export async function loadPostsFromSupabase(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('scheduled_date');
  if (error) {
    console.error('Supabase loadPosts:', error.message);
    return [];
  }
  return (data ?? []).map(rowToPost);
}

export async function syncPostsToSupabase(posts: Post[]): Promise<void> {
  // Upsert all current posts
  if (posts.length > 0) {
    const { error } = await supabase.from('posts').upsert(posts.map(postToRow));
    if (error) { console.error('Supabase syncPosts upsert:', error.message); return; }
  }
  // Delete rows that no longer exist locally
  const { data: existing } = await supabase.from('posts').select('id');
  const currentIds = new Set(posts.map(p => p.id));
  const toDelete = (existing ?? []).map(r => r.id as string).filter(id => !currentIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from('posts').delete().in('id', toDelete);
  }
}

// ── Supabase — hashtag groups ─────────────────────────────────────────────────

export async function loadGroupsFromSupabase(fallback: HashtagGroup[]): Promise<HashtagGroup[]> {
  const { data, error } = await supabase.from('hashtag_groups').select('*');
  if (error) { console.error('Supabase loadGroups:', error.message); return fallback; }
  if (!data || data.length === 0) return fallback;
  return data.map(r => ({
    id:       r.id as string,
    name:     r.name as string,
    hashtags: (r.hashtags as string[]) ?? [],
    color:    r.color as string,
  }));
}

export async function syncGroupsToSupabase(groups: HashtagGroup[]): Promise<void> {
  if (groups.length > 0) {
    const { error } = await supabase.from('hashtag_groups').upsert(groups);
    if (error) { console.error('Supabase syncGroups upsert:', error.message); return; }
  }
  const { data: existing } = await supabase.from('hashtag_groups').select('id');
  const currentIds = new Set(groups.map(g => g.id));
  const toDelete = (existing ?? []).map(r => r.id as string).filter(id => !currentIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from('hashtag_groups').delete().in('id', toDelete);
  }
}

// ── Supabase — brand profile ──────────────────────────────────────────────────

export async function loadBrandFromSupabase(fallback: BrandProfile): Promise<BrandProfile> {
  const { data, error } = await supabase
    .from('brand_profile')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) { console.error('Supabase loadBrand:', error.message); return fallback; }
  if (!data) return fallback;
  return {
    name:           data.name as string,
    handle:         data.handle as string,
    bio:            data.bio as string,
    website:        data.website as string,
    followers:      data.followers as string,
    following:      data.following as string,
    avatarGradient: data.avatar_gradient as string,
  };
}

export async function syncBrandToSupabase(brand: BrandProfile): Promise<void> {
  const { error } = await supabase.from('brand_profile').upsert({
    id:              1,
    name:            brand.name,
    handle:          brand.handle,
    bio:             brand.bio,
    website:         brand.website,
    followers:       brand.followers,
    following:       brand.following,
    avatar_gradient: brand.avatarGradient,
  });
  if (error) console.error('Supabase syncBrand:', error.message);
}

// ── Supabase — folders ────────────────────────────────────────────────────────

export async function loadFoldersFromSupabase(): Promise<Folder[]> {
  const { data, error } = await supabase.from('folders').select('*');
  if (error) { console.error('Supabase loadFolders:', error.message); return []; }
  return (data ?? []).map(r => ({ id: r.id as string, name: r.name as string, color: r.color as string }));
}

export async function syncFoldersToSupabase(folders: Folder[]): Promise<void> {
  if (folders.length > 0) {
    const { error } = await supabase.from('folders').upsert(folders);
    if (error) { console.error('Supabase syncFolders upsert:', error.message); return; }
  }
  const { data: existing } = await supabase.from('folders').select('id');
  const currentIds = new Set(folders.map(f => f.id));
  const toDelete = (existing ?? []).map(r => r.id as string).filter(id => !currentIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from('folders').delete().in('id', toDelete);
  }
}

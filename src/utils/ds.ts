/**
 * Design System — single source of truth
 *
 * Rules:
 *  1. Purple appears only: sidebar bg, primary buttons, active-state indicator.
 *  2. No coloured backgrounds in content area — white or bg only.
 *  3. Status = coloured dot, no pill background.
 *  4. One border-radius: 8px. One shadow: card.
 *  5. Text is neutral zinc — zero purple tint.
 */

export const C = {
  // ── Shell ────────────────────────────────────────────────
  bg:      '#F5F5F7',   // light grey shell
  surface: '#FFFFFF',   // all cards / panels

  // ── Borders ──────────────────────────────────────────────
  line:    '#E8E8ED',   // standard divider / border
  lineSub: '#F2F2F7',   // very subtle inner separator

  // ── Text — pure neutral zinc, zero purple ───────────────
  t1: '#111116',   // headings / primary
  t2: '#6B7280',   // body / secondary
  t3: '#9CA3AF',   // muted / disabled / meta

  // ── Accent — violet, used sparingly ─────────────────────
  acc:     '#7C3AED',   // buttons, active indicator
  accHov:  '#6D28D9',   // button hover
  accFill: '#F5F3FF',   // barely-there tint for active bg ONLY

  // ── Sidebar ──────────────────────────────────────────────
  sb:      '#FAFAFA',   // light grey — premium light aesthetic
  sbHov:   'rgba(0,0,0,0.04)',
  sbAct:   '#F5F3FF',   // subtle purple tint for active
  sbText:  '#111116',
  sbMuted: '#6B7280',

  // ── Status dots (never use as bg) ────────────────────────
  scheduled: '#7C3AED',
  published: '#16A34A',
  draft:     '#9CA3AF',

  // ── Semantic — only for dot colour or text, not bg ───────
  green:  '#16A34A',
  orange: '#D97706',
  red:    '#DC2626',
  blue:   '#2563EB',

  // ── Platform ─────────────────────────────────────────────
  instagram: '#E1306C',
  twitter:   '#1D9BF0',
  facebook:  '#1877F2',
  linkedin:  '#0A66C2',
} as const;

export const platLabel: Record<string, string> = {
  instagram: 'Instagram',
  twitter:   'X / Twitter',
  facebook:  'Facebook',
  linkedin:  'LinkedIn',
};

// ── One shadow value ──────────────────────────────────────
export const card  = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
export const modal = '0 8px 40px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08)';

// ── Shared primitive styles ───────────────────────────────
export const inp: React.CSSProperties = {
  width: '100%', background: C.surface, border: `1px solid ${C.line}`,
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.t1,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};
export const lbl: React.CSSProperties = {
  display: 'block', color: C.t2, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 6,
};
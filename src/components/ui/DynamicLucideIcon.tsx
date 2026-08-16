import * as LucideIcons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

// Phase 20 — Dynamic Lucide icon renderer.
//
// Server-renderable on purpose: NO 'use client' directive. The public
// renderers under (public)/ are all server components (Phase 18 ISR),
// and this needs to render inside them without forcing a client
// boundary. Inline-imports the full Lucide namespace once per server
// instance; the actual JS payload sent to the browser is just the
// resolved SVG markup, since server components don't ship JS to the
// client.
//
// Lucide@0.546.x exports each icon twice (`Foo` and `FooIcon` alias),
// so the resolver tries the bare name first, then the `Icon` suffix
// form, and finally a HelpCircle fallback. PascalCase names are the
// only convention the resolver recognises — admin helper text in
// IconInputField documents this for editors.

const lib = LucideIcons as unknown as Record<string, LucideIcon | undefined>;

// lucide-react also exports a GENERIC `Icon` factory alongside the real
// icons. It is not renderable on its own — it maps over a required
// `iconNode` prop and throws "Cannot read properties of undefined
// (reading 'map')" without one.
//
// That made an empty icon name crash the whole page: `${''}Icon`
// resolves to exactly that generic export, so the lookup succeeded and
// never reached the HelpCircle fallback. Adding a blank card in the
// contact-page admin editor was enough to take the page down. These
// names must never resolve.
const NON_ICON_EXPORTS = new Set(['Icon', 'createLucideIcon', 'icons']);

function resolveIcon(name: unknown): LucideIcon | undefined {
  const key = typeof name === 'string' ? name.trim() : '';
  if (!key || NON_ICON_EXPORTS.has(key)) return undefined;
  // With a non-empty key that isn't 'Icon' itself, `${key}Icon` can no
  // longer collide with the generic export.
  return lib[key] ?? lib[`${key}Icon`];
}

export function DynamicLucideIcon({
  name,
  ...rest
}: { name: string } & LucideProps) {
  const Icon = resolveIcon(name) ?? LucideIcons.HelpCircle;
  return <Icon {...rest} />;
}

// Used by IconInputField for live validation feedback.
export function hasIcon(name: string): boolean {
  return resolveIcon(name) != null;
}

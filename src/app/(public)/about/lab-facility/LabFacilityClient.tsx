'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, MapPin, Users, Cpu, AppWindow, BookOpen } from 'lucide-react';
import Container from '@/components/ui/Container';

// Public Lab shape — matches the select() in getLabs() (identity.ts).
type LabRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  roomNo: string | null;
  capacity: number | null;
  majorEquipment: string | null;
  software: string | null;
  coursesSupported: string | null;
  heroImageUrl: string | null;
  gallery: string[];
};

// Newline-separated plain text → clean list, dropping blank lines.
function toLines(v: string | null): string[] {
  if (!v) return [];
  return v.split('\n').map((s) => s.trim()).filter(Boolean);
}

type Props = {
  labs: readonly LabRow[];
};

export default function LabFacilityClient({ labs }: Props) {
  // Defensive: empty seed/admin-purge guard. If no labs exist, show
  // a friendly empty state rather than crashing on labs[0].
  const [activeSlug, setActiveSlug] = useState<string | null>(
    labs.length > 0 ? labs[0].slug : null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const active = labs.find((l) => l.slug === activeSlug) ?? labs[0] ?? null;
  const majorEquipment = active ? toLines(active.majorEquipment) : [];
  const software = active ? toLines(active.software) : [];
  const coursesSupported = active ? toLines(active.coursesSupported) : [];

  // On mount and on hashchange, sync the selected lab with the URL hash
  // so /about/lab-facility#fluid-mechanics-lab opens the right card.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && labs.some((l) => l.slug === hash)) {
        setActiveSlug(hash);
      }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [labs]);

  const selectLab = (slug: string) => {
    setActiveSlug(slug);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${slug}`);
    }
  };

  if (!active) {
    return (
      <Container>
        <p className="text-center text-gray-500 py-12">
          No laboratories yet. Add one in <code className="font-mono">/admin/lab-facility</code>.
        </p>
      </Container>
    );
  }

  return (
    <Container>
      {/* Mobile — current selection dropdown */}
      <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-expanded={mobileMenuOpen}
          className="w-full px-5 py-4 flex items-center justify-between text-left"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-primary mb-1">
              Current Selection
            </p>
            <p className="text-base font-bold text-gray-900 truncate">
              {active.name}
            </p>
          </div>
          <ChevronDown
            size={20}
            className={`text-gray-400 shrink-0 ml-3 transition-transform ${
              mobileMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 p-3">
            <h3 className="px-2 pb-2 text-[11px] font-bold tracking-[0.25em] uppercase text-gray-500">
              Laboratories
            </h3>
            <ul className="space-y-1">
              {labs.map((lab) => {
                const isActive = lab.slug === activeSlug;
                return (
                  <li key={lab.slug}>
                    <button
                      type="button"
                      onClick={() => selectLab(lab.slug)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-700 hover:bg-accent/5 hover:text-accent'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-button-yellow' : 'bg-gray-300'
                        }`}
                      />
                      <span className="flex-1">{lab.name}</span>
                      {isActive && (
                        <ChevronRight size={14} className="opacity-80" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar — lab list (desktop only) */}
        <aside className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:sticky lg:top-32 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <h3 className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.25em] uppercase text-gray-500 border-b border-gray-100 mb-2">
            Laboratories
          </h3>
          <ul className="space-y-1">
            {labs.map((lab) => {
              const isActive = lab.slug === activeSlug;
              return (
                <li key={lab.slug}>
                  <button
                    type="button"
                    onClick={() => selectLab(lab.slug)}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-700 hover:bg-accent/5 hover:text-accent'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-button-yellow' : 'bg-gray-300'
                      }`}
                    />
                    <span className="flex-1">{lab.name}</span>
                    {isActive && <ChevronRight size={14} className="opacity-80" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main — selected lab detail */}
        <article
          key={active.slug}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10"
        >
          <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-md mb-4">
            Laboratory
          </span>

          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary leading-tight mb-3">
            {active.name}
          </h2>

          <p className="text-base md:text-lg text-accent font-medium mb-6">{active.tagline}</p>

          <p className="text-[15px] md:text-base text-gray-700 leading-[1.85] mb-8">
            {active.description}
          </p>

          {(active.roomNo || active.capacity) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-[13.5px]">
              {active.roomNo && (
                <span className="inline-flex items-center gap-1.5 text-gray-600">
                  <MapPin size={14} className="text-accent" />
                  Room {active.roomNo}
                </span>
              )}
              {active.capacity != null && (
                <span className="inline-flex items-center gap-1.5 text-gray-600">
                  <Users size={14} className="text-accent" />
                  Capacity: {active.capacity} students
                </span>
              )}
            </div>
          )}

          {(majorEquipment.length > 0 || software.length > 0 || coursesSupported.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-6 mb-8 bg-gray-50 rounded-xl p-5 md:p-6">
              {majorEquipment.length > 0 && (
                <div>
                  <h3 className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-primary mb-3">
                    <Cpu size={15} className="text-accent" />
                    Major Equipment
                  </h3>
                  <ul className="space-y-1.5">
                    {majorEquipment.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[13.5px] text-gray-700 leading-relaxed">
                        <span className="mt-2 w-1 h-1 rounded-full bg-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {software.length > 0 && (
                <div>
                  <h3 className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-primary mb-3">
                    <AppWindow size={15} className="text-accent" />
                    Software
                  </h3>
                  <ul className="space-y-1.5">
                    {software.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[13.5px] text-gray-700 leading-relaxed">
                        <span className="mt-2 w-1 h-1 rounded-full bg-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {coursesSupported.length > 0 && (
                <div className="sm:col-span-2">
                  <h3 className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-primary mb-3">
                    <BookOpen size={15} className="text-accent" />
                    Courses Supported
                  </h3>
                  <ul className="space-y-1.5">
                    {coursesSupported.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[13.5px] text-gray-700 leading-relaxed">
                        <span className="mt-2 w-1 h-1 rounded-full bg-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {active.heroImageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-100 mb-8">
              <Image
                src={active.heroImageUrl}
                alt={active.name}
                width={1200}
                height={750}
                sizes="(min-width: 1024px) 800px, 100vw"
                className="block w-full h-auto"
              />
            </div>
          )}

          {active.gallery.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold text-primary mb-4">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {active.gallery.map((src) => (
                  <div
                    key={src}
                    className="relative rounded-lg overflow-hidden border border-gray-100 aspect-[4/3] bg-gray-50"
                  >
                    <Image
                      src={src}
                      alt={`${active.name} gallery image`}
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </Container>
  );
}

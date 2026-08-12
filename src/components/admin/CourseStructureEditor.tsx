'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormSortableList from './FormSortableList';

// Structured editor for ProgramCourseStructure.semesters Json — two
// levels of nesting:
//   Semester (label, coreCredits, electiveCredits, labCredits,
//             projectCredits, totalCredits, cumulativeCredits)
//     └─ courses []
//          └─ Course (code, title, type, credits, isSessional, prerequisite)
//
// Each level uses its own FormSortableList instance so drag-reorder is
// scoped per level (mirrors ShiftsEditor's shifts→groups→tiers
// pattern). Numbers are kept as strings in state for controlled
// inputs; coerced to Number on serialize.

type Course = {
  id: string;
  code: string;
  title: string;
  type: string;
  credits: string;
  isSessional: boolean;
  prerequisite: string;
};
type Semester = {
  id: string;
  label: string;
  coreCredits: string;
  electiveCredits: string;
  labCredits: string;
  projectCredits: string;
  totalCredits: string;
  cumulativeCredits: string;
  courses: Course[];
};

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

function numToStr(v: unknown): string {
  return typeof v === 'number' ? String(v) : typeof v === 'string' ? v : '';
}

function normalize(initial: unknown): Semester[] {
  if (!Array.isArray(initial)) return [];
  return initial
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      id:                genId('sem'),
      label:             typeof s.label === 'string' ? s.label : '',
      coreCredits:       numToStr(s.coreCredits),
      electiveCredits:   numToStr(s.electiveCredits),
      labCredits:        numToStr(s.labCredits),
      projectCredits:    numToStr(s.projectCredits),
      totalCredits:      numToStr(s.totalCredits),
      cumulativeCredits: numToStr(s.cumulativeCredits),
      courses: Array.isArray(s.courses)
        ? (s.courses as unknown[])
            .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
            .map((c) => ({
              id:           genId('crs'),
              code:         typeof c.code === 'string' ? c.code : '',
              title:        typeof c.title === 'string' ? c.title : '',
              type:         typeof c.type === 'string' ? c.type : '',
              credits:      numToStr(c.credits),
              isSessional:  typeof c.isSessional === 'boolean' ? c.isSessional : false,
              prerequisite: typeof c.prerequisite === 'string' ? c.prerequisite : '',
            }))
        : [],
    }));
}

type Props = {
  name: string;
  initialValue: unknown;
};

export default function CourseStructureEditor({ name, initialValue }: Props) {
  const [semesters, setSemesters] = useState<Semester[]>(() => normalize(initialValue));

  // ── Semester mutators ───────────────────────────────────────
  function addSemester() {
    setSemesters([...semesters, {
      id: genId('sem'), label: '', coreCredits: '', electiveCredits: '',
      labCredits: '', projectCredits: '', totalCredits: '', cumulativeCredits: '',
      courses: [],
    }]);
  }
  function removeSemester(semId: string) {
    setSemesters(semesters.filter((s) => s.id !== semId));
  }
  function updateSemester(
    semId: string,
    field: 'label' | 'coreCredits' | 'electiveCredits' | 'labCredits' | 'projectCredits' | 'totalCredits' | 'cumulativeCredits',
    val: string,
  ) {
    setSemesters(semesters.map((s) => (s.id === semId ? { ...s, [field]: val } : s)));
  }
  function reorderSemesters(orderedIds: string[]) {
    setSemesters(orderedIds.map((id) => semesters.find((s) => s.id === id)!));
  }

  // ── Course mutators (scoped to a parent semester) ───────────
  function addCourse(semId: string) {
    setSemesters(semesters.map((s) => s.id === semId
      ? { ...s, courses: [...s.courses, { id: genId('crs'), code: '', title: '', type: '', credits: '', isSessional: false, prerequisite: '' }] }
      : s));
  }
  function removeCourse(semId: string, courseId: string) {
    setSemesters(semesters.map((s) => s.id === semId
      ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
      : s));
  }
  function updateCourse(
    semId: string,
    courseId: string,
    field: 'code' | 'title' | 'type' | 'credits' | 'isSessional' | 'prerequisite',
    val: string | boolean,
  ) {
    setSemesters(semesters.map((s) => s.id === semId
      ? { ...s, courses: s.courses.map((c) => (c.id === courseId ? { ...c, [field]: val } : c)) }
      : s));
  }
  function reorderCourses(semId: string, orderedIds: string[]) {
    setSemesters(semesters.map((s) => {
      if (s.id !== semId) return s;
      return { ...s, courses: orderedIds.map((id) => s.courses.find((c) => c.id === id)!) };
    }));
  }

  // ── Serialize (strip local ids; coerce numeric fields) ──────
  const serializable = semesters.map((s) => ({
    label:             s.label,
    coreCredits:       Number(s.coreCredits)       || 0,
    electiveCredits:   Number(s.electiveCredits)   || 0,
    labCredits:        Number(s.labCredits)        || 0,
    projectCredits:    Number(s.projectCredits)    || 0,
    totalCredits:      Number(s.totalCredits)      || 0,
    cumulativeCredits: Number(s.cumulativeCredits) || 0,
    courses: s.courses.map((c) => ({
      code:         c.code,
      title:        c.title,
      type:         c.type,
      credits:      Number(c.credits) || 0,
      isSessional:  c.isSessional,
      prerequisite: c.prerequisite,
    })),
  }));

  return (
    <div className="space-y-3">
      {semesters.length === 0 && (
        <p className="text-xs text-gray-500 italic">No semesters yet.</p>
      )}
      <FormSortableList
        items={semesters}
        getId={(s) => s.id}
        onReorder={reorderSemesters}
        renderItem={(semester) => (
          <SemesterCard
            semester={semester}
            onUpdate={(field, val) => updateSemester(semester.id, field, val)}
            onRemove={() => removeSemester(semester.id)}
            onAddCourse={() => addCourse(semester.id)}
            onRemoveCourse={(cid) => removeCourse(semester.id, cid)}
            onUpdateCourse={(cid, field, val) => updateCourse(semester.id, cid, field, val)}
            onReorderCourses={(ids) => reorderCourses(semester.id, ids)}
          />
        )}
      />
      <button
        type="button"
        onClick={addSemester}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> Add semester
      </button>
      <input type="hidden" name={name} value={JSON.stringify(serializable)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Semester card (level 1)
// ─────────────────────────────────────────────────────────────────

function SemesterCard({
  semester,
  onUpdate,
  onRemove,
  onAddCourse,
  onRemoveCourse,
  onUpdateCourse,
  onReorderCourses,
}: {
  semester: Semester;
  onUpdate: (field: 'label' | 'coreCredits' | 'electiveCredits' | 'labCredits' | 'projectCredits' | 'totalCredits' | 'cumulativeCredits', val: string) => void;
  onRemove: () => void;
  onAddCourse: () => void;
  onRemoveCourse: (courseId: string) => void;
  onUpdateCourse: (courseId: string, field: 'code' | 'title' | 'type' | 'credits' | 'isSessional' | 'prerequisite', val: string | boolean) => void;
  onReorderCourses: (orderedIds: string[]) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Semester</h4>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove semester"
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <Input label="Label" value={semester.label}
             onChange={(v) => onUpdate('label', v)} placeholder="1st Year 1st Semester" />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Input label="Core" value={semester.coreCredits} inputMode="numeric"
               onChange={(v) => onUpdate('coreCredits', v)} placeholder="15" />
        <Input label="Elective" value={semester.electiveCredits} inputMode="numeric"
               onChange={(v) => onUpdate('electiveCredits', v)} placeholder="0" />
        <Input label="Lab" value={semester.labCredits} inputMode="numeric"
               onChange={(v) => onUpdate('labCredits', v)} placeholder="3" />
        <Input label="Project" value={semester.projectCredits} inputMode="numeric"
               onChange={(v) => onUpdate('projectCredits', v)} placeholder="0" />
        <Input label="Total" value={semester.totalCredits} inputMode="numeric"
               onChange={(v) => onUpdate('totalCredits', v)} placeholder="15" />
        <Input label="Cumulative" value={semester.cumulativeCredits} inputMode="numeric"
               onChange={(v) => onUpdate('cumulativeCredits', v)} placeholder="15" />
      </div>

      {/* Courses list (level 2) */}
      <div className="space-y-2 bg-gray-50/60 border border-gray-200 rounded p-3">
        <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Courses ({semester.courses.length})
        </h5>
        {semester.courses.length === 0 && (
          <p className="text-xs text-gray-500 italic">No courses yet.</p>
        )}
        <FormSortableList
          items={semester.courses}
          getId={(c) => c.id}
          onReorder={onReorderCourses}
          renderItem={(course) => (
            <div className="bg-white border border-gray-200 rounded p-2.5 space-y-1.5">
              <div className="grid grid-cols-1 md:grid-cols-[110px_1fr_100px_90px] gap-1.5">
                <Input label="Code" value={course.code}
                       onChange={(v) => onUpdateCourse(course.id, 'code', v)} placeholder="CSE 1101" />
                <Input label="Title" value={course.title}
                       onChange={(v) => onUpdateCourse(course.id, 'title', v)} placeholder="Course title" />
                <Input label="Type" value={course.type}
                       onChange={(v) => onUpdateCourse(course.id, 'type', v)} placeholder="Core / Elective" />
                <Input label="Credits" value={course.credits} inputMode="numeric"
                       onChange={(v) => onUpdateCourse(course.id, 'credits', v)} placeholder="3" />
              </div>
              <div className="flex items-center gap-4">
                <Input label="Prerequisite (optional)" value={course.prerequisite}
                       onChange={(v) => onUpdateCourse(course.id, 'prerequisite', v)}
                       placeholder="e.g. CSE 1101" className="flex-1" />
                <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 self-end pb-1.5">
                  <input
                    type="checkbox"
                    checked={course.isSessional}
                    onChange={(e) => onUpdateCourse(course.id, 'isSessional', e.target.checked)}
                    className="accent-accent"
                  />
                  Sessional
                </label>
                <button
                  type="button"
                  onClick={() => onRemoveCourse(course.id)}
                  aria-label="Remove course"
                  className="self-end mb-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        />
        <button
          type="button"
          onClick={onAddCourse}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus size={12} /> Add course
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Shared inline input
// ─────────────────────────────────────────────────────────────────

function Input({
  label, value, onChange, placeholder, inputMode, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      />
    </div>
  );
}

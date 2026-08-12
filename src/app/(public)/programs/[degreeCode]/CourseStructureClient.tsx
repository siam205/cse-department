'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';

export type CourseRow = {
  code: string;
  title: string;
  type: string;
  credits: number;
  isSessional: boolean;
  prerequisite: string;
};

export type SemesterRow = {
  label: string;
  coreCredits: number;
  electiveCredits: number;
  labCredits: number;
  projectCredits: number;
  totalCredits: number;
  cumulativeCredits: number;
  courses: CourseRow[];
};

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

// Strip a trailing/parenthesized "Sessional" from the title when the
// course is already flagged isSessional — the badge communicates it,
// so the word shouldn't also appear in the visible title.
function displayTitle(title: string, isSessional: boolean): string {
  if (!isSessional) return title;
  return title
    .replace(/\(\s*sessional\s*\)/i, '')
    .replace(/\bsessional\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function CourseStructureClient({
  semesters,
  sessionalIconName = 'FlaskConical',
}: {
  semesters: SemesterRow[];
  sessionalIconName?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(semesters.length > 0 ? 0 : null);
  const totalCourses = semesters.reduce((n, s) => n + s.courses.length, 0);

  return (
    <div>
      <p className="text-center text-sm text-gray-500 mb-6">
        {totalCourses} courses across {semesters.length} semesters. Select a semester to see its courses.
      </p>

      <div className="space-y-3">
        {semesters.map((semester, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={semester.label} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-primary text-sm md:text-base">{semester.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {semester.courses.length} courses · {fmt(semester.totalCredits)} credits
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && semester.courses.length > 0 && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60">
                        <th className="px-5 py-2.5 font-mono">Code</th>
                        <th className="px-5 py-2.5">Course</th>
                        <th className="px-5 py-2.5 text-right">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semester.courses.map((course, ci) => (
                        <tr key={`${course.code}-${ci}`} className="border-t border-gray-50">
                          <td className="px-5 py-2.5 font-mono text-xs text-gray-500 align-top whitespace-nowrap">{course.code}</td>
                          <td className="px-5 py-2.5 align-top">
                            <span className="text-gray-800">{displayTitle(course.title, course.isSessional)}</span>
                            {course.isSessional && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-full align-middle">
                                <DynamicLucideIcon name={sessionalIconName} size={11} />
                                Sessional
                              </span>
                            )}
                            {course.prerequisite && (
                              <div className="mt-1">
                                <span className="inline-block text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                                  Prerequisite: {course.prerequisite}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-right font-semibold text-primary align-top whitespace-nowrap">{fmt(course.credits)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

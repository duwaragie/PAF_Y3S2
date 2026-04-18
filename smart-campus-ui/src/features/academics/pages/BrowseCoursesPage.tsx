import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  courseOfferingService,
  type CourseOfferingDTO,
} from '@/services/courseOfferingService';
import { enrollmentService, type EnrollmentDTO } from '@/services/enrollmentService';
import type { CourseSectionDTO } from '@/services/courseSectionService';

export default function BrowseCoursesPage() {
  const [courses, setCourses] = useState<CourseOfferingDTO[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentDTO[]>([]);
  const [semester, setSemester] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingSectionId, setEnrollingSectionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [openRes, myRes] = await Promise.all([
        courseOfferingService.list({ status: 'OPEN' }),
        enrollmentService.listMine().catch(() => ({ data: [] as EnrollmentDTO[] })),
      ]);
      setCourses(openRes.data);
      setMyEnrollments(myRes.data || []);
    } catch {
      setError('Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  };

  const semesters = useMemo(
    () => Array.from(new Set(courses.map((c) => c.semester))).sort().reverse(),
    [courses],
  );

  const enrollmentByOfferingId = useMemo(() => {
    const map = new Map<number, EnrollmentDTO>();
    myEnrollments
      .filter((e) => e.status !== 'WITHDRAWN')
      .forEach((e) => map.set(e.offeringId, e));
    return map;
  }, [myEnrollments]);

  const filtered = courses.filter((c) => {
    if (semester && c.semester !== semester) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.code.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
    }
    return (c.sections?.length ?? 0) > 0;
  });

  const handleEnroll = async (section: CourseSectionDTO, offering: CourseOfferingDTO) => {
    try {
      setEnrollingSectionId(section.id);
      setError(null);
      setSuccess(null);
      const res = await enrollmentService.enroll(section.id);
      setMyEnrollments((prev) => {
        const existing = prev.find((e) => e.sectionId === section.id);
        return existing
          ? prev.map((e) => (e.sectionId === section.id ? res.data : e))
          : [res.data, ...prev];
      });
      await loadAll();
      setSuccess(
        res.data.status === 'ENROLLED'
          ? `Enrolled in ${offering.code} (${section.label}). Check notifications for confirmation.`
          : `Waitlisted for ${offering.code} (${section.label}). You'll be notified if a seat opens.`,
      );
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to enroll.');
    } finally {
      setEnrollingSectionId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Browse Courses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Open course offerings. Each course may have multiple sections; pick the lecturer and section you want. Full sections go to a waitlist.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">{success}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or title..."
            className="flex-1 h-10 px-3.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-campus-200"
          />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="h-10 px-3.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-campus-200"
          >
            <option value="">All semesters</option>
            {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            No open courses match your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => {
              const existing = enrollmentByOfferingId.get(c.id);
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-campus-700">{c.code}</span>
                        <span className="text-[10px] text-gray-400">{c.semester}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Credits <span className="font-semibold text-campus-800">{c.credits}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-campus-900 leading-tight">{c.title}</h3>
                    {c.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.description}</p>
                    )}
                    {c.prerequisites && (
                      <p className="text-[11px] text-gray-500 mt-2">
                        <span className="font-semibold text-gray-600">Prerequisites:</span>{' '}
                        <span className="font-mono">{c.prerequisites}</span>
                      </p>
                    )}
                    {existing && (
                      <p className="text-[11px] text-emerald-700 mt-2 font-semibold">
                        You're {existing.status === 'ENROLLED' ? 'enrolled' : 'on the waitlist'} in section {existing.sectionLabel}
                        {existing.lecturerName ? ` with ${existing.lecturerName}` : ''}.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Sections
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {c.sections.map((s) => {
                        const full = s.seatsAvailable === 0;
                        const alreadyHere = existing && existing.sectionId === s.id;
                        const blocked = existing && !alreadyHere;
                        return (
                          <div
                            key={s.id}
                            className={`bg-white rounded-lg border p-3 flex flex-col ${
                              alreadyHere ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-semibold text-campus-800">{s.label}</span>
                              <span className={`text-[10px] font-semibold ${full ? 'text-red-500' : 'text-gray-500'}`}>
                                {s.seatsAvailable}/{s.capacity}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-2 truncate">
                              {s.lecturerName || 'Unassigned'}
                            </p>
                            {alreadyHere ? (
                              <button disabled className="mt-auto h-8 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                                {existing!.status === 'ENROLLED' ? 'Enrolled' : 'On waitlist'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEnroll(s, c)}
                                disabled={enrollingSectionId === s.id || !!blocked}
                                className="mt-auto h-8 rounded-md bg-campus-800 text-white text-[11px] font-semibold hover:bg-campus-700 disabled:opacity-40 transition-colors"
                                title={blocked ? `You're already in section ${existing!.sectionLabel}` : undefined}
                              >
                                {enrollingSectionId === s.id
                                  ? '...'
                                  : blocked
                                  ? 'Already in another section'
                                  : full
                                  ? 'Join waitlist'
                                  : 'Enroll'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

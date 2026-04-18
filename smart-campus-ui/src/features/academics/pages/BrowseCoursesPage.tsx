import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  courseOfferingService,
  type CourseOfferingDTO,
} from '@/services/courseOfferingService';
import { enrollmentService, type EnrollmentDTO } from '@/services/enrollmentService';

export default function BrowseCoursesPage() {
  const [courses, setCourses] = useState<CourseOfferingDTO[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentDTO[]>([]);
  const [semester, setSemester] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
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
    myEnrollments.forEach((e) => map.set(e.offeringId, e));
    return map;
  }, [myEnrollments]);

  const filtered = courses.filter((c) => {
    if (semester && c.semester !== semester) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.code.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleEnroll = async (offering: CourseOfferingDTO) => {
    try {
      setEnrollingId(offering.id);
      setError(null);
      setSuccess(null);
      const res = await enrollmentService.enroll(offering.id);
      setMyEnrollments((prev) => {
        const existing = prev.find((e) => e.offeringId === offering.id);
        return existing
          ? prev.map((e) => (e.offeringId === offering.id ? res.data : e))
          : [res.data, ...prev];
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === offering.id
            ? {
                ...c,
                enrolledCount: c.enrolledCount + (res.data.status === 'ENROLLED' ? 1 : 0),
                seatsAvailable: Math.max(
                  0,
                  c.seatsAvailable - (res.data.status === 'ENROLLED' ? 1 : 0),
                ),
              }
            : c,
        ),
      );
      setSuccess(
        res.data.status === 'ENROLLED'
          ? `Enrolled in ${offering.code}. Check notifications for confirmation.`
          : `Waitlisted for ${offering.code}. You'll be notified if a seat opens.`,
      );
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to enroll.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Browse Courses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Open course offerings you can enroll in. Seats are first-come, first-served; full courses place you on the waitlist.
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
            No open course offerings match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const existing = enrollmentByOfferingId.get(c.id);
              const alreadyActive = existing
                && existing.status !== 'WITHDRAWN'
                && existing.status !== 'COMPLETED';
              const isFull = c.seatsAvailable === 0;
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-campus-700">{c.code}</span>
                    <span className="text-[10px] text-gray-400">{c.semester}</span>
                  </div>
                  <h3 className="text-base font-bold text-campus-900 leading-tight mb-1">{c.title}</h3>
                  {c.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{c.description}</p>
                  )}
                  <dl className="text-xs text-gray-600 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Credits</dt>
                      <dd className="font-semibold text-campus-800">{c.credits}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Lecturer</dt>
                      <dd className="text-campus-800">{c.lecturerName || 'TBA'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Seats</dt>
                      <dd className={isFull ? 'font-semibold text-red-500' : 'font-semibold text-campus-800'}>
                        {c.seatsAvailable}/{c.capacity}
                      </dd>
                    </div>
                    {c.prerequisites && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">Prereqs</dt>
                        <dd className="font-mono text-campus-800 text-right">{c.prerequisites}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-auto">
                    {alreadyActive ? (
                      <button disabled className="w-full h-10 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        {existing?.status === 'ENROLLED' ? '✓ Enrolled' : 'On waitlist'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c)}
                        disabled={enrollingId === c.id}
                        className="w-full h-10 rounded-lg bg-campus-800 text-white text-xs font-semibold hover:bg-campus-700 disabled:opacity-60 transition-colors"
                      >
                        {enrollingId === c.id ? 'Enrolling...' : isFull ? 'Join waitlist' : 'Enroll'}
                      </button>
                    )}
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

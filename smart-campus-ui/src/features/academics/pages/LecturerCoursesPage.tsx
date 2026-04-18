import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  courseOfferingService,
  type CourseOfferingDTO,
} from '@/services/courseOfferingService';
import {
  enrollmentService,
  GRADE_OPTIONS,
  type EnrollmentDTO,
  type Grade,
} from '@/services/enrollmentService';

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<CourseOfferingDTO[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [roster, setRoster] = useState<EnrollmentDTO[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingGradeFor, setSavingGradeFor] = useState<number | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setError(null);
      const res = await courseOfferingService.listMine();
      setCourses(res.data);
      if (res.data.length > 0 && selectedId === null) {
        void selectCourse(res.data[0].id);
      }
    } catch {
      setError('Failed to load your courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const selectCourse = async (id: number) => {
    setSelectedId(id);
    setError(null);
    setSuccess(null);
    try {
      setLoadingRoster(true);
      const res = await enrollmentService.roster(id);
      setRoster(res.data);
    } catch {
      setError('Failed to load roster.');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleSetGrade = async (enrollment: EnrollmentDTO, grade: Grade) => {
    try {
      setSavingGradeFor(enrollment.id);
      setError(null);
      const res = await enrollmentService.setGrade(enrollment.id, grade);
      setRoster((prev) => prev.map((e) => (e.id === enrollment.id ? res.data : e)));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save grade.');
    } finally {
      setSavingGradeFor(null);
    }
  };

  const handleReleaseAll = async () => {
    if (!selectedId) return;
    if (!window.confirm('Release all assigned grades to students? They will be notified and cannot be unreleased.')) return;
    try {
      setReleasing(true);
      setError(null);
      const res = await courseOfferingService.releaseGrades(selectedId);
      setSuccess(`Released ${res.data.released} grade${res.data.released !== 1 ? 's' : ''}. Students notified.`);
      await selectCourse(selectedId);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to release grades.');
    } finally {
      setReleasing(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedId) || null;
  const gradedCount = roster.filter((r) => r.grade && !r.gradeReleased && r.status === 'ENROLLED').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your assigned courses, enter grades, and release them when ready.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">{success}</div>
        )}

        {loadingCourses ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            You don't have any courses assigned yet. An administrator can assign you as the lecturer on an offering.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            {/* Course list */}
            <div className="space-y-2 lg:sticky lg:top-24 self-start">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCourse(c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedId === c.id
                      ? 'border-campus-600 bg-campus-50'
                      : 'border-gray-100 bg-white hover:border-campus-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-campus-700">{c.code}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-campus-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.semester} &bull; {c.enrolledCount}/{c.capacity} enrolled
                  </p>
                </button>
              ))}
            </div>

            {/* Roster */}
            {selectedCourse && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-campus-900">
                      {selectedCourse.code} &mdash; {selectedCourse.title}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedCourse.semester} &bull; {selectedCourse.credits} credits
                    </p>
                  </div>
                  <button
                    onClick={handleReleaseAll}
                    disabled={releasing || gradedCount === 0}
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-campus-800 text-white hover:bg-campus-700 disabled:opacity-40 transition-colors"
                  >
                    {releasing ? 'Releasing...' : `Release all grades (${gradedCount})`}
                  </button>
                </div>

                {loadingRoster ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reg. No.</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grade</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Released</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((e) => (
                          <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                            <td className="px-5 py-3">
                              <p className="text-sm font-semibold text-campus-800">{e.studentName}</p>
                              <p className="text-[11px] text-gray-400">{e.studentEmail}</p>
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-gray-600">
                              {e.studentRegistrationNumber || '—'}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                                e.status === 'ENROLLED' ? 'bg-emerald-100 text-emerald-700'
                                : e.status === 'WAITLISTED' ? 'bg-amber-100 text-amber-700'
                                : e.status === 'COMPLETED' ? 'bg-campus-100 text-campus-700'
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                                {e.status}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {e.status === 'ENROLLED' || e.status === 'COMPLETED' ? (
                                <select
                                  value={e.grade || ''}
                                  onChange={(ev) => handleSetGrade(e, ev.target.value as Grade)}
                                  disabled={savingGradeFor === e.id || e.gradeReleased}
                                  className="text-sm h-8 px-2 rounded border border-gray-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-campus-200 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">—</option>
                                  {GRADE_OPTIONS.map((g) => (
                                    <option key={g.value} value={g.value}>
                                      {g.label} ({g.points ?? 'NR'})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {e.gradeReleased ? (
                                <span className="text-xs font-semibold text-emerald-600">✓ Released</span>
                              ) : e.grade ? (
                                <span className="text-xs text-amber-600">Pending release</span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {roster.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                              No students enrolled yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

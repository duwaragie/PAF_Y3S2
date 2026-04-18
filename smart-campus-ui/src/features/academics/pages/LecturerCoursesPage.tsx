import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  courseSectionService,
  type CourseSectionDTO,
} from '@/services/courseSectionService';
import { courseOfferingService } from '@/services/courseOfferingService';
import {
  enrollmentService,
  GRADE_OPTIONS,
  type EnrollmentDTO,
  type Grade,
} from '@/services/enrollmentService';

export default function LecturerCoursesPage() {
  const [sections, setSections] = useState<CourseSectionDTO[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [roster, setRoster] = useState<EnrollmentDTO[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingGradeFor, setSavingGradeFor] = useState<number | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoadingSections(true);
      setError(null);
      const res = await courseSectionService.listMine();
      setSections(res.data);
      if (res.data.length > 0 && selectedSectionId === null) {
        void selectSection(res.data[0].id);
      }
    } catch {
      setError('Failed to load your sections.');
    } finally {
      setLoadingSections(false);
    }
  };

  const selectSection = async (id: number) => {
    setSelectedSectionId(id);
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

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;

  const handleReleaseAll = async () => {
    if (!selectedSection) return;
    try {
      setReleasing(true);
      setError(null);
      const res = await courseOfferingService.releaseGrades(selectedSection.offeringId);
      setSuccess(`Released ${res.data.released} grade${res.data.released !== 1 ? 's' : ''} across the course. Students notified.`);
      await selectSection(selectedSection.id);
      setReleaseConfirm(false);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to release grades.');
    } finally {
      setReleasing(false);
    }
  };

  const gradedCount = roster.filter((r) => r.grade && !r.gradeReleased && r.status === 'ENROLLED').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">My Sections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sections you lead. Grade students here; any lecturer on the offering (or an admin) can release all grades for the course.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">{success}</div>
        )}

        {loadingSections ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            You haven't been assigned to any sections yet. An administrator can assign you as the lecturer on a section.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            <div className="space-y-2 lg:sticky lg:top-24 self-start">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSection(s.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedSectionId === s.id
                      ? 'border-campus-600 bg-campus-50'
                      : 'border-gray-100 bg-white hover:border-campus-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-campus-700">{s.courseCode}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-campus-900 truncate">{s.courseTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.semester} &bull; {s.enrolledCount}/{s.capacity} enrolled
                  </p>
                </button>
              ))}
            </div>

            {selectedSection && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-campus-900">
                      {selectedSection.courseCode} &mdash; {selectedSection.courseTitle}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Section {selectedSection.label} &bull; {selectedSection.semester} &bull; {selectedSection.credits} credits
                    </p>
                  </div>
                  <button
                    onClick={() => setReleaseConfirm(true)}
                    disabled={releasing || gradedCount === 0}
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-campus-800 text-white hover:bg-campus-700 disabled:opacity-40 transition-colors"
                  >
                    {releasing ? 'Releasing...' : `Release all grades (course-wide)`}
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
                              {e.studentRegistrationNumber || ''}
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
                                  <option value="">Not set</option>
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
                                <span className="text-xs font-semibold text-emerald-600">Released</span>
                              ) : e.grade ? (
                                <span className="text-xs text-amber-600">Pending release</span>
                              ) : (
                                <span className="text-xs text-gray-300">Not graded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {roster.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                              No students enrolled in this section yet.
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

      {releaseConfirm && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-campus-900">
              Release grades for {selectedSection.courseCode}?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              This will release <span className="font-semibold text-campus-800">{gradedCount}</span>{' '}
              graded enrollment{gradedCount === 1 ? '' : 's'} across{' '}
              <span className="font-semibold text-campus-800">every section</span> of{' '}
              <span className="font-semibold text-campus-800">{selectedSection.courseTitle}</span>.
              Students will be notified by email and the grades cannot be unreleased.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReleaseConfirm(false)}
                disabled={releasing}
                className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseAll}
                disabled={releasing}
                className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-campus-800 hover:bg-campus-700 disabled:opacity-60 transition-colors"
              >
                {releasing ? 'Releasing...' : 'Release grades'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

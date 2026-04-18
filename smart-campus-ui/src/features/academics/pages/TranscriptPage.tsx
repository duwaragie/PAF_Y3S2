import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { enrollmentService, type TranscriptDTO } from '@/services/enrollmentService';

const gradeStyle = (grade: string | null | undefined): string => {
  if (!grade) return 'text-gray-300';
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-campus-700';
  if (grade.startsWith('C')) return 'text-amber-600';
  if (grade === 'F') return 'text-red-600';
  return 'text-gray-500';
};

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState<TranscriptDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await enrollmentService.transcript();
      setTranscript(res.data);
    } catch {
      setError('Failed to load transcript.');
    } finally {
      setIsLoading(false);
    }
  };

  const bySemester = (transcript?.entries || []).reduce<Record<string, TranscriptDTO['entries']>>((acc, e) => {
    (acc[e.semester] = acc[e.semester] || []).push(e);
    return acc;
  }, {} as Record<string, TranscriptDTO['entries']>);

  const semesters = Object.keys(bySemester).sort().reverse();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-campus-900">Academic Transcript</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your complete course history and grade point average. GPA counts only completed courses with released grades.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : transcript && (
          <>
            {/* Summary */}
            <div className="bg-gradient-to-br from-campus-800 to-campus-900 text-white rounded-2xl p-6 grid grid-cols-3 gap-6 relative group">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button
                    aria-label="How GPA is calculated"
                    className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center hover:bg-white/20"
                  >
                    ?
                  </button>
                  <div className="absolute right-0 top-6 w-64 hidden group-hover:block bg-white text-campus-900 text-[11px] rounded-lg shadow-lg p-3 leading-relaxed z-10">
                    <p className="font-bold mb-1">GPA = Σ(credits × grade points) / Σ(credits)</p>
                    <p className="text-gray-500">
                      Only courses marked COMPLETED with a released letter grade are counted.
                      &quot;I&quot; (Incomplete) and &quot;W&quot; (Withdrawn) grades are excluded.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Cumulative GPA</p>
                <p className="text-4xl font-extrabold mt-1 tracking-tight">
                  {transcript.gpa.toFixed(2)}
                  <span className="text-sm font-semibold text-white/50 ml-2">/ 4.00</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Credits earned</p>
                <p className="text-4xl font-extrabold mt-1">{transcript.creditsEarned.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Courses completed</p>
                <p className="text-4xl font-extrabold mt-1">{transcript.coursesCompleted}</p>
              </div>
            </div>

            {/* Student info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Student</dt>
                  <dd className="font-semibold text-campus-900 mt-0.5">{transcript.studentName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Registration No.</dt>
                  <dd className="font-mono font-semibold text-campus-900 mt-0.5">
                    {transcript.studentRegistrationNumber || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Issued</dt>
                  <dd className="font-semibold text-campus-900 mt-0.5">{new Date().toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {semesters.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
                No courses on your transcript yet.
              </div>
            ) : (
              semesters.map((sem) => (
                <div key={sem} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-campus-700">{sem}</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Code</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Course</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Credits</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grade</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">GPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bySemester[sem].map((e) => (
                        <tr key={e.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-5 py-3 text-sm font-mono font-semibold text-campus-700">{e.courseCode}</td>
                          <td className="px-5 py-3">
                            <p className="text-sm text-campus-800">{e.courseTitle}</p>
                            <p className="text-[11px] text-gray-400">
                              Section {e.sectionLabel}{e.lecturerName ? ` · ${e.lecturerName}` : ''}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{e.credits}</td>
                          <td className="px-5 py-3 text-xs text-gray-500">{e.status}</td>
                          <td className={`px-5 py-3 text-sm font-bold ${gradeStyle(e.gradeLabel)}`}>
                            {e.gradeReleased && e.gradeLabel ? e.gradeLabel : ''}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {e.gradeReleased && e.gradePoints != null ? e.gradePoints.toFixed(1) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

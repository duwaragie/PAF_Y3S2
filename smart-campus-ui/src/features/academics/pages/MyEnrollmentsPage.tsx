import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { enrollmentService, type EnrollmentDTO } from '@/services/enrollmentService';

const statusStyle: Record<string, string> = {
  ENROLLED: 'bg-emerald-100 text-emerald-700',
  WAITLISTED: 'bg-amber-100 text-amber-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
  COMPLETED: 'bg-campus-100 text-campus-700',
};

export default function MyEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirm, setConfirm] = useState<EnrollmentDTO | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await enrollmentService.listMine();
      setEnrollments(res.data);
    } catch {
      setError('Failed to load your enrollments.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm) return;
    try {
      setBusyId(confirm.id);
      setError(null);
      setSuccess(null);
      const res = await enrollmentService.withdraw(confirm.id);
      setEnrollments((prev) => prev.map((e) => (e.id === confirm.id ? res.data : e)));
      setSuccess(`Withdrawn from ${confirm.courseCode} (${confirm.sectionLabel}).`);
      setConfirm(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to withdraw.');
      setConfirm(null);
    } finally {
      setBusyId(null);
    }
  };

  const active = enrollments.filter((e) => e.status === 'ENROLLED' || e.status === 'WAITLISTED');
  const history = enrollments.filter((e) => e.status === 'WITHDRAWN' || e.status === 'COMPLETED');

  const renderRow = (e: EnrollmentDTO) => (
    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/30">
      <td className="px-5 py-3">
        <p className="text-sm font-mono font-bold text-campus-700">{e.courseCode}</p>
        <p className="text-[11px] text-gray-500">{e.semester}</p>
      </td>
      <td className="px-5 py-3">
        <p className="text-sm text-campus-800">{e.courseTitle}</p>
        <p className="text-[11px] text-gray-400">
          Section {e.sectionLabel}{e.lecturerName ? ` · ${e.lecturerName}` : ''}
        </p>
      </td>
      <td className="px-5 py-3 text-sm text-gray-600">{e.credits}</td>
      <td className="px-5 py-3">
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusStyle[e.status]}`}>
          {e.status}
        </span>
      </td>
      <td className="px-5 py-3 text-sm">
        {e.gradeReleased && e.gradeLabel ? (
          <span className="font-bold text-campus-900">{e.gradeLabel}</span>
        ) : (
          <span className="text-gray-300">Not released</span>
        )}
      </td>
      <td className="px-5 py-3 text-right">
        {(e.status === 'ENROLLED' || e.status === 'WAITLISTED') && (
          <button
            onClick={() => setConfirm(e)}
            disabled={busyId === e.id}
            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Withdraw
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-campus-900">My Enrollments</h1>
            <p className="text-sm text-gray-500 mt-1">Your current and past sections.</p>
          </div>
          <Link
            to="/courses"
            className="h-10 px-4 inline-flex items-center rounded-lg bg-campus-800 text-white text-xs font-semibold hover:bg-campus-700 transition-colors"
          >
            Browse courses
          </Link>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">{success}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-campus-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[11px] font-bold text-campus-900 uppercase tracking-wider">
                  Active ({active.length})
                </h2>
              </div>
              {active.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No active enrollments. <Link to="/courses" className="text-campus-700 hover:text-campus-900 font-semibold">Browse courses</Link> to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Course</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title &amp; Section</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Credits</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grade</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>{active.map(renderRow)}</tbody>
                  </table>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold text-campus-900 uppercase tracking-wider">
                    History ({history.length})
                  </h2>
                  <Link to="/transcript" className="text-xs font-semibold text-campus-700 hover:text-campus-900">
                    View transcript &rarr;
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Course</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title &amp; Section</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Credits</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grade</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right"></th>
                      </tr>
                    </thead>
                    <tbody>{history.map(renderRow)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-campus-900">
              Withdraw from {confirm.courseCode} ({confirm.sectionLabel})?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              You'll lose your spot in <span className="font-semibold text-campus-800">{confirm.courseTitle}</span>. If there's a waitlist, the next student will take your seat.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={busyId !== null}
                className="px-4 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={busyId !== null}
                className="px-4 h-10 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {busyId !== null ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

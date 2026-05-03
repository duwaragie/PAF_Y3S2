import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { UserDTO } from '@/services/adminService';
import type { BookingDTO } from '@/services/bookingService';
import type { TicketDTO } from '@/services/ticketService';
import type { ResourceDTO } from '@/services/resourceService';
import type { CourseOfferingDTO } from '@/services/courseOfferingService';

interface Props {
  users: UserDTO[];
  bookings: BookingDTO[];
  tickets: TicketDTO[];
  resources: ResourceDTO[];
  offerings: CourseOfferingDTO[];
}

function ChartCard({
  title,
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: {
  title: string;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-campus-900">{title}</h3>
        <div className="inline-flex rounded-lg bg-gray-50 p-0.5 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-campus-800 shadow-sm'
                  : 'text-gray-500 hover:text-campus-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-xs text-gray-400">
      No {label} to display.
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: '#0ea5e9',
  LECTURER: '#a855f7',
  ADMIN: '#ef4444',
  TECHNICAL_STAFF: '#f59e0b',
};

const BOOKING_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  CANCELLED: '#6b7280',
  COMPLETED: '#3b82f6',
};

const TICKET_COLORS: Record<string, string> = {
  OPEN: '#ef4444',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
  REJECTED: '#a855f7',
};

const RESOURCE_COLORS: Record<string, string> = {
  LECTURE_HALL: '#3b82f6',
  LAB: '#a855f7',
  MEETING_ROOM: '#10b981',
  EQUIPMENT: '#f59e0b',
};

const OFFERING_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  OPEN: '#10b981',
  CLOSED: '#ef4444',
  ARCHIVED: '#9ca3af',
};

const BOOKING_ORDER = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
const TICKET_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const RESOURCE_ORDER = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const OFFERING_ORDER = ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'];

export default function AnalyticsSection({
  users,
  bookings,
  tickets,
  resources,
  offerings,
}: Props) {
  const [roleTab, setRoleTab] = useState('All');
  const [bookingTab, setBookingTab] = useState('All Time');
  const [ticketTab, setTicketTab] = useState('All');
  const [resourceTab, setResourceTab] = useState('All');
  const [offeringTab, setOfferingTab] = useState('All');
  const [topResTab, setTopResTab] = useState('All Time');
  const [hoursTab, setHoursTab] = useState('All Time');
  const [reportNow] = useState(Date.now);

  const roleData = useMemo(() => {
    const filtered = roleTab === 'Staff'
      ? users.filter((u) => u.role !== 'STUDENT')
      : users;
    const counts = filtered.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([role, value]) => ({
      name: role.replace('_', ' '),
      value,
      fill: ROLE_COLORS[role] || '#9ca3af',
    }));
  }, [users, roleTab]);

  const bookingData = useMemo(() => {
    const weekAgo = reportNow - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = reportNow - 30 * 24 * 60 * 60 * 1000;
    const filtered = bookings.filter((b) => {
      if (!b.requestedAt) return bookingTab === 'All Time';
      const t = new Date(b.requestedAt).getTime();
      if (bookingTab === 'This Week') return t >= weekAgo;
      if (bookingTab === 'This Month') return t >= monthAgo;
      return true;
    });
    const counts = filtered.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    return BOOKING_ORDER
      .filter((s) => counts[s])
      .map((s) => ({ name: s, value: counts[s], fill: BOOKING_COLORS[s] }));
  }, [bookings, bookingTab, reportNow]);

  const ticketData = useMemo(() => {
    let filtered = tickets;
    if (ticketTab === 'High/Critical') {
      filtered = tickets.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL');
    } else if (ticketTab === 'Medium/Low') {
      filtered = tickets.filter((t) => t.priority === 'MEDIUM' || t.priority === 'LOW');
    }
    const counts = filtered.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return TICKET_ORDER
      .filter((s) => counts[s])
      .map((s) => ({ name: s.replace('_', ' '), value: counts[s], fill: TICKET_COLORS[s] }));
  }, [tickets, ticketTab]);

  const resourceData = useMemo(() => {
    const filtered = resourceTab === 'Active Only'
      ? resources.filter((r) => r.status === 'ACTIVE')
      : resources;
    const counts = filtered.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});
    return RESOURCE_ORDER
      .filter((t) => counts[t])
      .map((t) => ({ name: t.replace('_', ' '), value: counts[t], fill: RESOURCE_COLORS[t] }));
  }, [resources, resourceTab]);

  const offeringData = useMemo(() => {
    const filtered = offeringTab === 'With Enrollments'
      ? offerings.filter((o) => (o.totalEnrolled ?? 0) > 0)
      : offerings;
    const counts = filtered.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    return OFFERING_ORDER
      .filter((s) => counts[s])
      .map((s) => ({ name: s, value: counts[s], fill: OFFERING_COLORS[s] }));
  }, [offerings, offeringTab]);

  const usageBookings = useMemo(
    () => bookings.filter((b) => b.status === 'APPROVED' || b.status === 'COMPLETED'),
    [bookings]
  );

  const topResourcesData = useMemo(() => {
    const weekAgo = reportNow - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = reportNow - 30 * 24 * 60 * 60 * 1000;
    const filtered = usageBookings.filter((b) => {
      if (!b.startTime) return topResTab === 'All Time';
      const t = new Date(b.startTime).getTime();
      if (topResTab === 'This Week') return t >= weekAgo;
      if (topResTab === 'This Month') return t >= monthAgo;
      return true;
    });
    const counts = filtered.reduce<Record<string, number>>((acc, b) => {
      const name = b.resourceName || `Resource #${b.resourceId}`;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [usageBookings, topResTab, reportNow]);

  const peakHoursData = useMemo(() => {
    const weekAgo = reportNow - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = reportNow - 30 * 24 * 60 * 60 * 1000;
    const filtered = usageBookings.filter((b) => {
      if (!b.startTime) return hoursTab === 'All Time';
      const t = new Date(b.startTime).getTime();
      if (hoursTab === 'This Week') return t >= weekAgo;
      if (hoursTab === 'This Month') return t >= monthAgo;
      return true;
    });
    const counts = new Array<number>(24).fill(0);
    filtered.forEach((b) => {
      if (!b.startTime) return;
      const h = new Date(b.startTime).getHours();
      if (h >= 0 && h < 24) counts[h] += 1;
    });
    return counts.map((value, h) => ({
      name: `${String(h).padStart(2, '0')}:00`,
      value,
    }));
  }, [usageBookings, hoursTab, reportNow]);

  const peakHoursHasData = peakHoursData.some((d) => d.value > 0);

  return (
    <div>
      <h2 className="text-sm font-bold text-campus-900 mb-3 uppercase tracking-wider text-[11px]">
        Analytics
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Users by Role"
          tabs={['All', 'Staff']}
          activeTab={roleTab}
          onTabChange={setRoleTab}
        >
          {roleData.length === 0 ? (
            <EmptyState label="users" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {roleData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Bookings by Status"
          tabs={['All Time', 'This Month', 'This Week']}
          activeTab={bookingTab}
          onTabChange={setBookingTab}
        >
          {bookingData.length === 0 ? (
            <EmptyState label="bookings" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {bookingData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Tickets by Status"
          tabs={['All', 'High/Critical', 'Medium/Low']}
          activeTab={ticketTab}
          onTabChange={setTicketTab}
        >
          {ticketData.length === 0 ? (
            <EmptyState label="tickets" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {ticketData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Resources by Type"
          tabs={['All', 'Active Only']}
          activeTab={resourceTab}
          onTabChange={setResourceTab}
        >
          {resourceData.length === 0 ? (
            <EmptyState label="resources" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {resourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top Resources by Usage"
          tabs={['All Time', 'This Month', 'This Week']}
          activeTab={topResTab}
          onTabChange={setTopResTab}
          className="lg:col-span-2"
        >
          {topResourcesData.length === 0 ? (
            <EmptyState label="resource usage" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topResourcesData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={140}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Peak Booking Hours"
          tabs={['All Time', 'This Month', 'This Week']}
          activeTab={hoursTab}
          onTabChange={setHoursTab}
          className="lg:col-span-2"
        >
          {!peakHoursHasData ? (
            <EmptyState label="booking hour data" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={1}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Course Offerings by Status"
          tabs={['All', 'With Enrollments']}
          activeTab={offeringTab}
          onTabChange={setOfferingTab}
          className="lg:col-span-2"
        >
          {offeringData.length === 0 ? (
            <EmptyState label="course offerings" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offeringData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {offeringData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

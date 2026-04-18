import { type ResourceAvailabilityDTO, type DayOfWeek } from '@/services/resourceService';

const dayOrder: Record<DayOfWeek, number> = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7
};

const shortDays: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

export const formatTime = (timeString: string) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

export const formatAvailabilitySummary = (availabilities?: ResourceAvailabilityDTO[]): string => {
  if (!availabilities || availabilities.length === 0) return 'No schedule set';

  const sorted = [...availabilities].sort((a, b) => dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek]);
  
  // Group by identical time windows
  const groups: { [timeKey: string]: DayOfWeek[] } = {};
  
  sorted.forEach(a => {
    const timeKey = `${formatTime(a.startTime)}–${formatTime(a.endTime)}`;
    if (!groups[timeKey]) groups[timeKey] = [];
    groups[timeKey].push(a.dayOfWeek);
  });

  const parts: string[] = [];
  
  // Check for the specific "Mon-Fri" common pattern
  const weekdays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  
  Object.entries(groups).forEach(([timeKey, days]) => {
    const hasAllWeekdays = weekdays.every(d => days.includes(d));
    const isOnlyWeekdays = days.length === 5 && hasAllWeekdays;
    
    if (isOnlyWeekdays) {
      parts.push(`Mon–Fri ${timeKey}`);
    } else if (hasAllWeekdays) {
      // Has weekdays plus weekend days
      const extraDays = days.filter(d => !weekdays.includes(d));
      const extraDaysStr = extraDays.map(d => shortDays[d]).join(', ');
      parts.push(`Mon–Fri & ${extraDaysStr} ${timeKey}`);
    } else {
      // Format as individual or ranges
      if (days.length === 1) {
        parts.push(`${shortDays[days[0]]} ${timeKey}`);
      } else if (days.length === 2 && dayOrder[days[1]] - dayOrder[days[0]] === 1) {
        parts.push(`${shortDays[days[0]]}–${shortDays[days[1]]} ${timeKey}`);
      } else {
        parts.push(`${days.map(d => shortDays[d]).join(', ')} ${timeKey}`);
      }
    }
  });

  return parts.join(' | ');
};

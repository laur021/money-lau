import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";

export const REPORTING_PERIODS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "this_year",
  "all_time",
] as const;

export type ReportingPeriod = (typeof REPORTING_PERIODS)[number];

export const PERIOD_LABELS: Record<ReportingPeriod, string> = {
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  all_time: "All time",
};

export function isReportingPeriod(value: string): value is ReportingPeriod {
  return REPORTING_PERIODS.includes(value as ReportingPeriod);
}

export function reportingDateRange(
  period: ReportingPeriod,
  now = new Date(),
  weekStartsOn = 1,
) {
  const weekOptions = { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 };

  if (period === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (period === "this_week") {
    return {
      from: startOfWeek(now, weekOptions),
      to: endOfWeek(now, weekOptions),
    };
  }

  if (period === "last_month") {
    const previousMonth = subMonths(now, 1);
    return {
      from: startOfMonth(previousMonth),
      to: endOfMonth(previousMonth),
    };
  }

  if (period === "this_year") {
    return { from: startOfYear(now), to: endOfYear(now) };
  }

  if (period === "all_time") {
    return { from: undefined, to: endOfDay(now) };
  }

  return { from: startOfMonth(now), to: endOfMonth(now) };
}

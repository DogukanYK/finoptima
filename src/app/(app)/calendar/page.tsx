import { requireUser } from "@/lib/auth-helpers";
import { getCalendarMonth } from "@/lib/queries";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month1 = sp.m ? Number(sp.m) : now.getMonth() + 1;
  const month0 = Math.min(11, Math.max(0, month1 - 1));

  const data = await getCalendarMonth(user.id, year, month0);

  return (
    <CalendarView
      year={year}
      month0={month0}
      days={data.days}
      transactions={data.transactions}
    />
  );
}

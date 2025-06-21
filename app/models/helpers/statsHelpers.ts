import { HabitModel } from "../HabitModel"
import { ActivityLogModel } from "../ActivityLogModel"
import { Instance } from "mobx-state-tree"

type HabitModelType = Instance<typeof HabitModel>
type ActivityLogModelType = Instance<typeof ActivityLogModel>

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  addDays,
} from "date-fns"


/**
 * Returns an array of daily summaries of total completed activities and targets
 * @param habits Array of habit objects
 * @param activityLog Array of activity log entries
 * @param period "D" | "W" | "M" for day, week, month
 */
export function getSummaryByPeriod(
  habits: HabitModelType[],
  activityLog: ActivityLogModelType[],
  period: string = "W",
) {
  const summaries: { date: string; completed: number; target: number }[] = []

  const today = new Date()

  let startDate: Date
  let endDate: Date

  switch (period) {
    case "D":
      startDate = startOfDay(today)
      endDate = endOfDay(today)
      break
    case "W":
      startDate = startOfWeek(today, { weekStartsOn: 1 }) // Monday start
      endDate = endOfWeek(today, { weekStartsOn: 1 })
      break
    case "M":
      startDate = startOfMonth(today)
      endDate = endOfMonth(today)
      break
    default:
      startDate = startOfWeek(today, { weekStartsOn: 1 })
      endDate = endOfWeek(today, { weekStartsOn: 1 })
  }

  // We will iterate day by day in the period
  for (
    let current = startDate;
    current <= endDate;
    current = addDays(current, 1)
  ) {
    const dateStr = format(current, "yyyy-MM-dd")

    // Find all habits that are scheduled for this day of the week

    // const dayOfWeek = format(current, "EEE") // e.g. "Mon", "Tue", etc.

    const dayOfWeek = format(current, "EEEE") // e.g. "Monday", "Tuesday", etc.


    // Sum targets for habits active this day
    const totalTarget = habits.reduce((acc, habit) => {
      if (habit.frequency.includes(dayOfWeek)) {
        return acc + habit.target
      }
      return acc
    }, 0)

    // Sum completed counts from activityLog for this date


    // const totalCompleted = activityLog
    //   .filter((entry) => entry.date === dateStr)
    //   .reduce((acc, entry) => acc + entry.count, 0)

    const totalCompleted = activityLog
  .filter((entry) => entry.date?.slice(0, 10) === dateStr)
  .reduce((acc, entry) => acc + entry.count, 0)



        // 🔍 Add your debug logs right before pushing the summary
  console.log("🔍 For date:", dateStr)
  console.log(
    "  Activity on this day:",
    activityLog.filter((entry) => entry.date === dateStr)
  )
  console.log("  Total completed:", totalCompleted)
  console.log("  Total target:", totalTarget)

  console.log(`🔎 Summary for ${dateStr}`);
console.log(`✅ Day of week: ${dayOfWeek}`);
console.log(`📌 Matching habits:`);
habits.forEach(habit => {
  const matches = habit.frequency.includes(dayOfWeek);
  console.log(` - ${habit.name}: freq=${habit.frequency.join(", ")} | target=${habit.target} | matches=${matches}`);
});
console.log(`📝 Completed entries:`);
activityLog
  .filter(entry => entry.date === dateStr)
  .forEach(entry => {
    console.log(` - habitId=${entry.habitId} | count=${entry.count}`);
  });
console.log(`🎯 Total target: ${totalTarget}, Total completed: ${totalCompleted}`);


    summaries.push({
      date: dateStr,
      completed: totalCompleted,
      target: totalTarget,
    })
  }

  return summaries
}

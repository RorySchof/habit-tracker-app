
// Experimental Statistics.tsx

import { observer } from "mobx-react-lite"
import React, { FC, useMemo, useState } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle } from "react-native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { BarChart, barDataItem, PieChart, pieDataItem } from "react-native-gifted-charts"
import { Text, Screen } from "app/components"
import layout from "app/utils/layout"
import { colors, spacing } from "../theme"
import { StatisticsScreenProps } from "app/navigators/types"
import { habitStore } from "../models/habit-store"
import { eachDayOfInterval, subDays, format } from "date-fns"
import { getSnapshot } from "mobx-state-tree"

import { Picker } from "@react-native-picker/picker"

import { parseISO, } from "date-fns"

// Time Range picker

// const filters = [
//   { title: "Day", abbr: "D", id: 1 },
//   { title: "Week", abbr: "W", id: 2 },
//   { title: "Month", abbr: "M", id: 3 },
//   { title: "Three Months", abbr: "3M", id: 4 },
//   { title: "Six Months", abbr: "6M", id: 5 },
//   { title: "Year", abbr: "Y", id: 6 },
// ]

// const filterDaysMap = {
//   D: 1,
//   W: 7,
//   M: 30,
//   Y: 365,
// };

//FUNCTIONS AND HELPERS BELOW


// gets dates. today minus 7,30,etc
function getPastDates(chartLength: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = chartLength - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date.toISOString().slice(0, 10)) // YYYY-MM-DD
  }

  return dates
}

function getDailyCounts(dates: string[], completions: { date: string }[]) {
  const counts: { dateStr: string, count: number }[] = []

  for (const dateStr of dates) {
    const count = completions.filter(c => c.date === dateStr).length
    counts.push({ dateStr, count })
  }

  return counts
}



function isScheduledForDate(habit, date) {
  const dayOfWeek = format(date, "EEEE");
  const createdAt = new Date(habit.createdAt);
  return habit.frequency.includes(dayOfWeek) && date >= createdAt;
}

// const chartLength = filter === "M" ? 30 : 7;
// const [filter, setFilter] = useState<"D" | "W" | "M" | "3M" | "6M" | "Y">("D");

export const ExperimentalStatsScreen: FC<StatisticsScreenProps> = observer(function StatisticsScreen() {
  const [filter, setFilter] = React.useState("W")

    const filters = [
    { title: "Day", abbr: "D", id: 1 },
    { title: "Week", abbr: "W", id: 2 },
    { title: "Month", abbr: "M", id: 3 },
    { title: "Three Months", abbr: "3M", id: 4 },
    { title: "Six Months", abbr: "6M", id: 5 },
    { title: "Year", abbr: "Y", id: 6 },
  ]

  const filterDaysMap = {
    D: 1,
    W: 7,
    M: 30,
    "3M": 90,
    "6M": 180,
    Y: 365,
  }

const chartLength = filterDaysMap[filter] ?? 7
const completions = habitStore.activityLog
const dates = getPastDates(chartLength)
const dailyCounts = getDailyCounts(dates, completions)
const chartData = formatChartData(dailyCounts)
console.log("Chart data:", dailyCounts)


  // Longest streak

  const { activityLog } = habitStore

  function calculateStreaks(dates: string[]): {
    currentStreak: number
    longestStreak: number
  } {
    if (!dates.length) return { currentStreak: 0, longestStreak: 0 }

    const sortedDates = dates
      .map((date) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime())

    let longestStreak = 1
    let currentStreak = 1
    let tempStreak = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = sortedDates[i - 1]
      const curr = sortedDates[i]

      const diffInDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

      if (diffInDays === 1) {
        tempStreak++
      } else if (diffInDays > 1) {
        tempStreak = 1
      }

      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Check if the last date is today or yesterday

    const lastDate = sortedDates[sortedDates.length - 1]
    const today = new Date()
    const diffFromToday = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    currentStreak = diffFromToday <= 1 ? tempStreak : 0

    return { currentStreak, longestStreak }
  }

  // streaks cont...

  const streaksByHabit: Record<string, { currentStreak: number; longestStreak: number }> = {}

  habitStore.habits.forEach((habit) => {
    const checkInDates = activityLog
      .filter((log) => log.habitId === habit.id)
      .map((log) => log.date)

    streaksByHabit[habit.id] = calculateStreaks(checkInDates)
  })


  // Weekly completion progress calculation

  const weeklyCompletionData = useMemo(() => {
    if (!habitStore.habits.length || !habitStore.activityLog.length) return []

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday start
    const weekDatesSet = new Set(
      eachDayOfInterval({ start: startOfWeek, end: today }).map((date) =>
        format(date, "yyyy-MM-dd"),
      ),
    )

    const activityMap = new Map<string, number>()
    for (const log of habitStore.activityLog) {
      if (weekDatesSet.has(log.date)) {
        const current = activityMap.get(log.habitId) || 0
        activityMap.set(log.habitId, current + log.count)
      }
    }

    const activeHabits = habitStore.habits.filter((h) => !h.paused) // ✅ Skip paused

    return activeHabits.map((habit) => {
      const totalCount = activityMap.get(habit.id) || 0
      const avgProgress = Math.min((totalCount / habit.target) * 100, 100)
      return {
        habitName: habit.name,
        emoji: habit.emoji || "🔥",
        avgProgress: Math.round(avgProgress),
      }
    })
  }, [
    habitStore.habits.map((h) => h.id + h.target).join(","), // depend only on ids and targets
    habitStore.activityLog.length, // depend on log changes
  ])

  // Determines complete, partial, miseed.

  // const completionSummary = useMemo(() => {
  //   if (!habitStore.habits.length) return { complete: 0, partial: 0, missed: 0 }

  //   let complete = 0
  //   let partial = 0
  //   let missed = 0

  //   const today = new Date()
  //   for (let i = 0; i < 7; i++) {
  //     const date = subDays(today, i)
  //     const formattedDate = format(date, "yyyy-MM-dd")
  //     const dayOfWeek = format(date, "EEEE")

  //     const scheduledHabits = habitStore.habits.filter(
  //       (habit) => habit.frequency.includes(dayOfWeek) && !habit.paused, // ✅ skip paused habits
  //     )

  //     if (scheduledHabits.length === 0) {
  //       missed += 1
  //       continue
  //     }

  //     let completedAll = true
  //     let anyInput = false

  //     for (const habit of scheduledHabits) {
  //       const logEntry = habitStore.activityLog.find(
  //         (entry) => entry.habitId === habit.id && entry.date === formattedDate,
  //       )

  //       if (logEntry && logEntry.count > 0) {
  //         anyInput = true
  //         if (logEntry.count < habit.target) {
  //           completedAll = false
  //         }
  //       } else {
  //         completedAll = false
  //       }
  //     }

  //     if (completedAll) {
  //       complete += 1
  //     } else if (anyInput) {
  //       partial += 1
  //     } else {
  //       missed += 1
  //     }
  //   }

  //   return { complete, partial, missed }
  // }, [habitStore.habits, habitStore.activityLog])

  const habitWeeklyBreakdown = useMemo(() => {
    const today = new Date()

    // const startOfWeek = new Date(today)
    // startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday start

    // const days = eachDayOfInterval({ start: startOfWeek, end: today })

    const days = Array.from({ length: chartLength }).map((_, idx) =>
      subDays(today, chartLength - 1 - idx),
    )

    const breakdown: Record<string, { completed: number; partial: number; missed: number }> = {}

    habitStore.habits
      .filter((habit) => !habit.paused)
      .forEach((habit) => {
        let completed = 0
        let partial = 0
        let missed = 0

        days.forEach((date) => {
          const formattedDate = format(date, "yyyy-MM-dd")
          const dayOfWeek = format(date, "EEEE")

          // if (!habit.frequency.includes(dayOfWeek)) {
          //   return // not scheduled that day
          // }

          if (!isScheduledForDate(habit, date)) return

          const logEntry = habitStore.activityLog.find(
            (entry) => entry.habitId === habit.id && entry.date === formattedDate,
          )

          if (logEntry) {
            if (logEntry.count >= habit.target) {
              completed += 1
            } else if (logEntry.count > 0) {
              partial += 1
            } else {
              missed += 1
            }
          } else {
            missed += 1
          }
        })

        breakdown[habit.id] = { completed, partial, missed }
      })

    return breakdown
  }, [habitStore.habits, habitStore.activityLog])


  // Completion Summary


  const completionSummary = useMemo(() => {
  let complete = 0
  let partial = 0
  let missed = 0

  const today = new Date()
  const days = Array.from({ length: chartLength }).map((_, i) =>
    subDays(today, chartLength - 1 - i)
  )

  days.forEach(date => {
    const formattedDate = format(date, "yyyy-MM-dd")
    const dayOfWeek = format(date, "EEEE")

    const scheduledHabits = habitStore.habits.filter(h =>
      !h.paused &&
      h.frequency.includes(dayOfWeek) &&
      new Date(h.createdAt) <= date
    )

    if (scheduledHabits.length === 0) {
      return // no scheduled habits for this day, ignore
    }

    let completedCount = 0
    let partialCount = 0

    scheduledHabits.forEach(habit => {
      const entry = habitStore.activityLog.find(
        log => log.habitId === habit.id && log.date === formattedDate
      )

      if (!entry) return

      if (entry.count >= habit.target) {
        completedCount++
      } else if (entry.count > 0) {
        partialCount++
      }
    })

    const total = scheduledHabits.length

    if (completedCount === total) {
      complete++
    } else if (completedCount > 0 || partialCount > 0) {
      partial++
    } else {
      missed++
    }
  })

  console.log("📅 Completion Summary:")
  console.log("Complete:", complete)
  console.log("Partial:", partial)
  console.log("Missed:", missed)

  return { complete, partial, missed }
}, [chartLength, habitStore.habits, habitStore.activityLog])









//   const completionSummary = useMemo(() => {
//     let complete = 0
//     let partial = 0
//     let missed = 0

//     const breakdownData = habitWeeklyBreakdown ?? {} // ✅ fallback to empty object

//     for (let i = 0; i < chartLength; i++) {
//       const date = subDays(new Date(), chartLength - 1 - i)
//       const formattedDate = format(date, "yyyy-MM-dd")
//       const breakdown = breakdownData[formattedDate]

//       const totalScheduled = breakdown?.target ?? 0
//       const completedCount = breakdown?.completed ?? 0

//       if (totalScheduled === 0) {
//         missed += 1
//       } else if (completedCount === totalScheduled) {
//         complete += 1
//       } else {
//         partial += 1
//       }
//     }

//     console.log("📅 Completion Summary:")
// console.log("Complete:", complete)
// console.log("Partial:", partial)
// console.log("Missed:", missed)


//     return { complete, partial, missed }
//   }, [chartLength, habitWeeklyBreakdown])






  const habitWeeklyStatus = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: chartLength }).map((_, idx) => {
      const date = subDays(today, 6 - idx) // oldest to newest
      return {
        date,
        formatted: format(date, "yyyy-MM-dd"),
        dayOfWeek: format(date, "EEEE"),
      }
    })

    return habitStore.habits
      .filter((habit) => !habit.paused)
      .map((habit) => {
        const dayStatuses = days.map((day) => {
          if (!habit.frequency.includes(day.dayOfWeek)) {
            return "grey" // not scheduled
          }

          const logEntry = habitStore.activityLog.find(
            (entry) => entry.habitId === habit.id && entry.date === day.formatted,
          )

          if (logEntry) {
            if (logEntry.count >= habit.target) return "green"
            if (logEntry.count > 0) return "yellow"
            return "red"
          }
          return "red" // scheduled but no activity
        })

        return {
          habitName: habit.name,
          targetText: `${habit.target} ${habit.unit} per day`,
          dayStatuses,
        }
      })
  }, [habitStore.habits, habitStore.activityLog])



//   const completionSummary = useMemo(() => {
//   let complete = 0;
//   let partial = 0;
//   let missed = 0;

//   const today = new Date();
//   const days = Array.from({ length: chartLength }).map((_, idx) =>
//     subDays(today, chartLength - 1 - idx)
//   );

//   days.forEach((date) => {
//     const formattedDate = format(date, "yyyy-MM-dd");

//     // Get all habits scheduled for this day
//     const scheduledHabits = habitStore.habits.filter((habit) => {
//       const dayOfWeek = format(date, "EEEE");
//       const createdAt = new Date(habit.createdAt);
//       return (
//         !habit.paused &&
//         habit.frequency.includes(dayOfWeek) &&
//         date >= createdAt
//       );
//     });

//     if (scheduledHabits.length === 0) return; // skip days with no scheduled habits

//     let completedCount = 0;
//     let partialCount = 0;

//     scheduledHabits.forEach((habit) => {
//       const logEntry = habitStore.activityLog.find(
//         (entry) => entry.habitId === habit.id && entry.date === formattedDate
//       );

//       if (logEntry) {
//         if (logEntry.count >= habit.target) {
//           completedCount += 1;
//         } else if (logEntry.count > 0) {
//           partialCount += 1;
//         }
//       }
//     });

//     if (completedCount === scheduledHabits.length) {
//       complete += 1;
//     } else if (completedCount > 0 || partialCount > 0) {
//       partial += 1;
//     } else {
//       missed += 1;
//     }
//   });

//   return { complete, partial, missed };
// }, [chartLength, habitStore.habits, habitStore.activityLog]);


  const habitStreaks = useMemo(() => {
    const streaks: Record<string, number> = {}

    habitStore.habits
      .filter((habit) => !habit.paused)
      .forEach((habit) => {
        // Call your store's helper function instead of inline logic
        streaks[habit.id] = habitStore.calculateHabitStreak(habit)
      })

    return streaks
  }, [habitStore.habits, habitStore.activityLog])

  const habitWeeklyTotals = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday start

    const weekDatesSet = new Set(
      eachDayOfInterval({ start: startOfWeek, end: today }).map((date) =>
        format(date, "yyyy-MM-dd"),
      ),
    )

    const totals: Record<string, number> = {}

    habitStore.habits
      .filter((habit) => !habit.paused)
      .forEach((habit) => {
        const totalCount = habitStore.activityLog
          .filter((log) => log.habitId === habit.id && weekDatesSet.has(log.date))
          .reduce((acc, log) => acc + log.count, 0)

        totals[habit.id] = totalCount
      })

    return totals
  }, [habitStore.habits, habitStore.activityLog])

  // const filteredHabits = habitStore.habits

  const filteredHabits = habitStore.habits.filter((habit) => !habit.paused)

  const totalCompleted = filteredHabits.reduce((acc, habit) => acc + habit.current, 0)
  const totalTarget = filteredHabits.reduce((acc, habit) => acc + habit.target, 0)
  const percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0

  const data: barDataItem[] = filteredHabits.map((habit) => ({
    value: habit.current,
    label: habit.name,
    frontColor: colors.palette.primary600,
    gradientColor: colors.palette.primary100,
  }))

  const pieData: pieDataItem[] = [
    { value: 80, color: colors.palette.secondary500, focused: true },
    { value: 20, color: colors.palette.accent500 },
  ]

  const renderDot = (color: string) => <View style={[$dotStyle, { backgroundColor: color }]} />

  const renderLegendComponent = () => (
    <View style={$legendContainer}>
      <View style={$legend}>
        {renderDot(colors.palette.secondary500)}
        <Text>Excellent: 80%</Text>
      </View>
      <View style={$legend}>
        {renderDot(colors.palette.accent500)}
        <Text>Okay: 20%</Text>
      </View>
    </View>
  )

  const dailyPercentageData = Array.from({ length: chartLength }).map((_, idx) => {
    const date = subDays(new Date(), 6 - idx) // oldest to newest
    const formattedDate = format(date, "yyyy-MM-dd")
    const dayOfWeek = format(date, "EEEE")
    const label = format(date, "EEE") // "Mon", "Tue", ...

    // Habits scheduled that day

    const scheduledHabits = habitStore.habits.filter(
      (habit) => habit.frequency.includes(dayOfWeek) && !habit.paused,
    )

    const totalScheduled = scheduledHabits.length

    const completedCount = scheduledHabits.reduce((sum, habit) => {
      const logEntry = habitStore.activityLog.find(
        (entry) => entry.habitId === habit.id && entry.date === formattedDate,
      )
      if (logEntry && logEntry.count >= habit.target) {
        return sum + 1
      }
      return sum
    }, 0)

    const percentage = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0

    return { label, value: percentage, frontColor: "#304FFE" }
  })

 // what does this do? 

  habitStore.habits.forEach((habit) => {
    const checkInDates = habitStore.activityLog
      .filter((log) => log.habitId === habit.id)
      .map((log) => log.date)

    streaksByHabit[habit.id] = calculateStreaks(checkInDates)
  })

  //Reformats dates for gifted chartd import. 

  function formatChartData(dailyCounts: { dateStr: string; count: number }[]) {
  return dailyCounts.map(({ dateStr, count }) => ({
    label: format(parseISO(dateStr), "MMM d"), // e.g. "Jul 23"
    value: count,
    frontColor: "#304FFE", // optional: customize bar color
  }))
}




console.log("🗓️ Final Daily Counts:", dailyCounts)
console.log("📈 Chart Data for BarChart:", chartData)



  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$topContainer}>
        <Text text="Stats experimental" preset="heading" />
        <MaterialCommunityIcons name="export-variant" size={24} />
      </View>

      {/* range selction 37/30/90 */}

      <View style={$filtersContainer}>
        {/* // const chartLength = filter === "M" ? 30 : 7;
// const [filter, setFilter] = useState<"D" | "W" | "M" | "3M" | "6M" | "Y">("D"); */}

        {filters.map((f, idx) => (
          <View key={`${f.id}-${f.abbr}`} style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={filter === f.abbr ? $activeFilter : {}}
              onPress={() => setFilter(f.abbr)}
            >
              <Text text={f.abbr} preset="bold" style={filter === f.abbr ? $activeText : {}} />
            </TouchableOpacity>
            {filters.length > idx + 1 && (
              <Text text="•" preset="bold" style={{ marginHorizontal: 4 }} />
            )}
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: "row",
          flex: 1,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          backgroundColor: "#fff",
          paddingVertical: 16,
          marginTop: 16,

          // 👇 Drop shadow styling
          elevation: 2, // Android
          shadowColor: "#000", // iOS
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        {/* Perfect */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#304FFE",
              marginBottom: 8,
            }}
          />
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#444" }}>Complete</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#000", marginTop: 4 }}>
            {completionSummary.complete} days
          </Text>
        </View>

        {/* Divider */}
        <View style={{ width: 1, backgroundColor: "#ccc" }} />

        {/* Partial */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#8C9EFF",
              marginBottom: 8,
            }}
          />
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#444" }}>Partial</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#000", marginTop: 4 }}>
            {completionSummary.partial} days
          </Text>
        </View>

        {/* Divider */}
        <View style={{ width: 1, backgroundColor: "#ccc" }} />

        {/* Missed */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#BDBDBD",
              marginBottom: 8,
            }}
          />
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#444" }}>Missed</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#000", marginTop: 4 }}>
            {completionSummary.missed} days
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "column",
          flex: 1,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          backgroundColor: "#fff",
          paddingVertical: 16,
          paddingHorizontal: 16,
          marginTop: 24,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: "#666", fontWeight: "500" }}>Total Activities</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#304FFE" }}>{percentage}%</Text>
        </View>

        {/* 👇 Add this container for alignment */}

        <View style={{ overflow: "hidden", width: "100%" }}>
          <BarChart
  data={chartData}
  barWidth={20}
  spacing={10}
  width={layout.window.width * 0.9}
  height={180}
  maxValue={Math.max(...chartData.map(d => d.value)) + 1}
  barBorderRadius={6}
  yAxisThickness={0}
  xAxisColor="#E0E0E0"
  xAxisType="solid"
  xAxisLabelTextStyle={{ color: "#666", fontSize: 12 }}
  yAxisTextStyle={{ color: "#999", fontSize: 10 }}
  noOfSections={5}
  showLine={false}
/>




          {/* <BarChart
            data={dailyPercentageData}
            barWidth={20}
            spacing={10}
            width={layout.window.width * 0.75}
            height={180}
            maxValue={100}
            stepValue={20}
            barBorderRadius={6}
            yAxisLabelSuffix="%"
            yAxisThickness={0}
            xAxisColor="#E0E0E0"
            xAxisType="solid"
            xAxisLabelTextStyle={{ color: "#666", fontSize: 12 }}
            yAxisTextStyle={{ color: "#999", fontSize: 10 }}
            noOfSections={5}
            showLine={false}
          /> */}
        </View>
      </View>

      <View
        style={{
          flexDirection: "column",
          flex: 1,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          backgroundColor: "#fff",
          paddingVertical: 16,
          marginTop: 16,
          elevation: 2, // Android
          shadowColor: "#000", // iOS
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <Text preset="subheading" style={{ marginBottom: 12, textAlign: "center" }}>
          Weekly Completion %
        </Text>

        {weeklyCompletionData.map((habit, idx) => (
          <View
            key={`${habit.habitName}-${idx}`}
            style={{ marginVertical: 12, paddingHorizontal: 16 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#304FFE', marginRight: 8 }} /> */}
              <Text text={habit.emoji} style={{ fontSize: 18, marginRight: 8 }} />
              <Text text={habit.habitName} style={{ flex: 1, fontSize: 16, color: "#444" }} />
              <Text text={`${habit.avgProgress}%`} style={{ fontWeight: "600", color: "#000" }} />
            </View>

            <View
              style={{
                height: 8,
                backgroundColor: "#ddd",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 4,
              }}
            >
              <View
                style={{
                  width: `${habit.avgProgress}%`,
                  backgroundColor: "#304FFE",
                  height: "100%",
                }}
              />
            </View>
          </View>
        ))}
      </View>

       {/* habit weekly status section */}

       {habitWeeklyStatus.map((habit, idx) => {
  const habitId = habitStore.habits[idx]?.id ?? ""
  const habitColor = habitStore.habits[idx]?.color ?? "#304FFE"

  return (
    <View
      key={`${habit.habitName}-${idx}`}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
        paddingVertical: 16,
        marginTop: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 2 }}>
        {habit.habitName}
      </Text>
      <Text style={{ color: "#666", marginBottom: 6 }}>{habit.targetText}</Text>

      <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        {habit.dayStatuses.map((status, dayIdx) => (
          <View
            key={dayIdx}
            style={{
              width: 43,
              height: 43,
              borderRadius: 6,
              backgroundColor:
                status === "green"
                  ? habitColor
                  : status === "yellow"
                  ? `${habitColor}80`
                  : "#BDBDBD",
            }}
          />
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
      <Text style={{ color: "#444" }}>
        🔥 Current Streak: {streaksByHabit[habitId]?.currentStreak ?? 0} days
      </Text>

      <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
      <Text style={{ color: "#444", marginTop: 2 }}>
        🏆 Longest Streak: {streaksByHabit[habitId]?.longestStreak ?? 0} days
      </Text>

      <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: habitColor,
            marginRight: 8,
          }}
        />
        <Text style={{ color: "#444" }}>
          Completed: {habitWeeklyBreakdown[habitId]?.completed ?? 0} days
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: `${habitColor}80`,
            marginRight: 8,
          }}
        />
        <Text style={{ color: "#444" }}>
          Partial: {habitWeeklyBreakdown[habitId]?.partial ?? 0} days
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#BDBDBD",
            marginRight: 8,
          }}
        />
        <Text style={{ color: "#444" }}>
          Missed: {habitWeeklyBreakdown[habitId]?.missed ?? 0} days
        </Text>
      </View>
    </View>
  )
})}

    </Screen>
  )
})

const $container: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.xl,
  paddingBottom: 70,
}

const $topContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $xAxisLabelText: TextStyle = {
  color: colors.textDim,
  textAlign: "center",
}

const $barChartContainer: ViewStyle = { overflow: "hidden" }
const $barChartOverviewContainer: ViewStyle = { marginBottom: spacing.xs }

const $filtersContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $activeFilter: ViewStyle = {
  backgroundColor: colors.palette.primary600,
  borderRadius: 99,
  width: 36,
  height: 36,
  justifyContent: "center",
  alignItems: "center",
}

const $activeText: TextStyle = {
  color: colors.palette.neutral100,
  textAlign: "center",
}

const $dotStyle: ViewStyle = {
  height: 10,
  width: 10,
  borderRadius: 5,
  marginRight: 10,
}

const $legendContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  marginBottom: 10,
}

const $legend: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  width: "50%",
}

const $pieChartLabelContainer: ViewStyle = {
  justifyContent: "center",
  alignItems: "center",
}

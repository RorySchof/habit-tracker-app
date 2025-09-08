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

import { parseISO } from "date-fns"

import { ScrollView } from "react-native"

import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"

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
  const counts: { dateStr: string; count: number }[] = []

  for (const dateStr of dates) {
    const count = completions.filter((c) => c.date === dateStr).length
    counts.push({ dateStr, count })
  }

  return counts
}

function isScheduledForDate(habit, date) {
  const dayOfWeek = format(date, "EEEE")
  const createdAt = new Date(habit.createdAt)
  return habit.frequency.includes(dayOfWeek) && date >= createdAt
}

// const chartLength = filter === "M" ? 30 : 7;
// const [filter, setFilter] = useState<"D" | "W" | "M" | "3M" | "6M" | "Y">("D");

type FilterKey = "D" | "W" | "M" | "3M" | "6M" | "Y"

export const ExperimentalStatsScreen: FC<StatisticsScreenProps> = observer(
  function StatisticsScreen() {

    const [refreshKey, setRefreshKey] = useState(0) // to reload the screen when navigated to
    const [filter, setFilter] = React.useState<FilterKey>("W")

    // Reload function

    useFocusEffect(
  useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])
)

    const filters = [
      { title: "Day", abbr: "D", id: 1 },
      { title: "Week", abbr: "W", id: 2 },
      { title: "Month", abbr: "M", id: 3 },
      { title: "Three Months", abbr: "3M", id: 4 },
      { title: "Six Months", abbr: "6M", id: 5 },
      { title: "Year", abbr: "Y", id: 6 },
    ]

    const filterDaysMap: Record<FilterKey, number> = {
      D: 1,
      W: 7,
      M: 30,
      "3M": 90,
      "6M": 180,
      Y: 365,
    }

    const chartLength = filterDaysMap[filter] ?? 7

    React.useEffect(() => {
      const habits = habitStore.getHabitsWithStatuses(chartLength)
    }, [filter])

    const habits = habitStore.getHabitsWithStatuses(chartLength)
    const completions = habitStore.activityLog
    const dates = getPastDates(chartLength)
    const dailyCounts = getDailyCounts(dates, completions)
    const chartData = formatChartData(dailyCounts)

    // MASTER MATRIX FUNCTION

    const habitMatrix = useMemo(() => {
      const matrix = []

      for (const dateStr of dates) {
        const date = parseISO(dateStr)
        const dayOfWeek = format(date, "EEEE")

        const daySummary = {
          date: dateStr,
          habits: [],
          complete: 0,
          partial: 0,
          missed: 0,
        }

        const scheduledHabits = habitStore.habits.filter(
          (habit) =>
            !habit.paused &&
            habit.frequency.includes(dayOfWeek) &&
            format(new Date(habit.createdAt), "yyyy-MM-dd") <= dateStr,
        )

        for (const habit of scheduledHabits) {
          const logEntry = habitStore.activityLog.find(
            (entry) => entry.habitId === habit.id && entry.date === dateStr,
          )

          let status = "missed"
          if (logEntry) {
            if (logEntry.count >= habit.target) status = "complete"
            else if (logEntry.count > 0) status = "partial"
          }

          daySummary.habits.push({
            habitId: habit.id,
            name: habit.name,
            status,
            count: logEntry?.count || 0,
            target: habit.target,
          })

          daySummary[status] += 1
        }

        matrix.push(daySummary)
      }

      return matrix
    }, [refreshKey,habitStore.habits, habitStore.activityLog, chartLength])

    // Longest streak see line 720

    

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
      const diffFromToday = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      currentStreak = diffFromToday <= 1 ? tempStreak : 0

      return { currentStreak, longestStreak }
    }

    // streaks cont...

    const streaksByHabit: Record<string, { currentStreak: number; longestStreak: number }> = {}

    habitStore.habits.forEach((habit) => {

 const logsForHabit = activityLog.filter(log => log.habitId === habit.id)

      const checkInDates = activityLog

      
        .filter((log) => log.habitId === habit.id)
        .map((log) => log.date)

      streaksByHabit[habit.id] = calculateStreaks(checkInDates)
    })



    // Weekly completion progress calculation

    const weeklyCompletionData = useMemo(() => {
      if (!habitStore.habits.length || !habitStore.activityLog.length) return []

      const today = new Date()
      const startDate = subDays(today, chartLength - 1)
      const dateRange = eachDayOfInterval({ start: startDate, end: today })

      const activityMap = new Map<string, number>()
      for (const log of habitStore.activityLog) {
        const logDate = format(parseISO(log.date), "yyyy-MM-dd")
        if (dateRange.some((d) => format(d, "yyyy-MM-dd") === logDate)) {
          const current = activityMap.get(log.habitId) || 0
          activityMap.set(log.habitId, current + log.count)
        }
      }

      const activeHabits = habitStore.habits.filter((h) => !h.paused)



return activeHabits.map((habit) => {
  let scheduledDays = 0

  for (const date of dateRange) {
    const dayOfWeek = format(date, "EEEE").toLowerCase()

    // const habitDate = new Date(habit.createdAt).toDateString()
    // const currentDate = date.toDateString()

    const normalizedFrequency = habit.frequency?.map((d) => d.toLowerCase()) || []

    // if (normalizedFrequency.includes(dayOfWeek) && habitDate <= currentDate) {
    //   scheduledDays += 1
    // }

    const habitDate = new Date(habit.createdAt)
habitDate.setHours(0, 0, 0, 0) // strip time

if (normalizedFrequency.includes(dayOfWeek) && date >= habitDate) {
  scheduledDays += 1
}

  }

  const totalCount = activityMap.get(habit.id) || 0
  const expectedTotal = scheduledDays * habit.target
  const avgProgress =
    expectedTotal > 0 ? Math.min((totalCount / expectedTotal) * 100, 100) : 0

//     console.log("🧠 Habit:", habit.name)
// console.log("📅 Created At:", habit.createdAt)
// console.log("📆 Scheduled Days This Week:", scheduledDays)
// console.log("✅ Total Count Logged:", totalCount)
// console.log("🎯 Expected Total:", expectedTotal)
// console.log("📊 Calculated %:", avgProgress)


console.log("📊 Weekly Completion Debug:", {
  name: habit.name,
  target: habit.target,
  scheduledDays,
  totalCount,
  expectedTotal,
  avgProgress: Math.round(avgProgress),
})

console.log("📅 Chart Length:", chartLength)
console.log("📆 Date Range:", dateRange.map(d => format(d, "EEEE yyyy-MM-dd")))


  return {
    habitName: habit.name,
    emoji: habit.emoji || "🔥",
    avgProgress: Math.round(avgProgress),
  }
})

}, [
  refreshKey,
  chartLength,
  habitStore.habits.map((h) => h.id + h.target + h.frequency.join("")).join(","),
  habitStore.activityLog.length,
])

    // New chart to replace total activities with task completed

    const dailyEffortData = useMemo(() => {
      return Array.from({ length: chartLength }).map((_, idx) => {
        const date = subDays(new Date(), chartLength - 1 - idx)
        const formattedDate = format(date, "yyyy-MM-dd")
        const dayOfWeek = format(date, "EEEE")
        const label = format(date, "EEE") // or "MMM d" for monthly

        const scheduledHabits = habitStore.habits.filter(
          (habit) =>
            habit.frequency.includes(dayOfWeek) &&
            !habit.paused &&
            format(new Date(habit.createdAt), "yyyy-MM-dd") <= formattedDate,
        )

        let totalTarget = 0
        let totalLogged = 0

        for (const habit of scheduledHabits) {
          totalTarget += habit.target

          const logEntry = habitStore.activityLog.find(
            (entry) => entry.habitId === habit.id && entry.date === formattedDate,
          )

          if (logEntry) {
            totalLogged += logEntry.count
          }
        }

        const percentage = totalTarget > 0 ? Math.round((totalLogged / totalTarget) * 100) : 0

        return { label, value: percentage, frontColor: "#304FFE" }
      })
    }, [refreshKey, chartLength, habitStore.habits, habitStore.activityLog])

    // WEEKLY HABIT BREAKDOWN

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
    }, [refreshKey, habitStore.habits, habitStore.activityLog])

    // Completion Summary

    const completionSummary = useMemo(() => {
      let complete = 0
      let partial = 0
      let missed = 0

      const today = new Date()
      const days = Array.from({ length: chartLength }).map((_, i) =>
        subDays(today, chartLength - 1 - i),
      )

      days.forEach((date) => {
        const formattedDate = format(date, "yyyy-MM-dd")
        const dayOfWeek = format(date, "EEEE")

        const scheduledHabits = habitStore.habits.filter(
          (h) => !h.paused && h.frequency.includes(dayOfWeek) && format(new Date(h.createdAt), "yyyy-MM-dd") <= formattedDate
,
        )

        if (scheduledHabits.length === 0) {
          return // no scheduled habits for this day, ignore
        }

        let completedCount = 0
        let partialCount = 0

        scheduledHabits.forEach((habit) => {
          const entry = habitStore.activityLog.find(
            (log) => log.habitId === habit.id && log.date === formattedDate,
          )

          if (!entry) return

          if (entry.count >= habit.target) {
            completedCount++
          } else if (entry.count > 0) {
            partialCount++
          }
        })

        const total = scheduledHabits.length

        // ✅ Place logs here
  console.log(`📆 ${formattedDate}`)
  console.log(`🧠 Scheduled Habits:`, scheduledHabits.map(h => h.name))
  console.log(`✅ Completed Count: ${completedCount}`)
  console.log(`⚠️ Partial Count: ${partialCount}`)
  console.log(`📊 Total Scheduled: ${scheduledHabits.length}`)


console.log(`📆 ${formattedDate}`)
console.log(`🧠 Scheduled Habits:`, scheduledHabits.map(h => h.name))
console.log(`✅ Completed Count: ${completedCount}`)
console.log(`⚠️ Partial Count: ${partialCount}`)
console.log(`📊 Total Scheduled: ${scheduledHabits.length}`)


        if (completedCount === total) {
          complete++
        } else if (completedCount > 0 || partialCount > 0) {
          partial++
        } else {
          missed++
        }
      })

      

      return { complete, partial, missed }
    }, [refreshKey, chartLength, habitStore.habits, habitStore.activityLog])

    // Habit weekly status

    const habitWeeklyStatus = useMemo(() => {
      const today = new Date()
      const days = Array.from({ length: chartLength }).map((_, idx) => {
        const date = subDays(today, chartLength - 1 - idx) // oldest to newest
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
            const isScheduled = habit.frequency.includes(day.dayOfWeek)
const isBeforeCreation = format(new Date(habit.createdAt), "yyyy-MM-dd") > day.formatted

            if (!isScheduled || isBeforeCreation) {
              return "grey" // not scheduled or not yet created
            }

            const logEntry = habitStore.activityLog.find(
              (entry) => entry.habitId === habit.id && entry.date === day.formatted,
            )

            if (logEntry) {
              if (logEntry.count >= habit.target) {
                return "green"
              }
              if (logEntry.count > 0) {
                return "yellow"
              }
              return "red"
            }

            return "red" // scheduled but no activity
          })

          const completedCount = dayStatuses.filter((s) => s === "green").length
          const partialCount = dayStatuses.filter((s) => s === "yellow").length
          const missedCount = dayStatuses.filter((s) => s === "red").length

          return {
            habitName: habit.name,
            targetText: `${habit.target} ${habit.unit} per day`,
            dayStatuses,
            completedCount,
            partialCount,
            missedCount,
          }
        })
    }, [refreshKey, habitStore.habits, habitStore.activityLog, chartLength])

    // const habitWeeklyStatus = useMemo(() => {
    //   const today = new Date()
    //   const days = Array.from({ length: chartLength }).map((_, idx) => {
    //     const date = subDays(today, chartLength - 1 - idx) // oldest to newest
    //     return {
    //       date,
    //       formatted: format(date, "yyyy-MM-dd"),
    //       dayOfWeek: format(date, "EEEE"),
    //     }
    //   })

    //   return habitStore.habits
    //     .filter((habit) => !habit.paused)
    //     .map((habit) => {
    //       const dayStatuses = days.map((day) => {

    //         console.log("🧠 Habit:", habit.name)
    // console.log("📅 Day:", day.formatted, "| Day of Week:", day.dayOfWeek)
    // console.log("⏰ Scheduled:", habit.frequency.includes(day.dayOfWeek))

    //         if (!habit.frequency.includes(day.dayOfWeek)) {
    //           return "grey" // not scheduled
    //         }

    //         const logEntry = habitStore.activityLog.find(
    //           (entry) => entry.habitId === habit.id && entry.date === day.formatted,
    //         )

    //         if (logEntry) {
    //           if (logEntry.count >= habit.target) return "green"
    //           if (logEntry.count > 0) return "yellow"
    //           return "red"
    //         }
    //         return "red" // scheduled but no activity
    //       })

    //       return {
    //         habitName: habit.name,
    //         targetText: `${habit.target} ${habit.unit} per day`,
    //         dayStatuses,
    //       }
    //     })
    // }, [habitStore.habits, habitStore.activityLog, chartLength])

    // const habitWeeklyStatus = useMemo(() => {
    //   const today = new Date()
    //   const days = Array.from({ length: chartLength }).map((_, idx) => {
    //     const date = subDays(today, 6 - idx) // oldest to newest
    //     return {
    //       date,
    //       formatted: format(date, "yyyy-MM-dd"),
    //       dayOfWeek: format(date, "EEEE"),
    //     }
    //   })

    //   return habitStore.habits
    //     .filter((habit) => !habit.paused)
    //     .map((habit) => {
    //       const dayStatuses = days.map((day) => {
    //         if (!habit.frequency.includes(day.dayOfWeek)) {
    //           return "grey" // not scheduled
    //         }

    //         const logEntry = habitStore.activityLog.find(
    //           (entry) => entry.habitId === habit.id && entry.date === day.formatted,
    //         )

    //         if (logEntry) {
    //           if (logEntry.count >= habit.target) return "green"
    //           if (logEntry.count > 0) return "yellow"
    //           return "red"
    //         }
    //         return "red" // scheduled but no activity
    //       })

    //       return {
    //         habitName: habit.name,
    //         targetText: `${habit.target} ${habit.unit} per day`,
    //         dayStatuses,
    //       }
    //     })
    // }, [habitStore.habits, habitStore.activityLog])




    // Habit Streaks

    const habitStreaks = useMemo(() => {
      const streaks: Record<string, number> = {}

      habitStore.habits
        .filter((habit) => !habit.paused)
        .forEach((habit) => {
          // Call your store's helper function instead of inline logic
          streaks[habit.id] = habitStore.calculateHabitStreak(habit)
        })

      return streaks
    }, [refreshKey, habitStore.habits, habitStore.activityLog])

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
    }, [refreshKey, habitStore.habits, habitStore.activityLog])

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

    // Daily percentage data

    const dailyPercentageData = Array.from({ length: chartLength }).map((_, idx) => {
      // const date = subDays(new Date(), 6 - idx) // oldest to newest
      const date = subDays(new Date(), chartLength - 1 - idx)

      const formattedDate = format(date, "yyyy-MM-dd")
      const dayOfWeek = format(date, "EEEE")
      const label = format(date, "EEE") // "Mon", "Tue", ...

      // Habits scheduled that day

      const normalizedDay = dayOfWeek.toLowerCase()

      const scheduledHabits = habitStore.habits.filter((habit) => {
  const normalizedFrequency = habit.frequency?.map(d => d.toLowerCase()) || []
  return normalizedFrequency.includes(normalizedDay) && !habit.paused
})

      // const scheduledHabits = habitStore.habits.filter(
      //   (habit) => habit.frequency.includes(dayOfWeek) && !habit.paused,
      // )

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

      const percentage =
        totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0


        if (formattedDate === format(new Date(), "yyyy-MM-dd")) {
  console.log("📆 Today:", formattedDate)
  console.log("📊 Total Scheduled Habits:", totalScheduled)

  console.log("🧠 Scheduled Habits Today:", scheduledHabits.map(h => ({
    name: h.name,
    target: h.target,
    frequency: h.frequency,
    createdAt: h.createdAt,
  })))

    if (formattedDate === format(new Date(), "yyyy-MM-dd")) {
    console.log("📊 Chart Data — Habits Completed Today")
    console.log("📅 Label:", label)
    console.log("🧠 Scheduled Habits:", scheduledHabits.map(h => h.name))
    console.log("✅ Completed Count:", completedCount)
    console.log("📊 Completion %:", percentage)
  }

  const completedHabits = scheduledHabits.filter((habit) => {
    const logEntry = habitStore.activityLog.find(
      (entry) =>
        entry.habitId === habit.id &&
        entry.date === formattedDate
    )
    const totalCount = logEntry?.count ?? 0
    return totalCount >= habit.target
  })

  console.log("✅ Completed Habits Today:", completedHabits.map(h => h.name))
  console.log("📊 Completion %:", completedHabits.length, "/", scheduledHabits.length)
}


      return { label, value: percentage, frontColor: "#304FFE" }
    })

    const percentageChartData = dailyPercentageData

    const todayPercentage = percentageChartData[percentageChartData.length - 1]?.value ?? 0

    console.log("📊 Rendering Habits Completed Chart:")
console.log(
  "📊 percentageChartData:",
  percentageChartData.map((d) => `${d.label}: ${d.value}%`)
)

    // what does this do? STREAKS

    habitStore.habits.forEach((habit) => {

      
      const checkInDates = habitStore.activityLog
        .filter((log) => log.habitId === habit.id && log.count >= habit.target)
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
                backgroundColor: "#616161",
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
          {/* Taks completed GRAPH..!!!!!!!  KEEP THIS WHEN YOU CLEAN CODE */}
          
          {/* <View style={{ overflow: "hidden", width: "100%", marginBottom: 24 }}>
            <BarChart
              data={dailyEffortData}
              barWidth={20}
              spacing={10}
              width={layout.window.width * 0.9}
              height={180}
              maxValue={100}
              barBorderRadius={6}
              yAxisThickness={0}
              xAxisColor="#E0E0E0"
              xAxisType="solid"
              xAxisLabelTextStyle={{ color: "#666", fontSize: 12 }}
              yAxisTextStyle={{ color: "#999", fontSize: 10 }}
              noOfSections={4}
              yAxisLabelTexts={["0%", "25%", "50%", "75%", "100%"]}
              showLine={false}
            />
          </View> */}

          {/* habits completed graph  */}

          <View style={{ marginBottom: 12 }}>
  <Text style={{ fontSize: 14, color: "#666", fontWeight: "500" }}>Habits completed</Text>
  <Text style={{ fontSize: 20, fontWeight: "700", color: "#304FFE" }}>
    {todayPercentage}%
  </Text>
</View>

          {/* 👇 Add this container for alignment */}

          <View style={{ overflow: "hidden", width: "100%" }}>
            <BarChart
              data={percentageChartData}
              barWidth={20}
              spacing={10}
              width={layout.window.width * 0.9}
              height={180}
              // maxValue={Math.max(...chartData.map(d => d.value)) + 1}
              // maxValue={Math.max(...percentageChartData.map((d) => d.value)) + 1}
              maxValue={100}
              barBorderRadius={6}
              yAxisThickness={0}
              xAxisColor="#E0E0E0"
              xAxisType="solid"
              xAxisLabelTextStyle={{ color: "#666", fontSize: 12 }}
              yAxisTextStyle={{ color: "#999", fontSize: 10 }}
              noOfSections={4}
              yAxisLabelTexts={["0%", "25%", "50%", "75%", "100%"]}
              showLine={false}
            />
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
            Activity Completion
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



        {/* habit Cards Section */}

        {/* THIS IS THE SECTION IM WORKING ON       
          Match by name for color only — habitId may be undefined or misaligned*/}


        {habitWeeklyStatus.map((habit, idx) => {
  // const habitId = habitStore.habits[idx]?.id ?? ""

  // const habitColor = habitStore.habits[idx]?.color ?? "#304FFE"

const habitFromStore = habitStore.habits.find(h => h.name === habit.habitName)  
  const habitId = habitFromStore?.id ?? ""

  const habitColor = habitFromStore?.color ?? "#304FFE"


  // this works


        {/* {habitWeeklyStatus.map((habit, idx) => {
          const habitId = habitStore.habits[idx]?.id ?? ""


          // const habitColor = habitStore.habits[idx]?.color ?? "#304FFE"

          const habitFromStore = habitStore.habits.find(h => h.id === habit.habitId)
const habitColor = habitFromStore?.color ?? "#304FFE"

           console.log("🧪 Stats Card:", {
    habitName: habit.habitName,
    habitId,
    habitColor,
    matchedHabit: habitStore.habits[idx],
  }) */}

  

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

              <View style={{ maxHeight: 200 }}>
                <ScrollView>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      justifyContent: "flex-start",
                    }}
                  >
                    {/* {habit.dayStatuses.map((status, dayIdx) => {
  console.log(`📦 Box ${dayIdx}:`, status)
  return (
    <View
      key={dayIdx}
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,


        backgroundColor:
  status === "green"
    ? habitColor
    : status === "yellow"
    ? `${habitColor}80`
    : status === "missed"
    ? "#000000"
    : status === "unscheduled"
    ? "#BDBDBD"
    : "#FFFFFF"
      }}
    />
  )
})} */}

                    {habit.dayStatuses.map((status, dayIdx) => {
                      return (
                        <View
                          key={dayIdx}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,

                            backgroundColor:
                              status === "green"
                                ? habitColor
                                : status === "yellow"
                                ? `${habitColor}30`
                                : status === "red"
                                ? "#616161"
                                : status === "grey"
                                ? "#BDBDBD"
                                : "#FFFFFF",
                          }}
                        />
                      )
                    })}

                    {/* {habit.dayStatuses.map((status, dayIdx) => (
        
        <View
          key={dayIdx}
          style={{
            width: 24, // fixed width
            height: 24, // fixed height
            borderRadius: 4,

            
            backgroundColor:
              status === "green"
                ? habitColor
                : status === "yellow"
                ? `${habitColor}80`
                : "#BDBDBD",
          }}
        />
      ))} */}
                  </View>
                </ScrollView>
              </View>

              {/* 
<View
  style={{
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  }}
>
  {habit.dayStatuses.map((status, dayIdx) => (
    
    <View
      key={dayIdx}
      style={{
        width: 36,
        height: 36,
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
</View> */}

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

                <Text>Completed: {habit.completedCount} days</Text>
              </View>

              <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${habitColor}30`,
                    marginRight: 8,
                  }}
                />
                <Text>Partial: {habit.partialCount} days</Text>
              </View>

              <View style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 8 }} />
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `#616161`,
                    marginRight: 8,
                  }}
                />
                <Text>Missed: {habit.missedCount} days</Text>
              </View>
            </View>
          )
        })}
      </Screen>
    )
  },
)

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

  // 🆕 Add these for visual consistency
  borderWidth: 1,
  borderColor: "#ccc",
  elevation: 2, // Android
  shadowColor: "#000", // iOS
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
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

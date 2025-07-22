// Fake habit screen

import React, { useState } from "react"
import { View, Button, Text, SafeAreaView, ScrollView } from "react-native"
import { observer } from "mobx-react-lite"
import { habitStore } from "app/models/habit-store"
import { WeekCalendar, CalendarProvider } from "react-native-calendars"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  addDays,
  subDays,
} from "date-fns"

import { useMemo } from "react"
import { eachDayOfInterval } from "date-fns"

// import { ErrorBototalCompletedundary } from "react-error-boundary"

export function getSummaryByPeriod(
  habits: HabitModelType[],
  activityLog: ActivityLogModelType[],
  period: string = "W",
) {
  // console.time("getSummary")
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
      startDate = startOfWeek(today, { weekStartsOn: 1 })
      endDate = endOfWeek(today, { weekStartsOn: 1 })
      break
    case "M":
      startDate = startOfMonth(today)
      endDate = endOfMonth(today)
      break
    case "30":
      startDate = subDays(today, 29)
      endDate = today
      break
    case "90":
      startDate = subDays(today, 89)
      endDate = today
      break
    default:
      startDate = startOfWeek(today, { weekStartsOn: 1 })
      endDate = endOfWeek(today, { weekStartsOn: 1 })
  }

  for (let current = startDate; current <= endDate; current = addDays(current, 1)) {
    const dateStr = format(current, "yyyy-MM-dd")
    const dayOfWeek = format(current, "EEEE")

    const totalTarget = habits.reduce((acc, habit) => {
      if (habit.frequency.includes(dayOfWeek)) {
        return acc + habit.target
      }
      return acc
    }, 0)

    const totalCompleted = activityLog
      .filter((entry) => entry.date?.slice(0, 10) === dateStr)
      .reduce((acc, entry) => acc + entry.count, 0)

    summaries.push({
      date: dateStr,
      completed: totalCompleted,
      target: totalTarget,
    })
  }

  // console.timeEnd("getSummary")
  return summaries
}

export const FakeHabitScreen = observer(() => {
  const today = new Date()
  const formattedToday = today.toISOString().split("T")[0]

  const [selected, setSelected] = useState(formattedToday)
  const [period, setPeriod] = useState("30")
  const [showRaw, setShowRaw] = useState(false)

  const summary = getSummaryByPeriod(habitStore.habits, habitStore.activityLog, period)

  const handleAdd = () => {
    habitStore.addHabit("Health")
  }

  const handleInjectActivity = () => {
    habitStore.logActivity(formattedToday, 3)
  }

  const totalCompleted = summary.reduce((acc, s) => acc + s.completed, 0)
  const totalTarget = summary.reduce((acc, s) => acc + s.target, 0)

  // const weeklyCompletionData = useMemo(() => {
  // if (!habitStore.habits.length || !habitStore.activityLog.length) return []

  // const today = new Date()
  // const startOfWeek = new Date(today)
  // startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday start

  // const weekDatesSet = new Set(
  //   eachDayOfInterval({ start: startOfWeek, end: today }).map((date) =>
  //     format(date, "yyyy-MM-dd")
  //   )
  // )

const weeklyCompletionData = useMemo(() => {
  if (!habitStore.habits.length || !habitStore.activityLog.length) return []

  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday start

  const weekDatesSet = new Set(
    eachDayOfInterval({ start: startOfWeek, end: today }).map((date) =>
      format(date, "yyyy-MM-dd")
    )
  )

  return habitStore.habits.map((habit) => {
    const logs = habitStore.activityLog.filter((entry) =>
      weekDatesSet.has(entry.date?.slice(0, 10))
    )
    const totalCount = logs.reduce((acc, entry) => acc + entry.count, 0)
    const targetCount = habit.target * weekDatesSet.size
    const avgProgress = targetCount === 0 ? 0 : Math.round((totalCount / targetCount) * 100)

    return {
      habitName: habit.name,
      avgProgress,
      emoji: habit.emoji || "🔥",
    }
  })
}, [habitStore.habits, habitStore.activityLog])

// more stuff

const chartLength = 7 // or use dynamic value based on selected period

const habitWeeklyStatus = useMemo(() => {
  const today = new Date()
  const days = Array.from({ length: chartLength }).map((_, idx) => {
    const date = subDays(today, 6 - idx)
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
        if (!habit.frequency.includes(day.dayOfWeek)) return "grey"

        const logEntry = habitStore.activityLog.find(
          (entry) => entry.habitId === habit.id && entry.date === day.formatted
        )

        if (logEntry) {
          if (logEntry.count >= habit.target) return "green"
          if (logEntry.count > 0) return "yellow"
          return "red"
        }
        return "red"
      })

      return {
        habitName: habit.name,
        targetText: `${habit.target} ${habit.unit ?? ""} per day`,
        dayStatuses,
      }
    })
}, [habitStore.habits, habitStore.activityLog])

const habitWeeklyBreakdown = useMemo(() => {
  const today = new Date()
  const days = Array.from({ length: chartLength }).map((_, idx) =>
    subDays(today, chartLength - 1 - idx)
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

        if (!habit.frequency.includes(dayOfWeek)) return

        const logEntry = habitStore.activityLog.find(
          (entry) => entry.habitId === habit.id && entry.date === formattedDate
        )

        if (logEntry) {
          if (logEntry.count >= habit.target) completed += 1
          else if (logEntry.count > 0) partial += 1
          else missed += 1
        } else {
          missed += 1
        }
      })

      breakdown[habit.id] = { completed, partial, missed }
    })

  return breakdown
}, [habitStore.habits, habitStore.activityLog])





  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Calendar Nav Bar */}
      <View style={{ height: 100, width: "100%", borderBottomWidth: 1, borderColor: "#ccc" }}>
        <CalendarProvider date={selected}>
          <WeekCalendar
            current={selected}
            onDayPress={(day) => setSelected(day.dateString)}
            markedDates={{
              [selected]: { selected: true, selectedColor: "#3399ff" },
            }}
            firstDay={1}
          />
        </CalendarProvider>
      </View>

      {/* Scrollable Content */}
      {/* <ErrorBoundary fallback={<Text style={{ color: "red" }}>Something broke!</Text>}> */}
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 24, marginBottom: 10 }}>Fake Habit Screen</Text>

          <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
            {["7", "30", "90"].map((p) => (
              <Button key={p} title={`${p} Days`} onPress={() => setPeriod(p)} />
            ))}
          </View>

          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Total: {totalCompleted} / {totalTarget}
          </Text>

          <Button title={showRaw ? "Show Summary" : "Show Raw Data"} onPress={() => setShowRaw(!showRaw)} />

          {showRaw ? (
            <>
              <Text style={{ marginTop: 20, fontWeight: "bold" }}>Raw HabitStore:</Text>
              <Text>{JSON.stringify(habitStore.habits, null, 2)}</Text>

              <Text style={{ marginTop: 20, fontWeight: "bold" }}>Raw ActivityLog:</Text>
              <Text>{JSON.stringify(habitStore.activityLog, null, 2)}</Text>
            </>
          ) : (
            <>
              <Text style={{ marginTop: 10, fontWeight: "bold" }}>{period}-Day Summary:</Text>
              {summary.map((day) => (
                <Text key={day.date}>
                  {day.date}: {day.completed} / {day.target}
                </Text>
              ))}


              




              {weeklyCompletionData.map((habit, idx) => (
  <View
    key={`${habit.habitName}-${idx}`}
    style={{ marginVertical: 12, paddingHorizontal: 16 }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 18, marginRight: 8 }}>{habit.emoji}</Text>
      <Text style={{ flex: 1, fontSize: 16, color: "#444" }}>{habit.habitName}</Text>
      <Text style={{ fontWeight: "600", color: "#000" }}>{`${habit.avgProgress}%`}</Text>
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
    backgroundColor:
      habitStore.habits[idx]?.color ?? "#304FFE", // use habit's chosen color, fallback if missing
    height: "100%",
  }}
/>
    </View>
  </View>
))}

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

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
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

      <Text style={{ color: "#444", marginBottom: 4 }}>
        🔥 Current Streak: {habitWeeklyBreakdown[habitId]?.completed ?? 0} days
      </Text>
      <Text style={{ color: "#444", marginBottom: 4 }}>
        🏆 Longest Streak: {habitWeeklyBreakdown[habitId]?.completed ?? 0} days
      </Text>
      <Text style={{ color: "#444", marginBottom: 4 }}>
        ✅ Completed: {habitWeeklyBreakdown[habitId]?.completed ?? 0} days
      </Text>
      <Text style={{ color: "#444", marginBottom: 4 }}>
        🟡 Partial: {habitWeeklyBreakdown[habitId]?.partial ?? 0} days
      </Text>
      <Text style={{ color: "#444" }}>
        ❌ Missed: {habitWeeklyBreakdown[habitId]?.missed ?? 0} days
      </Text>
    </View>
  )
})}

            </>

            
          )}

          <Button title="Add Sample Habit" onPress={handleAdd} />
          <Button title="Inject Fake Activity" onPress={handleInjectActivity} />

          <Text style={{ marginTop: 20 }}>Number of habits: {habitStore.habits.length}</Text>
          {habitStore.habits.map((habit) => (
            <Text key={habit.id}>{habit.name}</Text>
          ))}
        </ScrollView>
      {/* </ErrorBoundary> */}
    </SafeAreaView>
  )
})



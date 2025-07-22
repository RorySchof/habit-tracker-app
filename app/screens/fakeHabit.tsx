


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

// import { ErrorBoundary } from "react-error-boundary"

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



// Statistics.tsx

import { observer } from "mobx-react-lite"
import React, { FC, useMemo } from "react"
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

const filters = [
  { title: "Day", abbr: "D", id: 1 },
  { title: "Week", abbr: "W", id: 2 },
  { title: "Month", abbr: "M", id: 3 },
  { title: "Three Months", abbr: "3M", id: 4 },
  { title: "Six Months", abbr: "6M", id: 5 },
  { title: "Year", abbr: "Y", id: 6 },
]

export const StatisticsScreen: FC<StatisticsScreenProps> = observer(function StatisticsScreen() {
  const [filter, setFilter] = React.useState("W")

  // Weekly completion progress calculation


const weeklyCompletionData = useMemo(() => {
  if (!habitStore.habits.length || !habitStore.activityLog.length) return [];

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start
  const weekDatesSet = new Set(
    eachDayOfInterval({ start: startOfWeek, end: today }).map(date =>
      format(date, "yyyy-MM-dd")
    )
  );

  const activityMap = new Map<string, number>();
  for (const log of habitStore.activityLog) {
    if (weekDatesSet.has(log.date)) {
      const current = activityMap.get(log.habitId) || 0;
      activityMap.set(log.habitId, current + log.count);
    }
  }

  const activeHabits = habitStore.habits.filter(h => !h.paused); // ✅ Skip paused

  return activeHabits.map(habit => {
    const totalCount = activityMap.get(habit.id) || 0;
    const avgProgress = Math.min((totalCount / habit.target) * 100, 100);
    return {
      habitName: habit.name,
      emoji: habit.emoji || "🔥",
      avgProgress: Math.round(avgProgress),
    };
  });
}, [
  habitStore.habits.map(h => h.id + h.target).join(","), // depend only on ids and targets
  habitStore.activityLog.length,                        // depend on log changes
]);


const completionSummary = useMemo(() => {
  if (!habitStore.habits.length) return { complete: 0, partial: 0, missed: 0 };

  let complete = 0;
  let partial = 0;
  let missed = 0;

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = subDays(today, i);
    const formattedDate = format(date, "yyyy-MM-dd");
    const dayOfWeek = format(date, "EEEE");

    const scheduledHabits = habitStore.habits.filter(
      habit => habit.frequency.includes(dayOfWeek) && !habit.paused // ✅ skip paused habits
    );

    if (scheduledHabits.length === 0) {
      missed += 1;
      continue;
    }

    let completedAll = true;
    let anyInput = false;

    for (const habit of scheduledHabits) {
      const logEntry = habitStore.activityLog.find(
        entry => entry.habitId === habit.id && entry.date === formattedDate
      );

      if (logEntry && logEntry.count > 0) {
        anyInput = true;
        if (logEntry.count < habit.target) {
          completedAll = false;
        }
      } else {
        completedAll = false;
      }
    }

    if (completedAll) {
      complete += 1;
    } else if (anyInput) {
      partial += 1;
    } else {
      missed += 1;
    }
  }

  return { complete, partial, missed };
}, [habitStore.habits, habitStore.activityLog]);


const habitWeeklyStatus = useMemo(() => {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = subDays(today, 6 - idx); // oldest to newest
    return {
      date,
      formatted: format(date, "yyyy-MM-dd"),
      dayOfWeek: format(date, "EEEE"),
    };
  });

  return habitStore.habits.filter(habit => !habit.paused).map(habit => {
    const dayStatuses = days.map(day => {
      if (!habit.frequency.includes(day.dayOfWeek)) {
        return "grey"; // not scheduled
      }

      const logEntry = habitStore.activityLog.find(
        entry => entry.habitId === habit.id && entry.date === day.formatted
      );

      if (logEntry) {
        if (logEntry.count >= habit.target) return "green";
        if (logEntry.count > 0) return "yellow";
        return "red";
      }

      return "red"; // scheduled but no activity
    });

    return {
      habitName: habit.name,
      targetText: `${habit.target} ${habit.unit} per day`,
      dayStatuses,
    };
  });
}, [habitStore.habits, habitStore.activityLog]);


const habitStreaks = useMemo(() => {
  const streaks: Record<string, number> = {};

  habitStore.habits.filter(habit => !habit.paused).forEach(habit => {
    // Call your store's helper function instead of inline logic
    streaks[habit.id] = habitStore.calculateHabitStreak(habit);
  });

  return streaks;
}, [habitStore.habits, habitStore.activityLog]);


const habitWeeklyTotals = useMemo(() => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start

  const weekDatesSet = new Set(
    eachDayOfInterval({ start: startOfWeek, end: today }).map(date =>
      format(date, "yyyy-MM-dd")
    )
  );

  const totals: Record<string, number> = {};

  habitStore.habits.filter(habit => !habit.paused).forEach(habit => {
    const totalCount = habitStore.activityLog
      .filter(log => log.habitId === habit.id && weekDatesSet.has(log.date))
      .reduce((acc, log) => acc + log.count, 0);

    totals[habit.id] = totalCount;
  });

  return totals;
}, [habitStore.habits, habitStore.activityLog]);

const habitWeeklyBreakdown = useMemo(() => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start

  const days = eachDayOfInterval({ start: startOfWeek, end: today });

  const breakdown: Record<string, { completed: number; partial: number; missed: number }> = {};

  habitStore.habits.filter(habit => !habit.paused).forEach(habit => {
    let completed = 0;
    let partial = 0;
    let missed = 0;

    days.forEach(date => {
      const formattedDate = format(date, "yyyy-MM-dd");
      const dayOfWeek = format(date, "EEEE");

      if (!habit.frequency.includes(dayOfWeek)) {
        return; // not scheduled that day
      }

      const logEntry = habitStore.activityLog.find(
        entry => entry.habitId === habit.id && entry.date === formattedDate
      );

      if (logEntry) {
        if (logEntry.count >= habit.target) {
          completed += 1;
        } else if (logEntry.count > 0) {
          partial += 1;
        } else {
          missed += 1;
        }
      } else {
        missed += 1;
      }
    });

    breakdown[habit.id] = { completed, partial, missed };
  });

  return breakdown;
}, [habitStore.habits, habitStore.activityLog]);

  // const filteredHabits = habitStore.habits

  const filteredHabits = habitStore.habits.filter(habit => !habit.paused);


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

  const renderDot = (color: string) => (
    <View style={[$dotStyle, { backgroundColor: color }]} />
  )

  const renderLegendComponent = () => (
    <View style={$legendContainer}>
      <View style={$legend}>{renderDot(colors.palette.secondary500)}<Text>Excellent: 80%</Text></View>
      <View style={$legend}>{renderDot(colors.palette.accent500)}<Text>Okay: 20%</Text></View>
    </View>
  )

  console.log("habits", getSnapshot(habitStore.habits))
  console.log("activityLog", getSnapshot(habitStore.activityLog))
  console.log("weeklyCompletionData", weeklyCompletionData)
  console.log("completionSummary", completionSummary);


  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$topContainer}>
        <Text text="Stats" preset="heading" />
        <MaterialCommunityIcons name="export-variant" size={24} />
      </View>

      <View style={$filtersContainer}>
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

      <View>
        <View style={$barChartOverviewContainer}>
          <Text text="Total Activities" preset="formLabel" />
          <Text text={`${percentage}%`} preset="heading" />
        </View>
        <View style={$barChartContainer}>
          <BarChart
            data={data}
            barWidth={20}
            width={layout.window.width * 0.77}
            height={layout.window.height * 0.3}
            initialSpacing={spacing.xs}
            spacing={spacing.lg}
            barBorderRadius={spacing.sm}
            yAxisThickness={0}
            noOfSections={5}
            xAxisType="dashed"
            xAxisColor={colors.palette.neutral400}
            yAxisTextStyle={{ color: colors.textDim }}
            stepValue={100}
            maxValue={1000}
            yAxisLabelSuffix="%"
            xAxisLabelTextStyle={$xAxisLabelText}
            showLine
            lineConfig={{
              color: colors.palette.accent500,
              thickness: 3,
              curved: true,
              hideDataPoints: true,
              shiftY: 20,
            }}
          />
        </View>
      </View>

      <View style={{ marginVertical: 16 }}>
        <Text preset="subheading">Weekly Completion %</Text>
        {weeklyCompletionData.map((habit, idx) => (
          <View key={`${habit.habitName}-${idx}`} style={{ marginVertical: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text text={habit.emoji} style={{ fontSize: 18, marginRight: 8 }} />
              <Text text={habit.habitName} style={{ flex: 1 }} />
              <Text text={`${habit.avgProgress}%`} />
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
                  backgroundColor: "#4caf50",
                  height: "100%",
                }}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 16 }}>
  <View style={{ alignItems: "center", padding: 12, backgroundColor: "#4CAF50", borderRadius: 12, flex: 1, marginHorizontal: 4 }}>
    <Text style={{ color: "white", fontWeight: "bold" }}>Complete</Text>
    <Text style={{ color: "white", fontSize: 18 }}>{completionSummary.complete} days</Text>
  </View>
  <View style={{ alignItems: "center", padding: 12, backgroundColor: "#FFC107", borderRadius: 12, flex: 1, marginHorizontal: 4 }}>
    <Text style={{ color: "white", fontWeight: "bold" }}>Partial</Text>
    <Text style={{ color: "white", fontSize: 18 }}>{completionSummary.partial} days</Text>
  </View>
  <View style={{ alignItems: "center", padding: 12, backgroundColor: "#F44336", borderRadius: 12, flex: 1, marginHorizontal: 4 }}>
    <Text style={{ color: "white", fontWeight: "bold" }}>Missed</Text>
    <Text style={{ color: "white", fontSize: 18 }}>{completionSummary.missed} days</Text>
  </View>
</View>


<View style={{ marginVertical: 16 }}>
  <Text preset="subheading">Weekly Habit Progress</Text>
  {habitWeeklyStatus.map((habit, idx) => (
    <View key={`${habit.habitName}-${idx}`} style={{ marginVertical: 12 }}>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>{habit.habitName}</Text>
      <Text style={{ color: "#666", marginBottom: 6 }}>{habit.targetText}</Text>
      <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
        {habit.dayStatuses.map((status, dayIdx) => (
          <View
            key={dayIdx}
            style={{
              width: 24,
              height: 24,
              marginRight: 6,
              borderRadius: 4,
              backgroundColor:
                status === "green"
                  ? "#4CAF50"
                  : status === "yellow"
                  ? "#FFC107"
                  : status === "red"
                  ? "#F44336"
                  : "#BDBDBD",
            }}
          />
        ))}
      </View>
        <Text style={{ color: "#444", marginTop: 4 }}>
      Longest Streak: {habitStreaks[habitStore.habits[idx]?.id] || 0} days
    </Text>
    <Text style={{ color: "#444", marginTop: 2 }}>
  Total this week: {habitWeeklyTotals[habitStore.habits[idx]?.id ?? ""] ?? 0} times
</Text>
<Text style={{ color: "#444", marginTop: 2 }}>
  ✅ Completed: {habitWeeklyBreakdown[habitStore.habits[idx]?.id ?? ""]?.completed ?? 0} days
</Text>
<Text style={{ color: "#444", marginTop: 2 }}>
  🟡 Partial: {habitWeeklyBreakdown[habitStore.habits[idx]?.id ?? ""]?.partial ?? 0} days
</Text>
<Text style={{ color: "#444", marginTop: 2 }}>
  ❌ Missed: {habitWeeklyBreakdown[habitStore.habits[idx]?.id ?? ""]?.missed ?? 0} days
</Text>
    </View>
  ))}
</View>

      <View style={{ alignItems: "center", marginVertical: spacing.xl }}>
        <PieChart
          data={pieData}
          donut
          showGradient
          sectionAutoFocus
          radius={90}
          innerRadius={60}
          innerCircleColor={colors.palette.secondary500}
          centerLabelComponent={() => (
            <View style={$pieChartLabelContainer}>
              <Text text="80%" preset="subheading" style={{ color: colors.palette.neutral100 }} />
              <Text text="Excellent" preset="formLabel" style={{ color: colors.palette.neutral100 }} />
            </View>
          )}
        />
        {renderLegendComponent()}
      </View>
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

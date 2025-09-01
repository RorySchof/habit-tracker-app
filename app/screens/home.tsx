// HOME SCREEN

import { observer } from "mobx-react-lite"
import React, { FC, useMemo, useState, useCallback, useEffect, useRef } from "react"
import {
  Image,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Alert,
} from "react-native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { AnimatedCircularProgress } from "react-native-circular-progress"

import { Card, Text, Toggle, Screen, Icon } from "app/components"
import layout from "app/utils/layout"
import {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet"

import { navigate } from "../navigators"
import { colors, spacing } from "../theme"
import { days } from "app/screens/create-new-habit"
import { HomeNavProps, HomeStackScreenProps } from "app/navigators/types"
import { $tabBarStyles } from "app/navigators/styles"

import { habitStore } from "app/models/habit-store"

import { format } from "date-fns"

import { WeekCalendar, CalendarProvider } from "react-native-calendars"

import { SafeAreaView } from "react-native-safe-area-context"

import { useFocusEffect } from "@react-navigation/native"

// import WeeklyCalendar from 'react-native-weekly-calendar';

import WeekStrip from "app/components/WeekStrip";

import dayjs from 'dayjs';




interface HabitType {
  id: number
  emoji: string
  name: string
  time: string
  finished: boolean
  current?: number
  target?: number
  unit?: string
  color?: string
  frequency?: string[]
  category?: string
  createdAt?: string
}

interface DayCardProps {
  day: string
  date: string
  progress: number
}


// === Your Provided Styles ===


const $container: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.xl,
  paddingBottom: 60,
}

const $topContainer: ViewStyle = {
  flexDirection: "row",
  gap: 18,
}

const $middleContainer: ViewStyle = {
  gap: 5,
}

const $bottomContainer: ViewStyle = {
  gap: 1,
}

const $headerContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $imageContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center", // 👈 optional: centers vertically if needed
  gap: 20,
}

colors.palette.primaryCompleted = "#304FFE"

const $headerBtn: ViewStyle = {
  backgroundColor: colors.palette.primaryCompleted,
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 99,
}

const $image: ImageStyle = {
  width: 50,
  height: 50,
}

const $cardContainer: ViewStyle = {
  borderWidth: 0,
  width: layout.window.width * 0.5,
  height: layout.window.height * 0.32,
}

const $headingContainer: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 15 }

const $emojiContainer: ViewStyle = {
  backgroundColor: colors.background,
  width: 48,
  height: 48,
  borderRadius: 99,
  alignItems: "center",
  justifyContent: "center",
}

const $emojiText: TextStyle = {
  lineHeight: 0,
  textAlign: "center",
}

const $circularProgressContainer: ViewStyle = { alignSelf: "center" }

const $circularProgressChildren: ViewStyle = { alignItems: "center" }

const $footerContainer: ViewStyle = {
  backgroundColor: colors.background,
  padding: spacing.xs,
  borderRadius: 10,
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
}

const $taskContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#fff", // Matches stats screen
  borderWidth: 1,
  borderColor: "#ccc", // Matches stats screen
  borderRadius: 8, // Matches stats screen
  paddingVertical: 12,
  paddingHorizontal: spacing.md,
// marginTop: spacing.xs,
  // Drop shadow styling
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
}

// const $taskLeftContainer: ViewStyle = {
//   flexDirection: "row",
//   gap: 15,
// }

const $taskLeftContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  flexShrink: 1,
  flexGrow: 1,
  flexBasis: "auto",
}

const $taskEmojiContainer: ViewStyle = {
  backgroundColor: colors.background,
  width: 44,
  height: 44,
  borderRadius: 99,
  alignItems: "center",
  justifyContent: "center",
}

const $checkboxInput: ViewStyle = {
  borderColor: colors.text,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
}

const $bottomSheetContainer: ViewStyle = {
  shadowColor: colors.text,
  shadowOffset: {
    width: 0,
    height: 12,
  },
  shadowOpacity: 0.58,
  shadowRadius: 16.0,
  elevation: 24,
}

const $bottomSheet: ViewStyle = {
  flex: 1,
  gap: spacing.lg,
  padding: spacing.md,
  marginTop: spacing.xs,
  backgroundColor: colors.palette.neutral100,
}

const $daysContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: spacing.md,
}

const $dayContainerStyle: ViewStyle = {
  backgroundColor: colors.palette.neutral200,
  borderRadius: 99,
  width: 44,
  height: 44,
  justifyContent: "center",
  alignItems: "center",
}

const $dayStyle: TextStyle = {
  lineHeight: 0,
  textAlign: "center",
}

const $frequencyContainer: ViewStyle = {
  flexDirection: "row",
  gap: 4,
}

const $labelStyle: TextStyle = { marginBottom: spacing.xs }

const $labelRequired: TextStyle = {
  color: colors.error,
}

const $reminder: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: colors.palette.neutral200,
  padding: spacing.sm,
  borderRadius: spacing.xs,
  marginTop: spacing.xs,
}

const $bottomSheetIcons: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

interface HomeScreenProps extends HomeStackScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = observer(function HomeScreen({ navigation }) {
  const today = new Date()
  const formattedToday = today.toISOString().split("T")[0]

  const [selected, setSelected] = useState(formattedToday)

  // Filter habits created today or earlier

const [calendarKey, setCalendarKey] = useState(0)

useFocusEffect(
  useCallback(() => {
    setCalendarKey((prev) => prev + 1) // 👈 forces remount
  }, [])
)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCalendarKey((prev) => prev + 1)
    }, 50)

    return () => clearTimeout(timeout)
  }, [selected])


  function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  const selectedDateObj = parseLocalDate(selected)

  function getLocalDateString(date: Date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const selectedLocalDateStr = getLocalDateString(selectedDateObj)

  const getTodayCount = (habitId: string) => {
    const today = selectedLocalDateStr
    const logEntry = habitStore.activityLog.find(
      (entry) => entry.habitId === habitId && entry.date === today,
    )
    return logEntry ? logEntry.count : 0
  }

  const selectedDay = selectedDateObj.toLocaleDateString("en-US", { weekday: "long" })

  const { habits, activityLog } = habitStore

  const filteredHabits = habits.filter((habit) => {
    if (!habit.createdAt || !habit.frequency) return false

    const habitCreatedAtDate = new Date(habit.createdAt)
    const habitLocalDateStr = getLocalDateString(habitCreatedAtDate)
    const includesDay = habit.frequency.includes(selectedDay)
    // const isBeforeOrOnSelectedDate = habitLocalDateStr <= selectedLocalDateStr
    // const isBeforeOrOnSelectedDate = habitCreatedAtDate <= selectedDateObj
    const isBeforeOrOnSelectedDate = habitLocalDateStr <= selectedLocalDateStr

    const shouldInclude = isBeforeOrOnSelectedDate && includesDay

    return shouldInclude
  })

  // Calendar marked dates from filteredHabits

  const markedDates: Record<string, any> = {}
  filteredHabits.forEach((habit) => {
    const dateKey = habit.createdAt!.split("T")[0]
    markedDates[dateKey] = {
      marked: true,
      dotColor: habit.color || colors.palette.primary400,
    }
  })

  // Ensure selected date is marked as selected

  markedDates[selected] = {
    ...(markedDates[selected] || {}),
    selected: true,
    selectedColor: '#304FFE',
  }

  const checkIns = filteredHabits
    .filter((habit) => habit.category === "health")
    .map((habit) => {
      const todayCount = getTodayCount(habit.id)
      return {
        emoji: habit.emoji || "💧",
        title: habit.name,
        name: habit.unit || "",
        amount: `${todayCount}/${habit.target}`,
        color: habit.color || colors.palette.primary300,
        fill: (todayCount / habit.target) * 100,
      }
    })

  // Day progress data based on selected day and frequency

  const dayProgressData = useMemo(() => {
    const dateObj = new Date(selected)
    const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short" })
    const dayNumber = dateObj.getDate().toString()

    const dayHabits = filteredHabits.filter((habit) => habit.frequency?.includes(dayLabel))

    const totalTarget = dayHabits.reduce((sum, h) => sum + h.target!, 0)
    const totalCurrent = dayHabits.reduce((sum, h) => sum + getTodayCount(h.id), 0)
    const progress = totalTarget === 0 ? 0 : Math.round((totalCurrent / totalTarget) * 100)

    return [
      {
        day: dayLabel,
        date: dayNumber,
        progress,
      },
    ]
  }, [
    selected,
    filteredHabits
      .map((h) => `${h.name}-${getTodayCount(h.id)}-${h.target}-${h.frequency}`)
      .join(","),
  ])

const $checkInCardStyle: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.sm,
  marginRight: spacing.sm,

  // 🟦 Manual border
  borderWidth: 1,
  borderColor: colors.palette.neutral400,

  // 🌫️ Optional subtle shadow
  elevation: 2,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },

  width: layout.window.width * 0.5,
  height: layout.window.height * 0.32,
  overflow: "hidden",
  justifyContent: "space-between",
}




  // const calendarSafeWidth = layout.window.width - spacing.md * 2


  return (
  <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#fff"   }}>



    {/* ⬆️ Calendar as navbar */}

<View
  style={{
    height: 60,
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.palette.neutral300,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <TouchableOpacity
    onPress={() => setSelected(dayjs(selected).subtract(1, 'week').format('YYYY-MM-DD'))}
    style={{ paddingHorizontal: 10 }}
  >
    <Text size="md" weight="bold" style={{ color: '#304FFE' }}>{'‹'}</Text>
  </TouchableOpacity>

  <CalendarProvider date={selected} onDateChanged={setSelected}>
    <WeekStrip
      selectedDate={selected}
      onSelectDate={(date) => setSelected(date)}
    />
  </CalendarProvider>

  

  <TouchableOpacity
    onPress={() => setSelected(dayjs(selected).add(1, 'week').format('YYYY-MM-DD'))}
    style={{ paddingHorizontal: 10 }}
  >
    <Text size="md" weight="bold" style={{ color: '#304FFE' }}>{'›'}</Text>
  </TouchableOpacity>
</View>


{/* 👇 Scrollable main content */}







{/* 
<View
  style={{
    height: 120,
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.palette.neutral300,
    overflow: "hidden",
  }}
>
  <CalendarProvider date={selected} onDateChanged={setSelected}>
    <WeekStrip selectedDate={selected} 
    onSelectDate={(date) => setSelected(date)}
    />
    <WeekCalendar
      key={`calendar-${calendarKey}`}
      current={selected}
      onDayPress={(day) => setSelected(day.dateString)}
      onWeekChange={() => setCalendarKey((prev) => prev + 1)}
      markedDates={{
        [selected]: {
          selected: true,
          marked: true,
          selectedColor: "#304FFE",
        },
      }}
      firstDay={1}
      disableWeekScroll={false}
      calendarWidth={layout.window.width - spacing.md * 2}
      theme={{
        calendarBackground: "transparent",
        backgroundColor: "transparent",
        borderColor: "transparent",
        dayTextColor: colors.palette.neutral800,
        todayTextColor: "#304FFE",
        selectedDayBackgroundColor: "#304FFE",
        selectedDayTextColor: "#FFFFFF",
      }}
      style={{
        backgroundColor: "transparent",
        borderWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      }}
    />
  </CalendarProvider>
</View> */}


    {/* 👇 Scrollable main content */}


    <Screen preset="scroll" safeAreaEdges={["bottom"]} contentContainerStyle={$container}>
      <BottomSheetModalProvider>

        {/* 👤 Header */}


        {/* <View style={$headerContainer}>
          <View style={$imageContainer}>
            <Text
              text={format(new Date(), "EEEE, MMMM d")}
              weight="bold"
              style={{ fontSize: 20, textAlign: "center" }}
            />
          </View>
          <View style={$headerBtn}>
            <MaterialCommunityIcons
              name="test-tube"
              color="#FFFFFF"
              size={28}
              onPress={() => navigation.navigate("ExperimentalStats")}
              style={{ marginRight: 12 }}
            />
            <MaterialCommunityIcons
              name="plus"
              color="#FFFFFF"
              size={28}
              onPress={() => navigation.navigate("CreateHabit")}
            />
          </View>
        </View> */}




        {/* ✅ Check-In Cards */}

        
        <View style={{ gap: spacing.md }}>
          <Text tx="homeScreen.check_in" preset="subheading" />
          <ScrollView
            contentContainerStyle={$middleContainer}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {checkIns.map((checkIn, i) => (
              <Card
                key={`${checkIn.title}-${i}`}
                style={$checkInCardStyle}
                verticalAlignment="space-between"
                wrapperStyle={{ padding: spacing.sm }}
                HeadingComponent={
                  <View style={$headingContainer}>
                    <View style={$emojiContainer}>
                      <Text text={checkIn.emoji} size="xl" style={$emojiText} />
                    </View>
                    <Text
                      text={checkIn.title}
                      size="md"
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      style={{ flexShrink: 1, textAlign: "center" }}
                    />
                  </View>
                }
                ContentComponent={
                  <AnimatedCircularProgress
                    size={95}
                    width={10}
                    fill={checkIn.fill}
                    rotation={360}
                    tintColor={checkIn.color}
                    backgroundColor={colors.palette.neutral200}
                    style={$circularProgressContainer}
                  >
                    {() => (
                      <View style={$circularProgressChildren}>
                        <Text text={checkIn.amount} size="md" />
                        <Text text={checkIn.name} size="xs" />
                      </View>
                    )}
                  </AnimatedCircularProgress>
                }
                FooterComponent={
                  <View style={$footerContainer}>
                    {(() => {
                      const matchedHabit = filteredHabits.find((h) => h.name === checkIn.title)
                      if (!matchedHabit) return null
                      const todayCount = getTodayCount(matchedHabit.id)
                      const isAtMax = todayCount >= matchedHabit.target
                      const isAtMin = todayCount <= 0
                      return (
                        <>
                          <Pressable
                            disabled={isAtMin}
                            onPress={() => habitStore.decrementHabit(matchedHabit.id, selected)}
                          >
                            <MaterialCommunityIcons
                              name="minus"
                              color={isAtMin ? "gray" : colors.palette.neutral500}
                              size={24}
                            />
                          </Pressable>
                          <Text text="|" style={{ color: colors.palette.neutral500 }} />
                          <Pressable
                            disabled={isAtMax}
                            onPress={() => habitStore.incrementHabit(matchedHabit.id, selected)}
                          >
                            <MaterialCommunityIcons
                              name="plus"
                              color={isAtMax ? "gray" : colors.palette.neutral500}
                              size={24}
                            />
                          </Pressable>
                        </>
                      )
                    })()}
                  </View>
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* ✅ Today's Habit List */}
        <View style={{ gap: spacing.md }}>
          <Text tx="homeScreen.today" preset="subheading" />
          <View style={$bottomContainer}>
            {filteredHabits.map((habit, idx) => {
              const todayCount = getTodayCount(habit.id)
              const transformedHabit = {
                id: habit.id,
                name: habit.name || "Unnamed Habit",
                emoji: habit.emoji || "🔥",
                time: habit.time || "08:00",
                current: todayCount,
                target: habit.target || 1,
                finished: habit.finished ?? false,
                paused: habit.paused,
              }
              return (
                <View key={`${habit.id}-${idx}`} style={{ marginBottom: 12 }}>
                  <Habit task={transformedHabit} navigation={navigation} />
                </View>
              )
            })}
          </View>
        </View>
      </BottomSheetModalProvider>
    </Screen>
  </SafeAreaView>
)
})


interface HabitProps {
  task: HabitType
  navigation: HomeNavProps
}

export const Habit = observer(function Habit({ task, navigation }: HabitProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.present()
    setIsSheetOpen(true)
  }, [])

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} />,
    [],
  )

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: isSheetOpen ? { display: "none" } : $tabBarStyles,
    })
  }, [isSheetOpen])

  const isCompleted = Number(task.current ?? 0) >= Number(task.target ?? 1)

  return (
    <>
      <TouchableOpacity
        style={[$taskContainer, { opacity: task.finished ? 0.6 : 1 }]}


        //THIS ON PRESS DIRECTS THE TODAY Cards
        
        // onPress={handleOpenSheet}
      >
        {/* Left side: emoji + name */}

        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
  <View style={$taskEmojiContainer}>
    <Text text={task.emoji} size="lg" style={$emojiText} />
  </View>
  <Text
    text={task.name}
    numberOfLines={1}
    ellipsizeMode="tail"
    style={{
      flex: 1,
      marginRight: 12, // adds space between text and icons
    }}
  />
</View>

        {/* ✅ Right side: icons wrapped together */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexShrink: 0,
            gap: 12,
          }}
        >
          {/* Checkmark */}
          {isCompleted ? (
            <MaterialCommunityIcons name="check-circle" size={24} color="#304FFE" />
          ) : (
            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="#ccc" />
          )}

          {/* Pause button */}
          <TouchableOpacity
            onPress={() => habitStore.togglePauseHabit(task.id)}
            style={{
              padding: 4,
              borderRadius: 6,
              backgroundColor: task.paused ? "lightgreen" : "transparent",
            }}
          >
            <MaterialCommunityIcons
              name={task.paused ? "pause-circle" : "pause-circle-outline"}
              size={24}
              color={task.paused ? colors.palette.accent500 : colors.palette.neutral500}
            />
          </TouchableOpacity>

            {/* Edit button */}
  <TouchableOpacity
    onPress={() =>
      navigate("EditHabit", {
        habitId: task.id,
      })
    }
  >
    <MaterialCommunityIcons
      name="pencil"
      size={24}
      color={colors.palette.neutral500}
    />
  </TouchableOpacity>

          {/* Trash button */}
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Delete Habit",
                `Are you sure you want to delete "${task.name}"?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => habitStore.removeHabit(task.id),
                  },
                ],
                { cancelable: true },
              )
            }
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={24}
              color={colors.palette.neutral500}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={[500, "70%"]}
        backdropComponent={renderBackdrop}
        style={$bottomSheetContainer}
        onDismiss={() => setIsSheetOpen(false)}
      >
        <BottomSheetView style={$bottomSheet}>
          <View style={$bottomSheetIcons}>
            <View style={$taskEmojiContainer}>
              <Text text={task.emoji} size="lg" style={$emojiText} />
            </View>
            <View style={$taskEmojiContainer}>
              <Icon
                icon="pencil"
                size={16}
                onPress={() =>
                  navigate("EditHabit", {
                    habitId: task.id,
                  })
                }
              />
            </View>
          </View>
          <Text text={task.name} preset="heading" size="xl" />
          <View style={$daysContainer}>
            {days?.map((d, idx) => (
              <View key={`day-${d.day}-${idx}`} style={$dayContainerStyle}>
                <Text text={d.abbr} style={$dayStyle} size="md" />
              </View>
            ))}
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <View style={$frequencyContainer}>
              <Text preset="formLabel" text="Habit time" style={$labelStyle} />
              <Text text="*" style={$labelRequired} />
            </View>
            <View
              style={{
                backgroundColor: colors.palette.neutral200,
                width: layout.window.width * 0.25,
                padding: spacing.sm,
                borderRadius: spacing.sm,
              }}
            >
              <Text text={task.time} />
            </View>
          </View>
          <View>
            <View>
              <Text preset="formLabel" text="Reminders" style={$labelStyle} />
            </View>
            <View style={$reminder}>
              <Text text="30 minutes before" size="md" />
              <Icon icon="caretRight" />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
})

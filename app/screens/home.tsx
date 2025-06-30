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

const $dayCard: ViewStyle = { gap: 8 }

const DayCard = ({ day, date, progress }: DayCardProps) => (
  <View style={$dayCard}>
    <Text text={day} />
    <AnimatedCircularProgress
      size={32}
      width={3}
      fill={progress}
      tintColor={colors.palette.primary400}
      backgroundColor={colors.palette.neutral100}
    >
      {() => <Text text={date} size="xs" />}
    </AnimatedCircularProgress>
  </View>
)

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
  gap: 20,
}

const $bottomContainer: ViewStyle = {
  gap: 10,
}

const $headerContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $imageContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 20,
}

const $headerBtn: ViewStyle = {
  backgroundColor: colors.palette.primary600,
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
  backgroundColor: colors.palette.neutral100,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: spacing.sm,
}

const $taskLeftContainer: ViewStyle = {
  flexDirection: "row",
  gap: 15,
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

  // Filter habits created today or earlier

  const [selected, setSelected] = useState(formattedToday)

  function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  const selectedDateObj = parseLocalDate(selected)

  // const selectedDay = selectedDateObj.toLocaleDateString("en-US", { weekday: "short" })

  const selectedDay = selectedDateObj.toLocaleDateString("en-US", { weekday: "long" })

  function getLocalDateString(date: Date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const selectedLocalDateStr = getLocalDateString(selectedDateObj)

  const filteredHabits = habitStore.habits.filter((habit) => {
    if (!habit.createdAt || !habit.frequency) return false

    const habitCreatedAtDate = new Date(habit.createdAt)
    const habitLocalDateStr = getLocalDateString(habitCreatedAtDate)
    const includesDay = habit.frequency.includes(selectedDay)
    // const isBeforeOrOnSelectedDate = habitLocalDateStr <= selectedLocalDateStr
    // const isBeforeOrOnSelectedDate = habitCreatedAtDate <= selectedDateObj
    const isBeforeOrOnSelectedDate = habitLocalDateStr <= selectedLocalDateStr

    const shouldInclude = isBeforeOrOnSelectedDate && includesDay

    return shouldInclude

    // return isBeforeOrOnSelectedDate && includesDay
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
    selectedColor: "#3399ff",
  }

  // Check-ins for health category habits
  const checkIns = filteredHabits
    .filter((habit) => habit.category === "health")
    .map((habit) => ({
      emoji: habit.emoji || "💧",
      title: habit.name,
      name: habit.unit || "",
      amount: `${habit.current}/${habit.target}`,
      color: habit.color || colors.palette.primary300,
      fill: (habit.current / habit.target) * 100,
    }))

  // Day progress data based on selected day and frequency
  const dayProgressData = useMemo(() => {
    const dateObj = new Date(selected)
    const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short" })
    const dayNumber = dateObj.getDate().toString()

    const dayHabits = filteredHabits.filter((habit) => habit.frequency?.includes(dayLabel))

    const totalTarget = dayHabits.reduce((sum, h) => sum + h.target!, 0)
    const totalCurrent = dayHabits.reduce((sum, h) => sum + h.current!, 0)
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
    filteredHabits.map((h) => `${h.name}-${h.current}-${h.target}-${h.frequency}`).join(","),
  ])

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <BottomSheetModalProvider>
        <View style={$headerContainer}>
          <View style={$imageContainer}>
            <Image source={require("../../assets/images/avatar-2.png")} style={$image} />
            <Text text={format(new Date(), "EEEE, MMMM d")} size="xl" weight="bold" />
          </View>
          <View style={$headerBtn}>
            <MaterialCommunityIcons
              name="plus"
              color={colors.palette.neutral100}
              size={28}
              onPress={() => navigation.navigate("CreateHabit")}
            />
          </View>
        </View>

        <View style={$topContainer}>
          <View style={{ width: "100%", height: 100 }}>
            <CalendarProvider date={selected} onDateChanged={setSelected}>
              <WeekCalendar
                current={selected}
                onDayPress={(day) => setSelected(day.dateString)}
                markedDates={markedDates}
                firstDay={1}
                style={{ width: "100%" }}
              />
            </CalendarProvider>
          </View>

          {dayProgressData.map((d) => (
            <DayCard key={d.day} day={d.day} date={d.date} progress={d.progress} />
          ))}
        </View>

        <View style={{ gap: spacing.md }}>
          <Text tx="homeScreen.check_in" preset="subheading" />
          <View>
            <ScrollView
              contentContainerStyle={$middleContainer}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {checkIns.map((checkIn, i) => (
                <Card
                  key={`${checkIn.title}-${i}`}
                  style={$cardContainer}
                  verticalAlignment="space-between"
                  wrapperStyle={{ padding: spacing.sm }}
                  HeadingComponent={
                    <View style={$headingContainer}>
                      <View style={$emojiContainer}>
                        <Text text={checkIn.emoji} size="xl" style={$emojiText} />
                      </View>
                      <Text text={checkIn.title} size="md" />
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
                      <Pressable onPress={() => habitStore.decrementHabit(checkIn.title)}>
                        <MaterialCommunityIcons name="minus" color={colors.palette.neutral500} />
                      </Pressable>
                      <Text text="|" style={{ color: colors.palette.neutral500 }} />
                      <Pressable onPress={() => habitStore.incrementHabit(checkIn.title)}>
                        <MaterialCommunityIcons name="plus" color={colors.palette.neutral500} />
                      </Pressable>
                    </View>
                  }
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Text tx="homeScreen.today" preset="subheading" />
          <View style={$bottomContainer}>
            {filteredHabits.map((habit, idx) => {
              const transformedHabit = {
                // id: Number(habit.id),
                id: habit.id, // ✅ leave it as string

                name: habit.name || "Unnamed Habit",
                emoji: habit.emoji || "🔥",
                time: habit.time || "08:00",
                current: habit.current || 0,
                target: habit.target || 1,
                finished: habit.finished ?? false,
              }

              const isCompleted = transformedHabit.current >= transformedHabit.target

              return (
                <View key={`${habit.id}-${idx}`} style={{ marginBottom: 12 }}>
                  <Habit task={transformedHabit} navigation={navigation} />
                  {isCompleted && (
                    <Text style={{ color: "green", fontWeight: "bold", marginTop: 4 }}>
                      ✓ Completed
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      </BottomSheetModalProvider>
    </Screen>
  )
})

interface HabitProps {
  task: HabitType
  navigation: HomeNavProps
}

function Habit({ task, navigation }: HabitProps) {
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

  return (
    <>
      <TouchableOpacity
        style={[
          $taskContainer,
          {
            opacity: task.finished ? 0.6 : 1,
          },
        ]}
        onPress={handleOpenSheet}
      >
        <View style={$taskLeftContainer}>
          <View style={$taskEmojiContainer}>
            <Text text={task.emoji} size="lg" style={$emojiText} />
          </View>

          <View>
            <Text text={task.name} />
            {/* <Text text={`start at ${task.time}`} size="xs" style={{ color: colors.textDim }} /> */}
          </View>
        </View>

        <Toggle
          variant="checkbox"
          inputOuterStyle={$checkboxInput}
          value={task.current >= task.target}
        />

        {/* Trash icon button */}
        <TouchableOpacity
          onPress={() => {
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
          }}
          style={{ marginLeft: 12 }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={24}
            color={colors.palette.neutral500}
          />
        </TouchableOpacity>
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
}

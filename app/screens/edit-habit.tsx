// edit habit modal screen

import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle } from "react-native"
import EmojiPicker from "rn-emoji-keyboard"
import ColorPicker, { HueSlider, Panel1, Preview } from "reanimated-color-picker"
import {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet"
import DateTimePicker from "@react-native-community/datetimepicker"

import { Text, Screen, Icon, Button, TextField, Toggle } from "app/components"
import layout from "app/utils/layout"

import { HomeStackScreenProps } from "../navigators/types"
import { colors, spacing } from "../theme"
import { days, reminders } from "app/screens/create-new-habit"
import { habitStore } from "app/models/habit-store"

interface EditHabitScreenProps extends HomeStackScreenProps<"EditHabit"> {}

function parseTimeStringToDate(time: string): Date {
  const [hourStr, minuteStr] = time.split(":")
  const date = new Date()
  date.setHours(Number(hourStr))
  date.setMinutes(Number(minuteStr))
  date.setSeconds(0)
  return date
}

export const EditHabitScreen: FC<EditHabitScreenProps> = observer(function EditHabitScreen({
  navigation,
  route,
}) {
  console.log("route.params:", route.params)
  console.log(
    "habitStore.habits ids:",
    habitStore.habits.map((h) => h.id),
  )

  // const habitId = String(route.params.params?.habitId)

  // const habitId = String(route.params.habitId)

  const habitId = route.params.habitId
  const task = habitStore.habits.find((h) => h.id === habitId)

  // const task = habitStore.habits.find((h) => h.id === String(habitId))

  if (!task) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
        <View style={$headerContainer}>
          <Icon icon="x" color={colors.text} onPress={() => navigation.goBack()} />
          <Text text="Edit habit" preset="heading" size="lg" />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text text="Habit not found." preset="subheading" />
          <Button
            text="Go Back"
            style={$btn}
            textStyle={{ color: colors.palette.neutral100 }}
            onPress={() => navigation.goBack()}
          />
        </View>
      </Screen>
    )
  }

  const [open, setOpen] = React.useState(false)
  const [reminder, setReminder] = React.useState("30 minutes before")
  const [selectedEmoji, setSelectedEmoji] = React.useState(task?.emoji ?? "😂")
  const [colorPicked, setColorPicked] = React.useState(task?.color ?? "#ff0000")

  // const [habitTime, setHabitTime] = React.useState(
  //   task?.time ? parseTimeStringToDate(task.time) : new Date()
  // )

  const [habitTime, setHabitTime] = React.useState(() => {
    if (task?.time && task.time.includes(":")) {
      const parsed = parseTimeStringToDate(task.time)
      return isNaN(parsed.getTime()) ? new Date() : parsed
    }
    return new Date()
  })

  const [frequency, setFrequency] = React.useState(
    task?.frequency
      ? task.frequency
          .map((dayStr) => days.find((d) => d.day === dayStr))
          .filter((d): d is (typeof days)[0] => !!d)
      : [],
  )

  const bottomSheetColorRef = React.useRef<BottomSheetModal>(null)
  const bottomSheetReminderRef = React.useRef<BottomSheetModal>(null)

  const handleOpenColorSheet = React.useCallback(() => {
    bottomSheetColorRef.current?.present()
  }, [])
  const handleOpenReminderSheet = React.useCallback(() => {
    bottomSheetReminderRef.current?.present()
  }, [])
  const renderBackdrop = React.useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} />,
    [],
  )

  const handleSelectFrequency = (day: (typeof days)[0]) => {
    let newFrequency = [...frequency]
    const found = newFrequency.findIndex((f) => f.day === day.day)
    if (found === -1) {
      newFrequency.push(day)
    } else {
      newFrequency = newFrequency.filter((f) => f.day !== day.day)
    }
    setFrequency(newFrequency)
  }

  // const handleSave = () => {
  //   console.log("Attempting to save habit...")

  //   if (task) {
  //     console.log("Found task:", task)

  //     // task.emoji = selectedEmoji
  //     // task.color = colorPicked
  //     // task.frequency = frequency.map((f) => f.day)
  //     // task.time = habitTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  //     console.log("Updated task:", {
  //       emoji: task.emoji,
  //       color: task.color,
  //       frequency: task.frequency,
  //       time: task.time,
  //     })

  //     // If you have persistence
  //     if (habitStore.saveHabits) {
  //       habitStore.saveHabits()
  //       console.log("Habit store saved.")
  //     } else {
  //       console.log("habitStore.saveHabits not defined.")
  //     }
  //   } else {
  //     console.log("Task not found. Cannot save.")
  //   }

  //   navigation.navigate("Home")
  //   console.log("Navigated to Home.")
  // }

  const handleSave = () => {
    console.log("Attempting to save habit...")

    if (task) {
      console.log("Found task:", task)

      habitStore.updateHabit(task.id, {
        emoji: selectedEmoji,
        color: colorPicked,
        frequency: frequency.map((f) => f.day),
        time: habitTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })

      console.log("Updated task:", {
        emoji: selectedEmoji,
        color: colorPicked,
        frequency: frequency.map((f) => f.day),
        time: habitTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })

      if (habitStore.saveHabits) {
        habitStore.saveHabits()
        console.log("Habit store saved.")
      } else {
        console.log("habitStore.saveHabits not defined.")
      }
    } else {
      console.log("Task not found. Cannot save.")
    }

    navigation.navigate("Home")
    console.log("Navigated to Home.")
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <BottomSheetModalProvider>
        <View style={$headerContainer}>
          <Icon icon="x" color={colors.text} onPress={() => navigation.goBack()} />
          <Text text="Edit habit" preset="heading" size="lg" />
        </View>
        <View style={$subheaderContainer}>
          <TouchableOpacity style={$pillContainer} onPress={() => setOpen(!open)}>
            <Text text={selectedEmoji} />
            <Text text="icon" preset="formLabel" size="md" />
          </TouchableOpacity>
          <EmojiPicker
            onEmojiSelected={(selected) => setSelectedEmoji(selected.emoji)}
            open={open}
            onClose={() => setOpen(!open)}
          />
          <TouchableOpacity style={$pillContainer} onPress={handleOpenColorSheet}>
            <View style={[$pickedColor, { backgroundColor: colorPicked }]} />
            <Text text="color" preset="formLabel" size="md" />
          </TouchableOpacity>
          <BottomSheetModal
            ref={bottomSheetColorRef}
            snapPoints={[200, "50%"]}
            backdropComponent={renderBackdrop}
          >
            <BottomSheetView style={$bottomSheet}>
              <ColorPicker
                style={$colorPicker}
                value={colorPicked}
                onComplete={({ hex }) => setColorPicked(hex)}
              >
                <Panel1 />
                <HueSlider />
                <Preview />
              </ColorPicker>
            </BottomSheetView>
          </BottomSheetModal>
        </View>

        <View style={$inputsContainer}>
          <TextField
            label="Habit Name"
            placeholder="Go to the GYM"
            required
            value={task?.name}
            // Optionally add onChangeText and bind to local state + task.name
          />
          <TextField label="Description" placeholder="Extra details" />
        </View>

        <View style={$gap}>
          <View style={$frequencyContainer}>
            <Text preset="formLabel" text="Frequency" style={$labelStyle} />
            <Text text="*" style={$labelRequired} />
          </View>
          <View style={$daysContainer}>
            {days.map((d, idx) => (
              <TouchableOpacity
                key={`day-${d.day}-${idx}`}
                style={[
                  $dayContainerStyle,
                  {
                    backgroundColor: frequency.find((f) => f.day === d.day)
                      ? colors.palette.primary600
                      : colors.palette.neutral100,
                  },
                ]}
                onPress={() => handleSelectFrequency(d)}
              >
                <Text
                  text={d.abbr}
                  style={[
                    $dayStyle,
                    {
                      color: frequency.find((f) => f.day === d.day)
                        ? colors.palette.neutral100
                        : colors.text,
                    },
                  ]}
                  size="md"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={$gap}>
          <View style={$frequencyContainer}>
            <Text preset="formLabel" text="Habit time" style={$labelStyle} />
            <Text text="*" style={$labelRequired} />
          </View>
          <DateTimePicker
            testID="dateTimePicker"
            style={$dateTimePicker}
            value={habitTime}
            mode="time"
            is24Hour={false}
            locale="en-US"
            accentColor={colors.palette.neutral100}
            onChange={(_, selectedDate) => setHabitTime(new Date(selectedDate!))}
          />
        </View>

        <View style={$gap}>
          <View style={$remindersContainer}>
            <Text preset="formLabel" text="Reminders" style={$labelStyle} />
            <Toggle
              variant="switch"
              value={!!reminder}
              onValueChange={() => setReminder(reminder ? "" : "30 minutes before")}
              inputInnerStyle={{
                backgroundColor: reminder ? colors.success : colors.palette.neutral100,
              }}
              inputOuterStyle={{
                backgroundColor: colors.palette.neutral400,
              }}
            />
          </View>
          {reminder && (
            <TouchableOpacity style={$reminder} onPress={handleOpenReminderSheet}>
              <Text text={reminder} size="md" />
              <Icon icon="caretRight" />
            </TouchableOpacity>
          )}
          <BottomSheetModal
            ref={bottomSheetReminderRef}
            snapPoints={[200, "50%"]}
            backdropComponent={renderBackdrop}
          >
            <BottomSheetView style={$reminderBottomSheet}>
              {reminders.map((r, idx) => (
                <TouchableOpacity
                  key={`reminder-${r.id}-${idx}`}
                  style={$gap}
                  onPress={() => {
                    setReminder(r.name)
                    bottomSheetReminderRef.current?.close()
                  }}
                >
                  <Text text={r.name} size="md" style={{ marginLeft: spacing.md }} />
                  <View style={$separator} />
                </TouchableOpacity>
              ))}
            </BottomSheetView>
          </BottomSheetModal>
        </View>

        <Button style={$btn} textStyle={{ color: colors.palette.neutral100 }} onPress={handleSave}>
          Save changes
        </Button>
      </BottomSheetModalProvider>
    </Screen>
  )
})

// [styles unchanged — you can keep your existing style declarations]

const $container: ViewStyle = {
  paddingHorizontal: spacing.md,
  gap: spacing.xl,
  flex: 1,
}

const $headerContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 24,
}

const $btn: ViewStyle = {
  backgroundColor: colors.palette.primary600,
  borderWidth: 0,
  borderRadius: spacing.xs,
}

const $pillContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.xs,
  padding: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-around",
  width: layout.window.width * 0.25,
}

const $subheaderContainer: ViewStyle = {
  flexDirection: "row",
  gap: 24,
}

const $pickedColor: ViewStyle = { width: 18, height: 18, borderRadius: 99 }

const $bottomSheet: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $colorPicker: ViewStyle = { width: "50%", gap: 8 }

const $inputsContainer: ViewStyle = {
  gap: 16,
}

const $frequencyContainer: ViewStyle = {
  flexDirection: "row",
  gap: 4,
}

const $labelStyle: TextStyle = { marginBottom: spacing.xs }

const $labelRequired: TextStyle = {
  color: colors.error,
}

const $daysContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
}
const $dayContainerStyle: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
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

const $gap: ViewStyle = { gap: 8 }

const $dateTimePicker: ViewStyle = {
  alignSelf: "flex-start",
  // backgroundColor: colors.palette.neutral100,
}

const $remindersContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $reminder: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  padding: spacing.sm,
  borderRadius: spacing.xs,
  marginTop: spacing.xs,
}

const $reminderBottomSheet: ViewStyle = {
  flex: 1,
  gap: spacing.lg,
  padding: spacing.sm,
  marginTop: spacing.xs,
  backgroundColor: colors.palette.neutral100,
}

const $separator: ViewStyle = { width: "100%", height: 2, backgroundColor: colors.background }

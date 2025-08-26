// Create new habit screen

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

import { habitStore } from "app/models/habit-store"

export const days = [
  {
    day: "Sunday",
    abbr: "S",
  },
  {
    day: "Monday",
    abbr: "M",
  },
  {
    day: "Tuesday",
    abbr: "T",
  },
  {
    day: "Wednesday",
    abbr: "W",
  },
  {
    day: "Thursday",
    abbr: "T",
  },
  {
    day: "Friday",
    abbr: "F",
  },
  {
    day: "Saturday",
    abbr: "S",
  },
]

export const reminders = [
  {
    id: 1,
    name: "At the habit time",
  },
  {
    id: 2,
    name: "5 minutes before",
  },
  {
    id: 3,
    name: "10 minutes before",
  },
  {
    id: 4,
    name: "15 minutes before",
  },
  {
    id: 5,
    name: "30 minutes before",
  },
]

interface CreateNewHabitScreenProps extends HomeStackScreenProps<"CreateNewHabit"> {}

export const CreateNewHabitScreen: FC<CreateNewHabitScreenProps> = observer(
  function CreateNewHabitScreen({ navigation }) {
    const [open, setOpen] = React.useState(false)
    const [reminder, setReminder] = React.useState("")
    const [selectedEmoji, setSelectedEmoji] = React.useState("📚")
    const [colorPicked, setColorPicked] = React.useState("#ff0000")
    // const [colorOpen, setColorOpen] = useState(false) 
    const [habitTime, setHabitTime] = React.useState(new Date())

    const [habitDate, setHabitDate] = React.useState(new Date())

    // const [frequency, setFrequency] = React.useState<(typeof days)[0][]>([])

    const [frequency, setFrequency] = React.useState<string[]>([])

    const [name, setName] = React.useState("")
    const [category, setCategory] = React.useState("health") // double check health here, Why? seems sketchy
    const [target, setTarget] = React.useState(1)
    const [unit, setUnit] = React.useState("times")

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
      if (frequency.includes(day.day)) {
        setFrequency(frequency.filter((d) => d !== day.day))
      } else {
        setFrequency([...frequency, day.day])
      }
    }


    const handleCreateHabit = () => {
      habitStore.addHabit({
        name,
        emoji: selectedEmoji,
        date: habitDate.toISOString(), // <-- add this
        time: habitTime.toISOString(),
        category,
        target,
        unit,
        color: colorPicked,
        frequency,
        // reminder,
      })
      navigation.navigate("Home")
    }

    return (
      <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
        <BottomSheetModalProvider>
          <View style={$cardContainer}>
            <View style={$headerContainer}>
              <Icon icon="back" color={colors.text} onPress={() => navigation.goBack()} />
              <Text text="Create Habit" preset="heading" size="lg" />
            </View>
            <View style={$subheaderContainer}>
              <TouchableOpacity style={$pillContainer} onPress={() => setOpen(!open)}>
                <Text text={selectedEmoji} />
                <Text text="icon" preset="formLabel" size="md" />
              </TouchableOpacity>
              <EmojiPicker
                onEmojiSelected={(selected) => {
                  setSelectedEmoji(selected.emoji)
                  setOpen(false) // close immediately on select
                }}
                open={open}
                onClose={() => setOpen(false)}
              />

              {/* <TouchableOpacity style={$pillContainer} onPress={handleOpenColorSheet}>
                <View style={[$pickedColor, { backgroundColor: colorPicked }]} />
                <Text text="color" preset="formLabel" size="md" />
              </TouchableOpacity> */}

           <TouchableOpacity
  style={$pillContainer}
  activeOpacity={0.7}
  onPress={handleOpenColorSheet}
>
  <View style={[$pickedColor, { backgroundColor: colorPicked }]} />
  <Text text="color" preset="formLabel" size="md" />
</TouchableOpacity>
              <BottomSheetModal
                ref={bottomSheetColorRef}
                snapPoints={[300, "50%"]}
                backdropComponent={renderBackdrop}
                style={$bottomSheetContainer}
              >
                <BottomSheetView style={$bottomSheet}>
                  <ColorPicker
                    style={$colorPicker}
                    value="red"
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
              {/* <TextField label="Habit Name" placeholder="Go to the GYM" required /> */}

              <TextField
                label="Habit Name"
                placeholder="Go to the GYM"
                value={name}
                onChangeText={setName}
                required
              />

              <TextField label="Description" placeholder="Extra details" />

              <TextField
                label="Target"
                placeholder="1"
                value={target.toString()}
                onChangeText={(text) => setTarget(Number(text) || 1)}
                keyboardType="numeric"
              />

              <TextField label="Unit" placeholder="times" value={unit} onChangeText={setUnit} />
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
      backgroundColor: frequency.includes(d.day)
        ? colors.palette.primary500
        : colors.palette.neutral100,
       borderWidth: 1,
    borderColor: colors.palette.primary500,
    },
  ]}
  onPress={() => handleSelectFrequency(d)}
>
  <Text
    text={d.abbr}
    style={[
      $dayStyle,
      {
        color: frequency.includes(d.day)
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                onChange={(_, selectedDate) => setHabitTime(new Date(selectedDate!))}
              />
            </View>

            <View style={$gap}>

              
              <View style={$frequencyContainer}>
                <Text preset="formLabel" text="Habit date" style={$labelStyle} />
                <Text text="*" style={$labelRequired} />
              </View>
              <DateTimePicker
                testID="datePicker"
                style={$dateTimePicker}
                value={habitDate}
                mode="date"
                locale="en-US"
                accentColor={colors.palette.neutral100}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                  
                    setHabitDate(new Date(selectedDate))
                  }
                }}
              />
            </View>


              <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
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
                <TouchableOpacity style={$reminder} onPress={() => handleOpenReminderSheet()}>
                  <Text text={reminder} size="md" />
                  <Icon icon="caretRight" />
                </TouchableOpacity>
              )}
              <BottomSheetModal
                ref={bottomSheetColorRef}
                snapPoints={["70%",300]} // Replace [300, "50%"] with ["50%"]
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

            <View>
              <Button
                style={[$btn, { marginTop: spacing.lg }]}
                textStyle={{ color: colors.palette.neutral100 }}
                onPress={handleCreateHabit}
              >
                Create habit
              </Button>
            </View>
          </View>
        </BottomSheetModalProvider>
      </Screen>
    )
  },
)

const $container: ViewStyle = {
  paddingHorizontal: spacing.md,
  gap: spacing.xl,
  paddingBottom: 70,
}

const $headerContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 24,
}

const $btn: ViewStyle = {
  backgroundColor: colors.palette.primary500,
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
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
}


const $subheaderContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "flex-start",
  flexWrap: "wrap",
  gap: spacing.md, // ⬅️ new: add horizontal spacing
  marginVertical: spacing.md, // ⬅️ new: add vertical breathing room
}
const $pickedColor: ViewStyle = {
  width: 18,
  height: 18,
  borderRadius: 99,
  marginRight: spacing.xs, // spacing between the swatch and the label
  borderWidth: 1,
  borderColor: colors.palette.neutral300, // give it a subtle outline
}

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
  color: colors.palette.primary500, // or any blue from your palette
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

const $cardContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral100, // white card
  borderRadius: spacing.sm,
  padding: spacing.md,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 6, // Android drop shadow
  marginBottom: spacing.lg,
  paddingBottom: spacing.xxl,
}

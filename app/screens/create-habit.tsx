// manage-habits.tsx

import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Alert,
} from "react-native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Text, Screen, Icon, Button } from "app/components"
import layout from "app/utils/layout"
import { colors, spacing } from "../theme"
import { HomeStackScreenProps } from "app/navigators/types"
import { habitStore } from "app/models/habit-store"

interface CreateHabitScreenProps extends HomeStackScreenProps<"CreateHabit"> {}

export const CreateHabitScreen: FC<CreateHabitScreenProps> = observer(function CreateHabitScreen({ navigation }) {
  const userHabits = habitStore.habits.filter((h) => !h.paused)

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$headerContainer}>
        <Icon icon="x" color={colors.text} onPress={() => navigation.goBack()} />
        <Text text="Your Habits" preset="heading" size="lg" />
      </View>

      <View style={$allHabitsContainer}>
        {userHabits.length > 0 ? (
          userHabits.map((habit, idx) => (
            <View key={`habit-${habit.id}-${idx}`} style={$habitContainer}>
              <View style={$habitLeftContainer}>
                <View style={$emojiContainer}>
                  <Text text={habit.emoji ?? "🔥"} size="lg" style={$emojiText} />
                </View>

                <Text text={habit.name} preset="formLabel" size="md" style={$habitNameText} numberOfLines={1} ellipsizeMode="tail" />
              </View>

              <View style={$habitRightContainerRow}>
                {/* Edit */}
                <MaterialCommunityIcons
                  name="pencil"
                  color={colors.palette.primary600}
                  size={24}
                  onPress={() => navigation.navigate("EditHabit", { habitId: habit.id })}
                />

                {/* Pause */}
                <TouchableOpacity
                  onPress={() => habitStore.togglePauseHabit(habit.id)}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    backgroundColor: habit.paused ? "lightgreen" : "transparent",
                  }}
                >
                  <MaterialCommunityIcons
                    name={habit.paused ? "pause-circle" : "pause-circle-outline"}
                    size={24}
                    color={habit.paused ? colors.palette.accent500 : colors.palette.neutral500}
                  />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Delete Habit",
                      `Are you sure you want to delete "${habit.name}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => habitStore.removeHabit(habit.id),
                        },
                      ],
                      { cancelable: true }
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
            </View>
          ))
        ) : (
          <Text text="No habits found" preset="formLabel" size="md" />
        )}

        <View style={[$habitLeftContainer, { width: layout.window.width * 0.8 }]}>
          <View style={[$habitRightContainer, { backgroundColor: colors.palette.neutral100 }]}>
            <MaterialCommunityIcons
              name="plus"
              color={colors.palette.primary600}
              size={28}
              onPress={() => navigation.navigate("CreateNewHabit")}
            />
          </View>
          <Text text="Couldn’t find anything? Create a new habit" preset="formLabel" size="md" />
        </View>
      </View>

      <Button
        style={$btn}
        textStyle={{ color: colors.palette.neutral100 }}
        onPress={() => navigation.navigate("Home")}
      >
        Done
      </Button>
    </Screen>
  )
})

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

const $allHabitsContainer: ViewStyle = {
  gap: 16,
}

const $habitContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  padding: spacing.sm,
  borderRadius: spacing.xs,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $habitLeftContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 15,
}

const $habitRightContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral200,
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 99,
}

const $habitRightContainerRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
}

const $emojiContainer: ViewStyle = {
  backgroundColor: colors.background,
  width: 44,
  height: 44,
  borderRadius: 99,
  alignItems: "center",
  justifyContent: "center",
}

const $emojiText: TextStyle = {
  lineHeight: 0,
  textAlign: "center",
}

const $btn: ViewStyle = {
  backgroundColor: colors.palette.primary600,
  borderWidth: 0,
  borderRadius: spacing.xs,
}

const $habitNameText: TextStyle = {
  flexShrink: 1,
  maxWidth: layout.window.width * 0.45,
}







// create habit screen 

// import { observer } from "mobx-react-lite"
// import React, { FC, useEffect } from "react"
// import { TextStyle, View, ViewStyle } from "react-native"
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

// import { Text, Screen, Icon, Button } from "app/components"
// import layout from "app/utils/layout"

// import { colors, spacing } from "../theme"
// import { HomeStackScreenProps } from "app/navigators/types"

// import { habitStore } from "app/models/habit-store"

// const existingHabits = [
//   {
//     emoji: "🧘",
//     name: "Health",
//     color: colors.palette.accent400,
//   },
//   {
//     emoji: "🎨",
//     name: "Arts",
//     color: colors.palette.secondary400,
//   },
//   {
//     emoji: "🏀",
//     name: "Sports",
//     color: colors.palette.neutral500,
//   },
//   {
//     emoji: "💡",
//     name: "Skills Development",
//     color: colors.palette.neutral500,
//   },
//   {
//     emoji: "🈯️",
//     name: "Language",
//     color: colors.palette.neutral500,
//   },
//   {
//     emoji: "📚",
//     name: "Mindfullness",
//     color: colors.palette.neutral500,
//   },
// ]

// interface CreateHabitScreenProps extends HomeStackScreenProps<"CreateHabit"> {}

// export const CreateHabitScreen: FC<CreateHabitScreenProps> = observer(function CreateHabitScreen({
//   navigation,
// }) {
//   useEffect(() => {
//     console.log("habitStore:", habitStore) // debug if habitStore is defined
//   }, [])

//   return (
//     <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
//       <View style={$headerContainer}>
//         <Icon icon="x" color={colors.text} onPress={() => navigation.goBack()} />
//         <Text text="Add new habit" preset="heading" size="lg" />
//       </View>
//       <View style={$allHabitsContainer}>
//         {existingHabits.map((habit, idx) => (
//           <View key={`habit-${habit.name}-${idx}`} style={$habitContainer}>
//             <View style={$habitLeftContainer}>
//               <View style={$emojiContainer}>
//                 <Text text={habit.emoji} size="lg" style={$emojiText} />
//               </View>
//               <Text text={habit.name} preset="formLabel" size="md" />
//             </View>
//             <View style={$habitRightContainer}>
//               {habit.name === "Health" ? (
//                 <MaterialCommunityIcons
//                   name="plus"
//                   color={colors.palette.primary600}
//                   size={28}
//                   onPress={() => habitStore.addHabit(habit.name)}
//                 />
//               ) : (
//                 <MaterialCommunityIcons name="plus" color={colors.palette.primary600} size={28} />
//               )}
//             </View>
//           </View>
//         ))}
//         <View style={[$habitLeftContainer, { width: layout.window.width * 0.8 }]}>
//           <View style={[$habitRightContainer, { backgroundColor: colors.palette.neutral100 }]}>
//             <MaterialCommunityIcons
//               name="plus"
//               color={colors.palette.primary600}
//               size={28}
//               onPress={() => navigation.navigate("CreateNewHabit")}
//             />
//           </View>
//           <Text text="Couldn’t find anything? Create a new habit" preset="formLabel" size="md" />
//         </View>
//       </View>
//       <Button
//         style={$btn}
//         textStyle={{ color: colors.palette.neutral100 }}
//         onPress={() => navigation.navigate("Home")}
//       >
//         Done
//       </Button>
//     </Screen>
//   )
// })

// const $container: ViewStyle = {
//   paddingHorizontal: spacing.md,
//   gap: spacing.xl,
//   paddingBottom: 70,
// }

// const $allHabitsContainer: ViewStyle = {
//   gap: 16,
// }

// const $headerContainer: ViewStyle = {
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 24,
// }

// const $habitContainer: ViewStyle = {
//   backgroundColor: colors.palette.neutral100,
//   padding: spacing.sm,
//   borderRadius: spacing.xs,
//   flexDirection: "row",
//   justifyContent: "space-between",
// }

// const $habitLeftContainer: ViewStyle = {
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 15,
// }

// const $habitRightContainer: ViewStyle = {
//   backgroundColor: colors.palette.neutral200,
//   width: 40,
//   height: 40,
//   alignItems: "center",
//   justifyContent: "center",
//   borderRadius: 99,
// }

// const $emojiContainer: ViewStyle = {
//   backgroundColor: colors.background,
//   width: 44,
//   height: 44,
//   borderRadius: 99,
//   alignItems: "center",
//   justifyContent: "center",
// }

// const $emojiText: TextStyle = {
//   lineHeight: 0,
//   textAlign: "center",
// }

// const $btn: ViewStyle = {
//   backgroundColor: colors.palette.primary600,
//   borderWidth: 0,
//   borderRadius: spacing.xs,
// }




// import { observer } from "mobx-react-lite"
// import React, { FC } from "react"
// import { TextStyle, View, ViewStyle } from "react-native"
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

// import { Text, Screen, Icon, Button } from "app/components"
// import layout from "app/utils/layout"
// import { colors, spacing } from "../theme"
// import { HomeStackScreenProps } from "app/navigators/types"
// import { useStores } from "app/models"

// interface CreateHabitScreenProps extends HomeStackScreenProps<"CreateHabit"> {}

// export const CreateHabitScreen: FC<CreateHabitScreenProps> = observer(function CreateHabitScreen({
//   navigation,
// }) {
//   const { habitStore } = useStores()
//   const habits = Array.isArray(habitStore.habits) ? habitStore.habits : []

//   console.log("habits from store:", habits)

//   return (
//     <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
//       <View style={$headerContainer}>
//         <Icon icon="x" color={colors.text} onPress={() => navigation.goBack()} />
//         <Text text="Add new habit" preset="heading" size="lg" />
//       </View>

//       <View style={$allHabitsContainer}>
//         {habits.length > 0 ? (
//           habits.map((habit, idx) => {
//             const habitName = habit.name ?? "Unnamed Habit"
//             // If you ever add emoji support to your store, replace the fallback here
//             // const habitEmoji = habit.emoji ?? "❓"

//             return (
//               <View key={`habit-${habitName}-${idx}`} style={$habitContainer}>
//                 <View style={$habitLeftContainer}>
//                   <View style={$emojiContainer}>
//                     {/* <Text text={habitEmoji} size="lg" style={$emojiText} /> */}
//                   </View>
//                   <Text text={habitName} preset="formLabel" size="md" />
//                 </View>
//                 <View style={$habitRightContainer}>
//                   <MaterialCommunityIcons
//                     name="plus"
//                     color={colors.palette.primary600}
//                     size={28}
//                     onPress={() => habitStore.addHabit(habitName)}
//                   />
//                 </View>
//               </View>
//             )
//           })
//         ) : (
//           <Text text="No habits found" preset="formLabel" size="md" />
//         )}

//         <View style={[$habitLeftContainer, { width: layout.window.width * 0.8 }]}>
//           <View style={[$habitRightContainer, { backgroundColor: colors.palette.neutral100 }]}>
//             <MaterialCommunityIcons
//               name="plus"
//               color={colors.palette.primary600}
//               size={28}
//               onPress={() => navigation.navigate("CreateNewHabit")}
//             />
//           </View>
//           <Text
//             text="Couldn’t find anything? Create a new habit"
//             preset="formLabel"
//             size="md"
//           />
//         </View>
//       </View>

//       <Button
//         style={$btn}
//         textStyle={{ color: colors.palette.neutral100 }}
//         onPress={() => navigation.navigate("Home")}
//       >
//         Done
//       </Button>
//     </Screen>
//   )
// })

// const $container: ViewStyle = {
//   paddingHorizontal: spacing.md,
//   gap: spacing.xl,
//   paddingBottom: 70,
// }

// const $allHabitsContainer: ViewStyle = {
//   gap: 16,
// }

// const $headerContainer: ViewStyle = {
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 24,
// }

// const $habitContainer: ViewStyle = {
//   backgroundColor: colors.palette.neutral100,
//   padding: spacing.sm,
//   borderRadius: spacing.xs,
//   flexDirection: "row",
//   justifyContent: "space-between",
// }

// const $habitLeftContainer: ViewStyle = {
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 15,
// }

// const $habitRightContainer: ViewStyle = {
//   backgroundColor: colors.palette.neutral200,
//   width: 40,
//   height: 40,
//   alignItems: "center",
//   justifyContent: "center",
//   borderRadius: 99,
// }

// const $emojiContainer: ViewStyle = {
//   backgroundColor: colors.background,
//   width: 44,
//   height: 44,
//   borderRadius: 99,
//   alignItems: "center",
//   justifyContent: "center",
// }

// const $emojiText: TextStyle = {
//   lineHeight: 0,
//   textAlign: "center",
// }

// const $btn: ViewStyle = {
//   backgroundColor: colors.palette.primary600,
//   borderWidth: 0,
//   borderRadius: spacing.xs,
// }

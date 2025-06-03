// // app/screens/fakeHabit.tsx
// import React from "react"
// import { View, Button, Text } from "react-native"
// import { observer } from "mobx-react-lite"
// import { habitStore } from "app/models/habit-store"

// export const FakeHabitScreen = observer(() => {
//   const handleAdd = () => {
//     habitStore.addHabit("Health")
//   }

//   return (
//     <View style={{ padding: 20 }}>
//       <Button title="Add Habit" onPress={handleAdd} />
//       {habitStore.habits.map((habit) => (
//         <Text key={habit.id}>{habit.name}</Text>
//       ))}
//     </View>
//   )
// })



import React from "react"
import { View, Button, Text } from "react-native"
import { observer } from "mobx-react-lite"
import { habitStore } from "app/models/habit-store"

export const FakeHabitScreen = observer(() => {
  const handleAdd = () => {
    console.log("Add Habit clicked")
    habitStore.addHabit("Health")
  }

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Fake Habit Screen</Text>

      <Button title="Add Habit" onPress={handleAdd} />

      <Text style={{ marginTop: 20 }}>Number of habits: {habitStore.habits.length}</Text>

      {habitStore.habits.map((habit) => (
        <Text key={habit.id}>{habit.name}</Text>
      ))}
    </View>
  )
})




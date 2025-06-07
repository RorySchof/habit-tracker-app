


// import React from "react"
// import { View, Button, Text } from "react-native"
// import { observer } from "mobx-react-lite"
// import { habitStore } from "app/models/habit-store"

// export const FakeHabitScreen = observer(() => {
//   const handleAdd = () => {
//     console.log("Add Habit clicked")
//     habitStore.addHabit("Health")
//   }

//   return (
//     <View style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
//       <Text style={{ fontSize: 24, marginBottom: 20 }}>Fake Habit Screen</Text>

//       <Button title="Add Habit" onPress={handleAdd} />

//       <Text style={{ marginTop: 20 }}>Number of habits: {habitStore.habits.length}</Text>

//       {habitStore.habits.map((habit) => (
//         <Text key={habit.id}>{habit.name}</Text>
//       ))}
//     </View>
//   )
// })


import React, { useState } from "react"
import { View, Button, Text, SafeAreaView } from "react-native"
import { observer } from "mobx-react-lite"
import { habitStore } from "app/models/habit-store"
import { WeekCalendar, CalendarProvider } from "react-native-calendars"

export const FakeHabitScreen = observer(() => {
  const today = new Date()
  const formattedToday = today.toISOString().split("T")[0]
  const [selected, setSelected] = useState(formattedToday)

  const handleAdd = () => {
    console.log("Add Habit clicked")
    habitStore.addHabit("Health")
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>Fake Habit Screen</Text>

      <CalendarProvider date={selected}>
        <WeekCalendar
          current={selected}
          onDayPress={day => setSelected(day.dateString)}
          markedDates={{
            [selected]: { selected: true, selectedColor: "#3399ff" },
          }}
          firstDay={1}
        />
      </CalendarProvider>

      <Button title="Add Habit" onPress={handleAdd} />

      <Text style={{ marginTop: 20 }}>Number of habits: {habitStore.habits.length}</Text>

      {habitStore.habits.map((habit) => (
        <Text key={habit.id}>{habit.name}</Text>
      ))}
    </SafeAreaView>
  )
})









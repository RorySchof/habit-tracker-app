// // app/models/habit-store.ts
// import { types } from "mobx-state-tree"
// import { HabitModel } from "../models/HabitModel"




// // ✅ Remove this — you already imported HabitModel
// // const HabitModel = types.model("Habit", { ... })

// // ✅ Now just use the imported model
// export const HabitStoreModel = types
//   .model("HabitStore", {
//     habits: types.array(HabitModel), // using imported model
//   })
//   .actions((store) => ({
//    addHabit(name: string) {
//   const newHabit = HabitModel.create({
//     id: String(Date.now()),
//     name,
//     emoji: "✨", // You must include this too — your model requires it
//     time: "morning", // Also required
//     finished: false, // ✅ correct key
//     category: "health",          // ✔️ required for your checkIns filter
//     current: 0,                  // ✔️ required for progress tracking
//     target: 4,                   // ✔️ daily goal
//     unit: "cups",                // ✔️ e.g., for water
//     color: "#3498db",            // ✔️ color for progress ring


//   })
//   store.habits.push(newHabit)
// }

//   }))


// export const habitStore = HabitStoreModel.create({ habits: [] })








// // app/models/habit-store.ts
// import { types } from "mobx-state-tree"
// import { HabitModel } from "../models/HabitModel"




// // ✅ Remove this — you already imported HabitModel
// // const HabitModel = types.model("Habit", { ... })

// // ✅ Now just use the imported model
// export const HabitStoreModel = types
//   .model("HabitStore", {
//     habits: types.array(HabitModel), // using imported model
//   })
  
//   .actions((store) => ({
//   addHabit(habitData: {
//     name: string
//     emoji: string
//     time: string
//     category: string
//     target: number
//     unit: string
//     color: string
//         frequency: string[] // or whatever the type of frequency is

//   }) {
//     const newHabit = HabitModel.create({
//       id: String(Date.now()),
//       name: habitData.name,
//       emoji: habitData.emoji,
//       time: habitData.time,
//       finished: false,
//       category: habitData.category,
//       current: 0,
//       target: habitData.target,
//       unit: habitData.unit,
//       color: habitData.color,
//       frequency: habitData.frequency, 
//     })
//     store.habits.push(newHabit)
//   },
// }))



// export const habitStore = HabitStoreModel.create({ habits: [] })





// app/models/habit-store.ts
import { types } from "mobx-state-tree"
import { HabitModel } from "../models/HabitModel"

// ✅ Now just use the imported model
export const HabitStoreModel = types
  .model("HabitStore", {
    habits: types.array(HabitModel), // using imported model
  })
  .actions((store) => ({
    addHabit(habitData: {
      name: string
      emoji: string
      time: string
      category: string
      target: number
      unit: string
      color: string
      frequency: string[] // or whatever the type of frequency is
    }) {
      const newHabit = HabitModel.create({
        id: String(Date.now()),
        name: habitData.name,
        emoji: habitData.emoji,
        time: habitData.time,
        finished: false,
        category: habitData.category,
        current: 0,
        target: habitData.target,
        unit: habitData.unit,
        color: habitData.color,
        frequency: habitData.frequency,
      })
      store.habits.push(newHabit)
    },

    incrementHabit(name: string) {
      const habit = store.habits.find(h => h.name === name)
      if (habit && habit.current < habit.target) {
        habit.current += 1
      }
    },

    decrementHabit(name: string) {
      const habit = store.habits.find(h => h.name === name)
      if (habit && habit.current > 0) {
        habit.current -= 1
      }
    },
  }))

export const habitStore = HabitStoreModel.create({ habits: [] })

// import { types } from "mobx-state-tree"

// // A single Habit model
// const HabitModel = types.model("Habit", {
//   id: types.identifier,
//   name: types.string,
//   isCompleted: types.boolean,
// })

// // The store that holds a list of habits
// export const HabitStoreModel = types
//   .model("HabitStore", {
//     habits: types.array(HabitModel),
//   })
//   .actions((store) => ({
//     addHabit(name: string) {
//       store.habits.push({
//         id: String(Date.now()),
//         name,
//         isCompleted: false,
//       })
//     },
//     toggleHabit(id: string) {
//       const habit = store.habits.find((h) => h.id === id)
//       if (habit) {
//         habit.isCompleted = !habit.isCompleted
//       }
//     },
//     removeHabit(id: string) {
//       store.habits.replace(store.habits.filter((h) => h.id !== id))
//     },
//   }))







// app/models/habit-store.ts
import { types } from "mobx-state-tree"
import { HabitModel } from "../models/HabitModel"




// ✅ Remove this — you already imported HabitModel
// const HabitModel = types.model("Habit", { ... })

// ✅ Now just use the imported model
export const HabitStoreModel = types
  .model("HabitStore", {
    habits: types.array(HabitModel), // using imported model
  })
  .actions((store) => ({
   addHabit(name: string) {
  const newHabit = HabitModel.create({
    id: String(Date.now()),
    name,
    emoji: "✨", // You must include this too — your model requires it
    time: "morning", // Also required
    finished: false, // ✅ correct key
    category: "health",          // ✔️ required for your checkIns filter
    current: 0,                  // ✔️ required for progress tracking
    target: 4,                   // ✔️ daily goal
    unit: "cups",                // ✔️ e.g., for water
    color: "#3498db",            // ✔️ color for progress ring


  })
  store.habits.push(newHabit)
}

  }))


export const habitStore = HabitStoreModel.create({ habits: [] })



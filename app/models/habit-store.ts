// // app/models/habit-store.ts
// import { types } from "mobx-state-tree"
// import { HabitModel } from "../models/HabitModel"

// // ✅ Now just use the imported model
// export const HabitStoreModel = types
//   .model("HabitStore", {
//     habits: types.array(HabitModel), // using imported model
//   })
//   .actions((store) => ({
//     addHabit(habitData: {
//       name: string
//       emoji: string
//       time: string
//       category: string
//       target: number
//       unit: string
//       color: string
//       frequency: string[] // or whatever the type of frequency is
//     }) {
//       const newHabit = HabitModel.create({
//         id: String(Date.now()),
//         name: habitData.name,
//         emoji: habitData.emoji,
//         time: habitData.time,
//         finished: false,
//         category: habitData.category,
//         current: 0,
//         target: habitData.target,
//         unit: habitData.unit,
//         color: habitData.color,
//         frequency: habitData.frequency,
//       })
//       store.habits.push(newHabit)
//     },

//     incrementHabit(name: string) {
//       const habit = store.habits.find(h => h.name === name)
//       if (habit && habit.current < habit.target) {
//         habit.current += 1
//       }
//     },

//     decrementHabit(name: string) {
//       const habit = store.habits.find(h => h.name === name)
//       if (habit && habit.current > 0) {
//         habit.current -= 1
//       }
//     },
//   }))

// export const habitStore = HabitStoreModel.create({ habits: [] })

// console.log("Initial HabitStore:", JSON.stringify(habitStore, null, 2))




// import { types, onSnapshot, applySnapshot } from "mobx-state-tree"
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import { HabitModel } from "../models/HabitModel"

// const STORAGE_KEY = "HabitStoreSnapshot"

// export const HabitStoreModel = types
//   .model("HabitStore", {
//     habits: types.array(HabitModel),
//   })
//   .actions((self) => ({
//     addHabit(habitData: {
//       name: string
//       emoji: string
//       time: string
//       date?: string   // Add this line, make it optional if you want

//       category: string
//       target: number
//       unit: string
//       color: string
//       frequency: string[]
//     }) {
//       const newHabit = HabitModel.create({
//         id: String(Date.now()),
//         name: habitData.name,
//         emoji: habitData.emoji,
//         time: habitData.time,
//         date: habitData.date,      // Add this line here
//         finished: false,
//         category: habitData.category,
//         current: 0,
//         target: habitData.target,
//         unit: habitData.unit,
//         color: habitData.color,
//         frequency: habitData.frequency,
//       })
//       self.habits.push(newHabit)
//     },

//     incrementHabit(name: string) {
//       const habit = self.habits.find((h) => h.name === name)
//       if (habit && habit.current < habit.target) {
//         habit.current += 1
//       }
//     },

//     decrementHabit(name: string) {
//       const habit = self.habits.find((h) => h.name === name)
//       if (habit && habit.current > 0) {
//         habit.current -= 1
//       }
//     },

//     async load() {
//       try {
//         const snapshotStr = await AsyncStorage.getItem(STORAGE_KEY)
//         if (snapshotStr) {
//           const snapshot = JSON.parse(snapshotStr)
//           applySnapshot(self, snapshot)
//           console.log("Loaded HabitStore snapshot:", snapshot)  // <-- log loaded snapshot
//         } else {
//           console.log("No HabitStore snapshot found in AsyncStorage.")
//         }
//       } catch (error) {
//         console.error("Failed to load HabitStore snapshot", error)
//       }
//     },
//   }))

// export const habitStore = HabitStoreModel.create({ habits: [] })

// habitStore.load()

// onSnapshot(habitStore, (snapshot) => {
//   AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
//     .then(() => {
//       console.log("Saved HabitStore snapshot:", snapshot)  // <-- log snapshot on save
//     })
//     .catch((error) => {
//       console.error("Failed to save HabitStore snapshot", error)
//     })
// })




import { types, onSnapshot, applySnapshot } from "mobx-state-tree"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { HabitModel } from "../models/HabitModel"

const STORAGE_KEY = "HabitStoreSnapshot"

type HabitData = {
  name: string
  emoji: string
  time: string
  date?: string
  category: string
  target: number
  unit: string
  color: string
  frequency: string[]
}

export const HabitStoreModel = types
  .model("HabitStore", {
    habits: types.array(HabitModel),
  })
  .actions((self) => ({
    addHabit(habitData: HabitData) {
      const newHabit = HabitModel.create({
        id: String(Date.now()),
        name: habitData.name,
        emoji: habitData.emoji,
        time: habitData.time,
        date: habitData.date,
        finished: false,
        category: habitData.category,
        current: 0,
        target: habitData.target,
        unit: habitData.unit,
        color: habitData.color,
        frequency: habitData.frequency,
      })
      self.habits.push(newHabit)
    },

    incrementHabit(name: string) {
      const habit = self.habits.find((h) => h.name === name)
      if (habit && habit.current < habit.target) {
        habit.current += 1
      }
    },

    decrementHabit(name: string) {
      const habit = self.habits.find((h) => h.name === name)
      if (habit && habit.current > 0) {
        habit.current -= 1
      }
    },

    async load() {
      try {
        const snapshotStr = await AsyncStorage.getItem(STORAGE_KEY)
        if (snapshotStr) {
          const snapshot = JSON.parse(snapshotStr)
          applySnapshot(self, snapshot)
          console.log("Loaded HabitStore snapshot:", snapshot)
        } else {
          console.log("No HabitStore snapshot found in AsyncStorage.")
        }
      } catch (error) {
        console.error("Failed to load HabitStore snapshot", error)
      }
    },
  }))

export const habitStore = HabitStoreModel.create({ habits: [] })

habitStore.load()

onSnapshot(habitStore, (snapshot) => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    .then(() => {
      console.log("Saved HabitStore snapshot:", snapshot)
    })
    .catch((error) => {
      console.error("Failed to save HabitStore snapshot", error)
    })
})




// // habit store ts

// import { types, onSnapshot, applySnapshot } from "mobx-state-tree"
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import { HabitModel } from "../models/HabitModel"
// import { ActivityLogModel } from "../models/ActivityLogModel" // adjust path if needed

// const STORAGE_KEY = "HabitStoreSnapshot"

// type HabitData = {
//   name: string
//   emoji: string
//   time: string
//   date?: string
//   category: string
//   target: number
//   unit: string
//   color: string
//   frequency: string[]
// }

// export const HabitStoreModel = types
//   .model("HabitStore", {
//     habits: types.array(HabitModel),
//     activityLog: types.array(ActivityLogModel), // <-- NEW
//   })
//   .actions((self) => ({
//     addHabit(habitData: HabitData) {
//       const newHabit = HabitModel.create({
//         id: String(Date.now()),
//         name: habitData.name,
//         emoji: habitData.emoji,
//         time: habitData.time,
//         date: habitData.date,
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

//         const today = new Date().toISOString().split("T")[0]
//         let logEntry = self.activityLog.find(
//           (entry) => entry.habitId === habit.id && entry.date === today,
//         )

//         if (logEntry) {
//           logEntry.count += 1
//         } else {
//           self.activityLog.push({
//             habitId: habit.id,
//             date: today,
//             count: 1,
//           })
//         }
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
//           // console.log("Loaded HabitStore snapshot:", snapshot)
//         } else {
//           // console.log("No HabitStore snapshot found in AsyncStorage.")
//         }
//       } catch (error) {
//         // console.error("Failed to load HabitStore snapshot", error)
//       }
//     },

//     removeHabit(id: string) {
//       const index = self.habits.findIndex((h) => h.id === id)
//       if (index !== -1) {
//         self.habits.splice(index, 1)
//       }
//     },
//   }))

// // export const habitStore = HabitStoreModel.create({ habits: [] })

// export const habitStore = HabitStoreModel.create({ habits: [], activityLog: [] })

// habitStore.load()

// onSnapshot(habitStore, (snapshot) => {
//   AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
//     .then(() => {
//       // console.log("Saved HabitStore snapshot:", snapshot)
//     })
//     .catch((error) => {
//       // console.error("Failed to save HabitStore snapshot", error)
//     })
// })



import { types, onSnapshot, applySnapshot } from "mobx-state-tree"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { HabitModel } from "../models/HabitModel"
import { ActivityLogModel } from "../models/ActivityLogModel" // adjust path if needed

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
    activityLog: types.array(ActivityLogModel),
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

    // Legacy methods for reference
    // incrementHabit(name: string) {
    //   const habit = self.habits.find((h) => h.name === name)
    //   if (habit && habit.current < habit.target) {
    //     habit.current += 1
    //     const today = new Date().toISOString().split("T")[0]
    //     let logEntry = self.activityLog.find(
    //       (entry) => entry.habitId === habit.id && entry.date === today,
    //     )
    //     if (logEntry) {
    //       logEntry.count += 1
    //     } else {
    //       self.activityLog.push({
    //         habitId: habit.id,
    //         date: today,
    //         count: 1,
    //       })
    //     }
    //   }
    // },

    // decrementHabit(name: string) {
    //   const habit = self.habits.find((h) => h.name === name)
    //   if (habit && habit.current > 0) {
    //     habit.current -= 1
    //   }
    // },

    incrementHabit(id: string, dateStr: string) {
  const habit = self.habits.find((h) => h.id === id);
  if (!habit) return;

  const today = dateStr; // <-- use passed-in date
  let logEntry = self.activityLog.find(
    (entry) => entry.habitId === id && entry.date === today
  );

  const currentCount = logEntry ? logEntry.count : 0;

  if (currentCount < habit.target) {
    if (logEntry) {
      logEntry.count += 1;
    } else {
      self.activityLog.push({
        habitId: id,
        date: today,
        count: 1,
      });
    }
  }
},

decrementHabit(id: string, dateStr: string) {
  const habit = self.habits.find((h) => h.id === id);
  if (!habit) return;

  const today = dateStr; // <-- use passed-in date
  let logEntry = self.activityLog.find(
    (entry) => entry.habitId === id && entry.date === today
  );

  if (logEntry && logEntry.count > 0) {
    logEntry.count -= 1;

    if (logEntry.count === 0) {
      const idx = self.activityLog.findIndex((e) => e === logEntry);
      if (idx !== -1) self.activityLog.splice(idx, 1);
    }
  }
},


  

    async load() {
      try {
        const snapshotStr = await AsyncStorage.getItem(STORAGE_KEY)
        if (snapshotStr) {
          const snapshot = JSON.parse(snapshotStr)
          applySnapshot(self, snapshot)
          // console.log("Loaded HabitStore snapshot:", snapshot)
        } else {
          // console.log("No HabitStore snapshot found in AsyncStorage.")
        }
      } catch (error) {
        // console.error("Failed to load HabitStore snapshot", error)
      }
    },

    removeHabit(id: string) {
      const index = self.habits.findIndex((h) => h.id === id)
      if (index !== -1) {
        self.habits.splice(index, 1)
      }
    },
  }))

export const habitStore = HabitStoreModel.create({ habits: [], activityLog: [] })

habitStore.load()

onSnapshot(habitStore, (snapshot) => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    .then(() => {
      // console.log("Saved HabitStore snapshot:", snapshot)
    })
    .catch((error) => {
      // console.error("Failed to save HabitStore snapshot", error)
    })
})

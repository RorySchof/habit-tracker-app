// // habit store ts

import { types, onSnapshot, applySnapshot } from "mobx-state-tree"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { HabitModel } from "../models/HabitModel"
import { ActivityLogModel } from "../models/ActivityLogModel" // adjust path if needed

import { subDays, format } from "date-fns"


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


incrementHabit(id: string, dateStr: string) {
  const habit = self.habits.find((h) => h.id === id);
  if (!habit) return;

  // ✅ Prevent incrementing if paused
  if (habit.paused) {
    console.log(`Habit "${habit.name}" is paused; skipping increment.`);
    return;
  }

  const today = dateStr;
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

  // ✅ Prevent decrementing if paused
  if (habit.paused) {
    console.log(`Habit "${habit.name}" is paused; skipping decrement.`);
    return;
  }

  const today = dateStr;
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

togglePauseHabit(habitId: string) {
  const habit = self.habits.find(h => h.id === habitId);
  if (habit) {
    habit.paused = !habit.paused;
    console.log(`Toggled pause for "${habit.name}" (${habit.id}). Now paused: ${habit.paused}`);
  } else {
    console.log(`Habit with ID ${habitId} not found.`);
  }
},

calculateHabitStreak(habit: Habit) {
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = subDays(today, i);
    const formattedDate = format(date, "yyyy-MM-dd");
    const dayOfWeek = format(date, "EEEE");

    if (!habit.frequency.includes(dayOfWeek)) {
      continue;
    }

    // ✅ Skip paused habits in streak calculations

    if (habit.paused) {
      continue;
    }

    const logEntry = self.activityLog.find(
      entry => entry.habitId === habit.id && entry.date === formattedDate
    );

    if (logEntry && logEntry.count >= habit.target) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
},

    async load() {
      try {
        const snapshotStr = await AsyncStorage.getItem(STORAGE_KEY)
        if (snapshotStr) {
          const snapshot = JSON.parse(snapshotStr)
          applySnapshot(self, snapshot)
        } else {
        }
      } catch (error) {
      }
    },

    removeHabit(id: string) {
      const index = self.habits.findIndex((h) => h.id === id)
      if (index !== -1) {
        self.habits.splice(index, 1)
      }
    },

    updateHabit(id: string, updates: Partial<HabitData & {paused?: boolean}>) {
  const habit = self.habits.find(h => h.id === id)
  if (habit) {
    Object.entries(updates).forEach(([key, value]) => {
      // @ts-ignore
      habit[key] = value
    })
  }
},

  }))

export const habitStore = HabitStoreModel.create({ habits: [], activityLog: [] })

habitStore.load()

onSnapshot(habitStore, (snapshot) => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    .then(() => {
    })
    .catch((error) => {
    })
})

// models/HabitModel.ts
import { types } from "mobx-state-tree"

export const HabitModel = types.model("Habit", {
  id: types.identifier,
  name: types.string,
  emoji: types.optional(types.string, "✨"), // optional with default
  time: types.optional(types.string, "anytime"), // optional with default
  date: types.maybe(types.string), // ✅ Add this line

  finished: types.boolean,

  paused: types.optional(types.boolean, false),


  category: types.optional(types.string, "health"), // add category, default to "health"
  current: types.optional(types.number, 0), // current progress
  target: types.optional(types.number, 1), // target goal
  unit: types.optional(types.string, ""), // unit for measurement
  color: types.optional(types.string, "#3498db"),
  frequency: types.optional(types.array(types.string), []),
  createdAt: types.optional(types.string, () => new Date().toISOString()), // <== Add this
})

import { useEffect, useRef } from "react";
import type { Todo } from "../components/types";
import { getSettings } from "./useSettings";

function parseDueDateTime(dueDate: string, dueTime?: string): Date {
  const [h, m] = (dueTime ?? "00:00").split(":").map(Number);
  const date = new Date(dueDate + "T00:00:00");
  date.setHours(h, m, 0, 0);
  return date;
}

function todayAt9am(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

type Checkpoint = string;

export function useNotificationScheduler(
  todos: Todo[],
  onNotificationClick: (todoId: string) => void,
) {
  const notifiedRef = useRef<Set<Checkpoint>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const settings = getSettings();
      const now = new Date();
      const nineAm = todayAt9am();

      for (const todo of todos) {
        if (todo.completed || todo.deletedAt || !todo.dueDate) continue;

        if (todo.dueTime) {
          const dueTime = parseDueDateTime(todo.dueDate, todo.dueTime);
          const reminderTime = new Date(
            dueTime.getTime() - settings.reminderMinutes * 60 * 1000,
          );

          const reminderKey: Checkpoint = `${todo.id}:reminder`;
          if (
            now >= reminderTime &&
            now < dueTime &&
            !notifiedRef.current.has(reminderKey)
          ) {
            notifiedRef.current.add(reminderKey);
            const n = new Notification("任务提醒", {
              body: `"${todo.text}" ${settings.reminderMinutes}分钟后到期 — ${todo.dueTime}`,
              tag: reminderKey,
            });
            n.onclick = () => {
              window.focus();
              onNotificationClick(todo.id);
              n.close();
            };
          }

          const ontimeKey: Checkpoint = `${todo.id}:ontime`;
          if (now >= dueTime && !notifiedRef.current.has(ontimeKey)) {
            notifiedRef.current.add(ontimeKey);
            const n = new Notification("任务提醒", {
              body: `"${todo.text}" 已到期 — ${todo.dueTime}`,
              tag: ontimeKey,
            });
            n.onclick = () => {
              window.focus();
              onNotificationClick(todo.id);
              n.close();
            };
          }
        } else {
          const dueDate = new Date(todo.dueDate + "T00:00:00");
          const dayBeforeKey: Checkpoint = `${todo.id}:daybefore`;

          const isDayBefore =
            new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() ===
            new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() - 1).getTime();

          if (
            now >= nineAm &&
            now < dueDate &&
            isDayBefore &&
            !notifiedRef.current.has(dayBeforeKey)
          ) {
            notifiedRef.current.add(dayBeforeKey);
            const n = new Notification("任务提醒", {
              body: `"${todo.text}" 明天到期`,
              tag: dayBeforeKey,
            });
            n.onclick = () => {
              window.focus();
              onNotificationClick(todo.id);
              n.close();
            };
          }
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [todos, onNotificationClick]);
}

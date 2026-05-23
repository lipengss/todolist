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
  const lastNotifyRef = useRef<Map<Checkpoint, number>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      const settings = getSettings();
      const now = Date.now();
      const nowDate = new Date();
      const nineAm = todayAt9am();

      for (const todo of todos) {
        if (todo.completed || todo.deletedAt || !todo.dueDate) continue;

        const repeatMs = settings.repeatEnabled
          ? settings.repeatIntervalMinutes * 60 * 1000
          : Infinity;

        if (todo.dueTime) {
          const dueTime = parseDueDateTime(todo.dueDate, todo.dueTime);
          const dueTimeMs = dueTime.getTime();
          const reminderTimeMs = dueTimeMs - settings.reminderMinutes * 60 * 1000;

          if (now >= reminderTimeMs && now < dueTimeMs) {
            const key: Checkpoint = `${todo.id}:reminder`;
            const last = lastNotifyRef.current.get(key) ?? 0;
            if (now - last >= repeatMs) {
              lastNotifyRef.current.set(key, now);
              const n = new Notification("任务提醒", {
                body: `"${todo.text}" ${settings.reminderMinutes}分钟后到期 — ${todo.dueTime}`,
                tag: key,
              });
              n.onclick = () => {
                window.focus();
                onNotificationClick(todo.id);
                n.close();
              };
            }
          }

          if (now >= dueTimeMs) {
            const key: Checkpoint = `${todo.id}:ontime`;
            const last = lastNotifyRef.current.get(key) ?? 0;
            if (now - last >= repeatMs) {
              lastNotifyRef.current.set(key, now);
              const n = new Notification("任务提醒", {
                body: `"${todo.text}" 已到期 — ${todo.dueTime}`,
                tag: key,
              });
              n.onclick = () => {
                window.focus();
                onNotificationClick(todo.id);
                n.close();
              };
            }
          }
        } else {
          const dueDate = new Date(todo.dueDate + "T00:00:00");
          const dueDateMs = dueDate.getTime();
          const dayBeforeMs = new Date(
            dueDate.getFullYear(),
            dueDate.getMonth(),
            dueDate.getDate() - 1,
          ).getTime();

          const isDayBefore =
            new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime() ===
            dayBeforeMs;

          if (now >= nineAm.getTime() && now < dueDateMs && isDayBefore) {
            const key: Checkpoint = `${todo.id}:daybefore`;
            const last = lastNotifyRef.current.get(key) ?? 0;
            if (now - last >= repeatMs) {
              lastNotifyRef.current.set(key, now);
              const n = new Notification("任务提醒", {
                body: `"${todo.text}" 明天到期`,
                tag: key,
              });
              n.onclick = () => {
                window.focus();
                onNotificationClick(todo.id);
                n.close();
              };
            }
          }
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [todos, onNotificationClick]);
}

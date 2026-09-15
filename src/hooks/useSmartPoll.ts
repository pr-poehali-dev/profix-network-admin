import { useEffect, useRef } from "react";

interface Options {
  /** Базовый интервал опроса, мс */
  interval: number;
  /** Опрос выключен полностью */
  enabled?: boolean;
  /** Через сколько мс без новых данных замедлиться вдвое (0 — не замедлять) */
  idleSlowdownAfter?: number;
  /** Максимальный интервал при замедлении, мс */
  maxInterval?: number;
}

/**
 * Умный опрос сервера: не работает, пока вкладка скрыта,
 * и постепенно замедляется, если ничего не происходит.
 * Экономит вызовы облачных функций в разы.
 *
 * Колбэк должен вернуть true, если пришли новые данные —
 * тогда интервал сбрасывается к базовому.
 */
export function useSmartPoll(
  fn: () => Promise<boolean | void> | boolean | void,
  { interval, enabled = true, idleSlowdownAfter = 0, maxInterval }: Options,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    const cap = maxInterval ?? interval * 6;
    let current = interval;
    let idleSince = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(run, current);
    };

    const run = async () => {
      if (stopped) return;
      if (typeof document !== "undefined" && document.hidden) {
        schedule();
        return;
      }
      try {
        const got = await fnRef.current();
        if (got) {
          current = interval;
          idleSince = Date.now();
        } else if (idleSlowdownAfter && Date.now() - idleSince > idleSlowdownAfter) {
          current = Math.min(current * 2, cap);
          idleSince = Date.now();
        }
      } catch {
        current = Math.min(current * 2, cap);
      }
      schedule();
    };

    const onVisible = () => {
      if (document.hidden || stopped) return;
      current = interval;
      idleSince = Date.now();
      if (timer) clearTimeout(timer);
      run();
    };

    document.addEventListener("visibilitychange", onVisible);
    schedule();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [interval, enabled, idleSlowdownAfter, maxInterval]);
}

export default useSmartPoll;

import { useEffect, useState, type DependencyList } from "react";

export type AsyncState<T> =
  | { status: "loading"; data?: T }
  | { status: "success"; data: T }
  | { status: "error"; error: string; data?: T };

/** Runs a promise-returning task whenever deps change; keeps the last data while reloading. */
export function useAsync<T>(task: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState((previous) => ({ status: "loading", data: previous.data }));
    task()
      .then((data) => active && setState({ status: "success", data }))
      .catch((error: Error) => active && setState((previous) => ({ status: "error", error: error.message, data: previous.data })));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

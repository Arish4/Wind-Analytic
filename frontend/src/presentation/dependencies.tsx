// Use cases are injected through context so components never construct their own data access.
import { createContext, useContext, type ReactNode } from "react";
import type { LoadForecastDashboard, LoadPilotMeta } from "../application/useCases";

export interface Dependencies {
  loadMeta: LoadPilotMeta;
  loadDashboard: LoadForecastDashboard;
}

const DependenciesContext = createContext<Dependencies | null>(null);

export function DependenciesProvider({ value, children }: { value: Dependencies; children: ReactNode }) {
  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): Dependencies {
  const dependencies = useContext(DependenciesContext);
  if (!dependencies) throw new Error("useDependencies must be used inside DependenciesProvider");
  return dependencies;
}

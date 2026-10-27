// Composition root: wires the HTTP adapter into the use cases and hands them to React.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LoadForecastDashboard, LoadPilotMeta } from "./application/useCases";
import { HttpForecastGateway } from "./infrastructure/HttpForecastGateway";
import { DependenciesProvider } from "./presentation/dependencies";
import { DashboardPage } from "./presentation/pages/DashboardPage";
import "./presentation/styles/global.css";

const gateway = new HttpForecastGateway(import.meta.env.VITE_API_BASE_URL ?? "");

const dependencies = {
  loadMeta: new LoadPilotMeta(gateway),
  loadDashboard: new LoadForecastDashboard(gateway),
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DependenciesProvider value={dependencies}>
      <DashboardPage />
    </DependenciesProvider>
  </StrictMode>,
);

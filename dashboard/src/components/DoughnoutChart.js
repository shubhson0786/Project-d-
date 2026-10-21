import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function DoughnutChart({ data }) {
  return <Doughnut role="img" aria-label="Watchlist stock prices" data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />;
}

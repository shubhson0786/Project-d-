import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { priceHistogram } from "../priceHistogram";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: true, text: "Holdings price histogram" },
    tooltip: { callbacks: { label: context => `${context.parsed.y} holding${context.parsed.y === 1 ? "" : "s"}` } },
  },
  scales: {
    x: { title: { display: true, text: "Stock price range (INR)" }, offset: true, grid: { display: false } },
    y: { beginAtZero: true, title: { display: true, text: "Number of holdings" }, ticks: { stepSize: 1, precision: 0 } },
  },
};
const rupees = value => value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function VerticalGraph({ data }) {
  const bins = priceHistogram(data.datasets[0]?.data || []);
  const histogram = {
    labels: bins.map(bin => `${rupees(bin.lower)}–${rupees(bin.upper)}`),
    datasets: [{ label: "Holdings", data: bins.map(bin => bin.count), backgroundColor: "rgba(65, 132, 243, 0.55)", borderColor: "rgb(65, 132, 243)", borderWidth: 1, barPercentage: 1, categoryPercentage: 1 }],
  };
  return <div style={{ height: "100%" }}><Bar role="img" aria-label="Holdings stock price histogram" options={options} data={histogram} /></div>;
}

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PlayerPropChart = ({ gameStats, statKey, statName }) => {
  // Filter and sort the game stats
  const filteredStats = gameStats
    .filter((game) => game[statKey] != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = {
    labels: filteredStats.map((game) => `Week ${game.week}`),
    datasets: [
      {
        label: statName,
        data: filteredStats.map((game) => game[statKey]),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgb(53, 162, 235)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `${statName} by Week`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full h-[400px]">
      <Bar options={options} data={data} />
    </div>
  );
};

export default PlayerPropChart;

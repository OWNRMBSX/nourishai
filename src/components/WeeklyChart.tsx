"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from "recharts";

interface DayData {
  date: string;
  calories: number;
  target: number;
  on_target: boolean;
}

interface WeeklyChartProps {
  days: DayData[];
}

function abbreviateDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeeklyChart({ days }: WeeklyChartProps) {
  const chartData = days.map((d) => ({
    ...d,
    day: abbreviateDay(d.date),
  }));

  const targetValue = days.length > 0 ? days[0].target : 2000;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DC" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#7A756E", fontSize: 12 }}
          axisLine={{ stroke: "#E8E3DC" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#7A756E", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E8E3DC",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(value) => [`${value} cal`, "Calories"]}
          labelFormatter={(label) => String(label)}
        />
        <ReferenceLine
          y={targetValue}
          stroke="#7A756E"
          strokeDasharray="6 4"
          strokeWidth={1.5}
          label={{
            value: "Target",
            position: "right",
            fill: "#7A756E",
            fontSize: 11,
          }}
        />
        <Bar dataKey="calories" radius={[6, 6, 0, 0]} barSize={32}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.on_target ? "#4CAF50" : "#FFB74D"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

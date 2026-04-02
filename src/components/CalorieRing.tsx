"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
}

export default function CalorieRing({
  consumed,
  target,
  size = 200,
}: CalorieRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? consumed / target : 0;
  const progress = Math.min(ratio, 1);
  const offset = circumference - progress * circumference;
  const remaining = target - consumed;

  let strokeColor = "#4CAF50";
  if (ratio >= 0.75 && ratio <= 1.0) strokeColor = "#FFB74D";
  if (ratio > 1.0) strokeColor = "#E57373";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E3DC"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </g>
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-4xl font-bold"
        fill="#2D2A26"
        style={{ fontSize: size * 0.16, fontWeight: 700 }}
      >
        {remaining >= 0 ? remaining : `+${Math.abs(remaining)}`}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 20}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#7A756E"
        style={{ fontSize: size * 0.07 }}
      >
        {remaining >= 0 ? "remaining" : "over"}
      </text>
    </svg>
  );
}

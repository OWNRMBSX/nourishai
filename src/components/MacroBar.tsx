"use client";

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

export default function MacroBar({ label, current, target, color }: MacroBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[#2D2A26]">{label}</span>
        <span className="text-sm text-[#7A756E]">
          {Math.round(current)} / {target} g
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[#E8E3DC]">
        <div
          className="h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

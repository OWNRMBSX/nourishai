"use client";

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onAdd: () => void;
}

export default function WaterTracker({ currentMl, goalMl, onAdd }: WaterTrackerProps) {
  const mlPerGlass = 250;
  const currentGlasses = Math.floor(currentMl / mlPerGlass);
  const goalGlasses = Math.ceil(goalMl / mlPerGlass);
  const maxShown = Math.min(goalGlasses, 12);

  return (
    <div className="bg-white border border-[#E8E3DC] rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#2D2A26]">Water</h3>
        <span className="text-sm text-[#7A756E]">
          {currentGlasses} / {goalGlasses} glasses
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: maxShown }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 transition-colors duration-200 ${
              i < currentGlasses
                ? "bg-[#4FC3F7] border-[#4FC3F7]"
                : "bg-transparent border-[#E8E3DC]"
            }`}
          />
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="w-8 h-8 rounded-full bg-[#4CAF50] text-white flex items-center justify-center text-lg font-bold hover:bg-[#81C784] transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

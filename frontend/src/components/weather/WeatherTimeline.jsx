import React from "react";
import { CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export function WeatherTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-stone-500">
        Weather timeline not currently available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto no-scrollbar pb-2">
      <div className="flex gap-2.5 min-w-max">
        {timeline.map((item, idx) => {
          const isToday = idx === 0;

          return (
            <div
              key={item.date || idx}
              className={`flex flex-col items-center justify-between p-3 rounded-2xl border text-center min-w-[105px] transition ${
                isToday
                  ? "bg-primary-50 dark:bg-primary-950/60 border-primary-300 dark:border-primary-700 shadow-2xs font-semibold text-primary-950 dark:text-primary-50"
                  : "bg-white dark:bg-[#162014] border-primary-100 dark:border-primary-900/40 text-stone-700 dark:text-stone-300"
              }`}
            >
              <span className="text-3xs font-bold uppercase tracking-wider text-stone-400">
                {isToday ? "Today" : formatDate(item.date).split(" ")[0]}
              </span>

              <div className="my-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100/60 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                <CloudSun className="h-4.5 w-4.5" />
              </div>

              <div className="text-xs font-bold">
                {item.max_temp !== undefined ? `${Math.round(item.max_temp)}°` : "—"}
                <span className="text-3xs font-normal text-stone-400 ml-1">
                  {item.min_temp !== undefined ? `${Math.round(item.min_temp)}°` : ""}
                </span>
              </div>

              {item.rain_probability !== undefined && (
                <div className="flex items-center gap-0.5 text-3xs text-sky-600 dark:text-sky-400 font-semibold mt-1">
                  <Droplets className="h-2.5 w-2.5" />
                  <span>{Math.round(item.rain_probability)}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeatherTimeline;

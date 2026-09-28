import { Quote } from "lucide-react";

export default function TestimonialCard({ quote, name, location, crop }) {
  return (
    <div className="card h-full">
      <Quote className="text-amber-400" size={28} />
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{quote}</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-display font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
          <p className="text-xs text-gray-400">{location} · {crop} farmer</p>
        </div>
      </div>
    </div>
  );
}

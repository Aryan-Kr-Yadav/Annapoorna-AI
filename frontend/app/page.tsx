import Link from "next/link";
import { Sprout, CloudSun, Stethoscope, LineChart, MessageCircle, Landmark } from "lucide-react";

const FEATURES = [
  { icon: Sprout, title: "Crop Lifecycle Tracking", text: "From sowing to harvest, know exactly what stage every crop is in." },
  { icon: CloudSun, title: "Weather & Irrigation", text: "Weather-aware irrigation guidance based on your crop and soil." },
  { icon: Stethoscope, title: "Crop Doctor", text: "Photograph a leaf, get an honest read on possible issues — with history." },
  { icon: MessageCircle, title: "Annapoorna AI Assistant", text: "Ask questions in Hindi, English, or Hinglish — it knows your farm." },
  { icon: Landmark, title: "Government Schemes", text: "Find potentially relevant schemes for your state and crop." },
  { icon: LineChart, title: "Expenses & Profit", text: "Track spending and see real profit and ROI, season after season." },
];

export default function LandingPage() {
  return (
    <main>
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2 text-primary-800">
          <Sprout className="h-6 w-6" />
          <span className="text-lg font-semibold">Annapoorna AI</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in" className="btn-secondary">Log in</Link>
          <Link href="/sign-up" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-10 text-center md:pt-20">
        <h1 className="text-3xl font-semibold tracking-tight text-primary-900 md:text-5xl">
          Your farm, understood — season after season.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-primary-700 md:text-lg">
          Annapoorna AI is an intelligent farm management platform that follows every crop
          from sowing to harvest — tasks, irrigation, soil, crop health, expenses, schemes, and
          an AI assistant that actually knows your farm.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/sign-up" className="btn-primary px-6 py-3 text-base">Start free</Link>
          <Link href="/sign-in" className="btn-secondary px-6 py-3 text-base">I have an account</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <f.icon className="mb-3 h-6 w-6 text-primary-600" strokeWidth={1.5} />
            <h3 className="font-medium text-primary-900">{f.title}</h3>
            <p className="mt-1 text-sm text-primary-600">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-primary-100 px-6 py-8 text-center text-sm text-primary-500">
        © {new Date().getFullYear()} Annapoorna AI. Built for Indian farmers.
      </footer>
    </main>
  );
}

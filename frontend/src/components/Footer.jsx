import { Link } from "react-router-dom";
import { Sprout, Mail, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="container-app grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Sprout size={18} />
            </span>
            KrishiMitra AI
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            An AI-powered farming companion helping Indian farmers detect crop
            diseases and access government support.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">Product</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link to="/diagnose" className="hover:text-emerald-600">Diagnose Crop</Link></li>
            <li><Link to="/schemes" className="hover:text-emerald-600">Government Schemes</Link></li>
            <li><Link to="/about" className="hover:text-emerald-600">About</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">Resources</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link to="/#faq" className="hover:text-emerald-600">FAQ</Link></li>
            <li><Link to="/#how-it-works" className="hover:text-emerald-600">How It Works</Link></li>
            <li><a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-600">PM-KISAN Portal</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">Connect</h4>
          <div className="flex gap-3">
            <a href="mailto:hello@krishimitra.ai" aria-label="Email" className="rounded-xl bg-white p-2.5 text-gray-500 shadow-card hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400">
              <Mail size={18} />
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-xl bg-white p-2.5 text-gray-500 shadow-card hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400">
              <Github size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="rounded-xl bg-white p-2.5 text-gray-500 shadow-card hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-6 dark:border-gray-800">
        <p className="text-center text-sm text-gray-400">
          © {new Date().getFullYear()} KrishiMitra AI. Built with 💚 for Indian farmers.
        </p>
      </div>
    </footer>
  );
}

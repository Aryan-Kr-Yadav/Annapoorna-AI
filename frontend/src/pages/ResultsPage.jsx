import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Landmark } from "lucide-react";
import DiagnosisCard from "../components/DiagnosisCard.jsx";
import PDFDownloadButton from "../components/PDFDownloadButton.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { diagnosis, meta } = location.state || {};

  if (!diagnosis) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={RefreshCw}
          title="No diagnosis to show yet"
          description="Run a diagnosis first to see your results here."
          action={
            <Link to="/diagnose" className="btn-primary mt-2">
              Start a Diagnosis
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/diagnose")}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400"
        >
          <ArrowLeft size={16} /> Back to Diagnose
        </button>

        <DiagnosisCard diagnosis={diagnosis} />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <PDFDownloadButton diagnosis={diagnosis} meta={meta} />
          <Link to="/schemes" className="btn-amber flex-1 sm:flex-none">
            <Landmark size={18} /> Find Government Schemes
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          This is an AI-generated diagnosis and should not replace advice from a
          qualified agricultural expert, especially for high-severity cases.
        </p>
      </div>
    </div>
  );
}

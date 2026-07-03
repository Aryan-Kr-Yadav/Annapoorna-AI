import { FileDown } from "lucide-react";
import { generateDiagnosisPDF } from "../utils/pdfGenerator.js";
import { useToast } from "../hooks/useToast.js";

export default function PDFDownloadButton({ diagnosis, meta }) {
  const toast = useToast();

  const handleDownload = () => {
    try {
      generateDiagnosisPDF(diagnosis, meta);
      toast.success("Report downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't generate the PDF. Please try again.");
    }
  };

  return (
    <button onClick={handleDownload} className="btn-secondary">
      <FileDown size={18} />
      Download Report (PDF)
    </button>
  );
}

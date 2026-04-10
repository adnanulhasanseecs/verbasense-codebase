import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import type { TranscriptLine } from "@/lib/mock-data";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toTranscriptText(lines: TranscriptLine[]): string[] {
  return lines.map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`);
}

export async function exportTranscriptDocx(lines: TranscriptLine[], sessionId: string) {
  const paragraphs = toTranscriptText(lines).map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 160 },
      }),
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Transcript ${sessionId}`, bold: true, size: 28 })],
            spacing: { after: 280 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${sessionId}-transcript.docx`);
}

export function exportTranscriptPdf(lines: TranscriptLine[], sessionId: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const maxWidth = 515;
  let y = 48;

  pdf.setFontSize(14);
  pdf.text(`Transcript ${sessionId}`, marginX, y);
  y += 26;

  pdf.setFontSize(10);
  for (const raw of toTranscriptText(lines)) {
    const chunks = pdf.splitTextToSize(raw, maxWidth) as string[];
    for (const chunk of chunks) {
      if (y > 790) {
        pdf.addPage();
        y = 48;
      }
      pdf.text(chunk, marginX, y);
      y += 14;
    }
    y += 4;
  }

  pdf.save(`${sessionId}-transcript.pdf`);
}

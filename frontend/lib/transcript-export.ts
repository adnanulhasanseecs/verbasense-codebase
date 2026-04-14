import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import type { TranscriptLine } from "@/lib/mock-data";
import type { OutputSchema } from "@/lib/api";

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

export async function exportTranscriptDocx(
  lines: TranscriptLine[],
  sessionId: string,
  intelligence?: Pick<OutputSchema, "summary" | "key_decisions" | "actions">,
) {
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
          new Paragraph({
            children: [new TextRun({ text: "Intelligence", bold: true, size: 26 })],
            spacing: { before: 300, after: 180 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Summary: ${intelligence?.summary ?? "-"}`, size: 22 })],
            spacing: { after: 140 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Decisions: ${(intelligence?.key_decisions ?? []).join(" | ") || "-"}`, size: 22 })],
            spacing: { after: 140 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Actions: ${(intelligence?.actions ?? []).map((x) => x.text).join(" | ") || "-"}`, size: 22 })],
            spacing: { after: 140 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${sessionId}-transcript.docx`);
}

export function exportTranscriptPdf(
  lines: TranscriptLine[],
  sessionId: string,
  intelligence?: Pick<OutputSchema, "summary" | "key_decisions" | "actions">,
) {
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

  y += 10;
  if (y > 760) {
    pdf.addPage();
    y = 48;
  }
  pdf.setFontSize(12);
  pdf.text("Intelligence", marginX, y);
  y += 18;
  pdf.setFontSize(10);
  const intelLines = [
    `Summary: ${intelligence?.summary ?? "-"}`,
    `Decisions: ${(intelligence?.key_decisions ?? []).join(" | ") || "-"}`,
    `Actions: ${(intelligence?.actions ?? []).map((x) => x.text).join(" | ") || "-"}`,
  ];
  for (const row of intelLines) {
    const chunks = pdf.splitTextToSize(row, maxWidth) as string[];
    for (const chunk of chunks) {
      if (y > 790) {
        pdf.addPage();
        y = 48;
      }
      pdf.text(chunk, marginX, y);
      y += 14;
    }
  }

  pdf.save(`${sessionId}-transcript.pdf`);
}

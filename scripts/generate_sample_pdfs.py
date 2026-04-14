from fpdf import FPDF
from pathlib import Path
import textwrap

out_dir = Path(r"c:\Users\office\.cursor\VerbaSense-codebase\docs\sample-docs")
out_dir.mkdir(parents=True, exist_ok=True)

samples = [
    {
        "filename": "01-motion-for-continuance.pdf",
        "title": "Motion for Continuance",
        "meta": "Case ID: CR-2026-118 | Court: Metro District Court | Date: 2026-04-06",
        "sections": [
            ("Section 1. Background", "Defense counsel requests a seven day continuance to file supplemental witness affidavits. The current hearing concerns evidentiary scheduling and procedural compliance."),
            ("Section 2. Key Points", "1) New forensic lab report arrived late. 2) Counsel requires additional review time. 3) No prejudice to prosecution if brief extension granted."),
            ("Section 3. Referenced Sections", "Cites Criminal Procedure Rule 17.2, Docket Entry 2026-03-29, and prior status order dated 2026-04-01."),
            ("Section 4. Entities", "Judge: Hon. Avery Cole | Parties: State v. R. Morales | Evidence: Exhibit A, Exhibit C | Date Mentioned: 2026-04-12")
        ]
    },
    {
        "filename": "02-witness-statement-summary.pdf",
        "title": "Witness Statement Summary",
        "meta": "Case ID: CR-2026-118 | Witness: Jordan Hayes | Date: 2026-04-05",
        "sections": [
            ("Section 1. Statement Overview", "Witness confirms timeline of events between 20:30 and 21:10 near North Avenue intersection and identifies vehicle plate fragments."),
            ("Section 2. Key Points", "1) Witness saw two individuals near loading dock. 2) Loud impact heard at 20:47. 3) Emergency call placed at 20:49."),
            ("Section 3. Referenced Sections", "Cross references Incident Report IR-556, CCTV Clip Segment B, and Forensics Log FL-22."),
            ("Section 4. Entities", "Locations: North Avenue, Dock 3 | Persons: Jordan Hayes, Officer Leena Park | Items: Black sedan, metal briefcase")
        ]
    },
    {
        "filename": "03-evidence-index.pdf",
        "title": "Evidence Index and Chain Notes",
        "meta": "Case ID: CR-2026-118 | Clerk Office Filing | Date: 2026-04-04",
        "sections": [
            ("Section 1. Evidence Register", "Exhibit A: Surveillance stills. Exhibit B: Audio transcript. Exhibit C: Financial ledger extract. Exhibit D: Access card logs."),
            ("Section 2. Key Points", "Chain of custody signatures verified for A-C. Exhibit D pending secondary verification due to timestamp mismatch."),
            ("Section 3. Referenced Sections", "Refers to Intake SOP 9.4, Clerk Record CR-44, and Security Log SL-887."),
            ("Section 4. Entities", "Custodians: M. Rivera, S. Patel | Location: Evidence Room B | Dates: 2026-04-02 to 2026-04-04")
        ]
    },
    {
        "filename": "04-hearing-minutes-procedural-order.pdf",
        "title": "Hearing Minutes and Procedural Order",
        "meta": "Court: Metro District Court | Session ID: SES-2026-1042 | Date: 2026-04-06",
        "sections": [
            ("Section 1. Proceedings", "Court convened at 09:42. Counsel addressed pending motion and scheduling conflict. Clerk recorded objections and admissions."),
            ("Section 2. Key Decisions", "Continuance granted for seven days. Supplemental filings due before next hearing. Clerk instructed to update docket immediately."),
            ("Section 3. Referenced Sections", "References Standing Order SO-12, Rule 4.1(b), and prior order 2026-03-14."),
            ("Section 4. Entities", "Judge: Hon. Avery Cole | Counsel: Dana Iqbal, Marcus Trent | Next Date: 2026-04-13")
        ]
    },
    {
        "filename": "05-financial-ledger-extract.pdf",
        "title": "Financial Ledger Extract Reviewed",
        "meta": "Case ID: CR-2026-118 | Source: Accounting Subpoena | Date: 2026-04-03",
        "sections": [
            ("Section 1. Summary", "Ledger shows three transfers above threshold amount within 48 hours preceding incident. Two transfers routed through same intermediary account."),
            ("Section 2. Key Points", "1) Transfer IDs TX-9901, TX-9905, TX-9910. 2) Shared beneficiary account ending 4421. 3) One reversal posted on 2026-04-02."),
            ("Section 3. Referenced Sections", "Cross references Bank Affidavit BA-17 and Compliance Note CN-08."),
            ("Section 4. Entities", "Accounts: 1102-4421, 5530-7718 | Institutions: Delta Trust, Union Metro | Amounts: 48500 / 52000 / 49300")
        ]
    },
    {
        "filename": "06-digital-forensics-brief.pdf",
        "title": "Digital Forensics Brief",
        "meta": "Case ID: CR-2026-118 | Unit: DF Lab | Date: 2026-04-07",
        "sections": [
            ("Section 1. Examination Scope", "Reviewed mobile extraction, email headers, and access card system logs. Integrity checks completed with SHA-256 hash verification."),
            ("Section 2. Key Findings", "Recovered deleted message thread dated 2026-03-31. Access badge used at restricted zone at 20:41 and 20:52. Device clock drift of plus 42 seconds."),
            ("Section 3. Referenced Sections", "References Forensics SOP F-11, Hash Register HR-203, and Access System Manual ASM-2."),
            ("Section 4. Entities", "Devices: Pixel-7, ThinkPad T14 | IDs: Badge-4471, User-AC09 | Analysts: Priya Sen, Omar Khalid")
        ]
    },
]

for s in samples:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.multi_cell(180, 10, s["title"])
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(180, 7, s["meta"])
    pdf.ln(2)

    for heading, body in s["sections"]:
        pdf.set_font("Helvetica", "B", 12)
        pdf.multi_cell(180, 8, heading)
        pdf.set_font("Helvetica", "", 11)
        for chunk in textwrap.wrap(body, width=105):
            pdf.multi_cell(180, 7, chunk)
        pdf.ln(2)

    pdf.output(str(out_dir / s["filename"]))

print(f"Generated {len(samples)} PDFs in {out_dir}")

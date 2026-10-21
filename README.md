# Record2Code • Clinical Coding Assistant for Indian Hospitals

Record2Code is a specialized clinical coding website designed for Indian hospital medical coders, billing teams, and trainees. Coders paste or type de-identified patient records, search and verify diagnostic codes from the official World Health Organization ICD-10 specification (all 22 chapters, 11,243 codes), inspect dual-coding rules (dagger † and asterisk *), and export verified summaries in PDF, Word, and CSV formats.

---

## Key Features

1. **Official WHO ICD-10 Specification (2019 Release)**
   - Exactly **11,243 codes** across all **22 chapters**.
   - No US ICD-10-CM modifiers or third-party scraping.
   - Preserves official WHO dagger (†) etiology codes and asterisk (*) manifestation codes.
   - Includes full hierarchy: parent 3-character categories, terminal leaf status, block ranges (e.g. `A00-A09`), and all official Includes and Excludes instructions.

2. **Featherlight Performance (< 95 kB Initial Bundle)**
   - The 3.8 MB `icd10.json` file is loaded on-demand through server API routes (`/api/codes`) only when searching or viewing codes in the Workspace or Trainee pages.
   - The Home page bundle is completely free of large data files.
   - Fast Lighthouse score (> 85).

3. **Medical-Themed ECG Loading Animation**
   - Clean SVG heartbeat line animation drawing across with logo fade-in.
   - Built with pure CSS and SVG (no video, GIF, or heavy libraries).
   - Finishes in under 1.2 seconds and respects `prefers-reduced-motion`.

4. **3-Column Workspace**
   - **Column 1 (Left):** Doctor's report with raw text vs. marked view, preset clinical cases, and character/word counters.
   - **Column 2 (Middle):** Code search and suggested codes with instant accept/reject controls and staged Final Codes drawer.
   - **Column 3 (Right):** Book rules inspector displaying parent category, block range, billable leaf status, and full Includes and Excludes notes.

5. **Trainee Practice Mode**
   - Structured practice cases (e.g., Diabetic Nephropathy, COPD with Infection, Hypertension, Dengue).
   - Interactive answer selection with instant scoring, dual-coding explanation, and book rule breakdowns.

6. **Zero-Server Browser Export**
   - **Download PDF**: Formatted clean printable letterhead with auto-print dialog.
   - **Download Word (.doc)**: Structured Microsoft Word document with facility metadata, patient reference, table of accepted codes, and compliance disclaimer.
   - **Download CSV**: Standard RFC 4180 CSV blob with UTF-8 BOM for Microsoft Excel.

7. **Mandatory Coder Verification Disclaimer**
   - Every exported report and page footer includes the mandatory reminder that all suggested codes must be reviewed and countersigned by a certified medical coder.

---

## Steps to Run on Your Computer

### Prerequisites
- Node.js (v18 or newer recommended, tested on Node v24)
- npm

### 1. Install Dependencies
Open your terminal or PowerShell in the project directory:
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Production Build & Run (Optional)
To test the optimized production build locally:
```bash
npm run build
npm start
```
The site will run at [http://localhost:3000](http://localhost:3000).

---

## Ready for Vercel Deployment

This project uses standard Next.js App Router and runs with zero external servers:
1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Vercel will automatically detect Next.js and run `npm run build`.
4. Deploy in one click.

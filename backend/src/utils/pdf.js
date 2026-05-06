// src/utils/pdf.js - PDF generation with Puppeteer fallback

const generatePDF = async (data, meta) => {
  const html = buildReportHTML(data, meta);

  try {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "12mm", right: "12mm" },
    });
    await browser.close();
    return buffer;
  } catch {
    try {
      const htmlPdf = require("html-pdf-node");
      const file = { content: html };
      const options = {
        format: "A4",
        margin: { top: "15mm", bottom: "15mm", left: "12mm", right: "12mm" },
        printBackground: true,
      };
      return await htmlPdf.generatePdf(file, options);
    } catch {
      return Buffer.from(html, "utf-8");
    }
  }
};

const buildReportHTML = (data, meta) => {
  const { summary, genderBreakdown, disabilityBreakdown, classBreakdown, ageBreakdown, intByType } = data;
  const P = "#CC1E53";

  const kpiCard = (label, value, sub = "") => `
    <div style="background:#fff;border-radius:8px;padding:14px;border-left:4px solid ${P};border:1px solid #E5E7EB;border-left-color:${P};">
      <div style="font-size:10px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
      <div style="font-size:24px;font-weight:800;color:#111827;margin:4px 0 2px;">${value}</div>
      ${sub ? `<div style="font-size:10px;color:#6B7280;">${sub}</div>` : ""}
    </div>`;

  const tableRow = (cols, header = false) => `
    <tr style="background:${header ? "#F9FAFB" : "white"}">
      ${cols
        .map(
          (c, i) =>
            `<td style="padding:8px 10px;font-size:12px;${i === 0 ? "font-weight:600;" : ""}border-bottom:1px solid #F3F4F6;${
              header ? "font-weight:700;color:#6B7280;font-size:10px;text-transform:uppercase;" : ""
            }">${c}</td>`
        )
        .join("")}
    </tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 0; font-size: 13px; }
  h2 { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; }
  .section { margin-bottom: 22px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
</style>
</head>
<body style="padding:0;">
<div style="background:${P};padding:20px 24px;color:white;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">PRAGATI</div>
      <div style="font-size:11px;opacity:0.75;margin-top:2px;">Progress Reporting & Assessment for Growth And Tracking of Individuals</div>
      <div style="font-size:11px;opacity:0.65;margin-top:3px;">Bright Beginnings NGO · Rajasthan</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:14px;font-weight:700;">${meta.title}</div>
      <div style="font-size:11px;opacity:0.8;margin-top:4px;">Period: ${meta.period}</div>
      <div style="font-size:11px;opacity:0.8;">District: ${meta.district || "All"}</div>
      <div style="font-size:10px;opacity:0.65;margin-top:4px;">Generated: ${new Date(meta.generatedAt).toLocaleDateString("en-IN")}</div>
    </div>
  </div>
</div>

<div style="padding:20px 24px;">
  <div class="section">
    <h2>Key Performance Indicators</h2>
    <div class="grid-3">
      ${kpiCard("Total Children", summary.totalChildren, "CWSN enrolled")}
      ${kpiCard("Active IEPs", summary.iepActive, `${summary.iepCoveragePct}% coverage`)}
      ${kpiCard("Interventions", summary.interventionsTotal, "sessions logged")}
      ${kpiCard("Devices Given", summary.devicesTotal, `${summary.devCoveragePct}% coverage`)}
      ${kpiCard("Assessed", summary.assessedCount, "children with assessments")}
      ${kpiCard("IEP Coverage", `${summary.iepCoveragePct}%`, summary.iepCoveragePct >= 80 ? "On target" : "Below 80% target")}
    </div>
  </div>

  <div class="section">
    <h2>Gender-wise Summary</h2>
    <table>
      ${tableRow(["Metric", "Male", "Female", "Transgender", "Total"], true)}
      ${tableRow(["Children Enrolled", genderBreakdown.MALE || 0, genderBreakdown.FEMALE || 0, genderBreakdown.TRANSGENDER || 0, summary.totalChildren])}
    </table>
  </div>

  <div class="section">
    <h2>Age-group Summary</h2>
    <table>
      ${tableRow(["Age Group", "Children", "% of Total"], true)}
      ${Object.entries(ageBreakdown)
        .map(([g, c]) => tableRow([`${g} years`, c, summary.totalChildren > 0 ? `${Math.round((c / summary.totalChildren) * 100)}%` : "0%"]))
        .join("")}
    </table>
  </div>

  <div class="section">
    <h2>Disability-wise Distribution</h2>
    <table>
      ${tableRow(["Disability Type", "Count", "% of Total"], true)}
      ${Object.entries(disabilityBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => tableRow([type, count, summary.totalChildren > 0 ? `${Math.round((count / summary.totalChildren) * 100)}%` : "0%"]))
        .join("")}
    </table>
  </div>

  <div class="section">
    <h2>Interventions by Type</h2>
    <table>
      ${tableRow(["Intervention Type", "Sessions", "% of Total"], true)}
      ${Object.entries(intByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => tableRow([type, count, summary.interventionsTotal > 0 ? `${Math.round((count / summary.interventionsTotal) * 100)}%` : "0%"]))
        .join("")}
    </table>
  </div>

  <div class="section">
    <h2>Class-wise Enrollment</h2>
    <table>
      ${tableRow(["Class", "Children"], true)}
      ${Object.entries(classBreakdown).map(([cls, count]) => tableRow([cls, count])).join("")}
    </table>
  </div>
</div>

<div style="background:#F9FAFB;padding:12px 24px;border-top:1px solid #E5E7EB;margin-top:20px;">
  <div style="display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;">
    <span>PRAGATI MIS Portal - Bright Beginnings NGO, Rajasthan</span>
    <span>Confidential - For internal use only</span>
    <span>Generated: ${new Date().toLocaleString("en-IN")}</span>
  </div>
</div>
</body></html>`;
};

module.exports = { generatePDF };

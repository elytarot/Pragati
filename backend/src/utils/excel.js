// src/utils/excel.js — Multi-sheet Excel report generation
const XLSX = require("xlsx");

const generateExcel = async (data, meta) => {
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: meta.title, Author: "PRAGATI — Bright Beginnings NGO", CreatedDate: new Date() };

  // ── SHEET 1: Summary ───────────────────────────────────────────
  const summaryData = [
    ["PRAGATI MIS Portal — Bright Beginnings NGO", "", "", ""],
    [meta.title, "", "", ""],
    ["Period:", meta.period, "District:", meta.district || "All Districts"],
    ["Generated:", new Date().toLocaleString("en-IN"), "", ""],
    ["", "", "", ""],
    ["KEY PERFORMANCE INDICATORS", "", "", ""],
    ["Metric", "Value", "Target", "Status"],
    ["Total Children Enrolled",   meta.summary?.totalChildren || data.summary.totalChildren,   "", ""],
    ["Active IEPs",               meta.summary?.iepActive     || data.summary.iepActive,       "", ""],
    ["IEP Coverage %",            (data.summary.iepCoveragePct) + "%", "80%", data.summary.iepCoveragePct >= 80 ? "On Target" : "Below Target"],
    ["Devices Distributed",       data.summary.devicesTotal,   "", ""],
    ["Device Coverage %",         data.summary.devCoveragePct + "%", "60%", ""],
    ["Total Interventions",       data.summary.interventionsTotal, "", ""],
    ["Children Assessed",         data.summary.assessedCount, "", ""],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // ── SHEET 2: Children List ─────────────────────────────────────
  const childHeaders = ["BB ID", "Name", "Age", "Gender", "Disability", "Severity", "Class", "School", "Block", "District", "Village", "Status", "Worker"];
  const childRows = data.children.map((c) => {
    const age = Math.floor((Date.now() - new Date(c.dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    return [
      c.bbId, c.name, age, c.gender,
      c.disabilities?.map((d) => d.type).join(", ") || "",
      c.disabilities?.[0]?.severity || "",
      c.currentClass, c.schoolName,
      c.block?.name || "", c.district?.name || "", c.village, c.status,
      c.worker?.name || "",
    ];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([childHeaders, ...childRows]);
  ws2["!cols"] = [{ wch: 18 }, { wch: 20 }, { wch: 6 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 12 },
                  { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Children");

  // ── SHEET 3: Gender Analysis ───────────────────────────────────
  const genderData = [
    ["Gender-wise Analysis"],
    ["Gender", "Count", "% of Total"],
    ...Object.entries(data.genderBreakdown).map(([g, c]) => [
      g, c, data.summary.totalChildren > 0 ? ((c / data.summary.totalChildren) * 100).toFixed(1) + "%" : "0%"
    ]),
    [""],
    ["Age Group Analysis"],
    ["Age Group", "Count", "% of Total"],
    ...Object.entries(data.ageBreakdown).map(([g, c]) => [
      g + " years", c, data.summary.totalChildren > 0 ? ((c / data.summary.totalChildren) * 100).toFixed(1) + "%" : "0%"
    ]),
    [""],
    ["Class-wise Enrollment"],
    ["Class", "Count"],
    ...Object.entries(data.classBreakdown).map(([cls, c]) => [cls, c]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(genderData);
  ws3["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Analysis");

  // ── SHEET 4: Disability Breakdown ──────────────────────────────
  const disHeaders = ["Disability Type", "Count", "% of Total", "With IEP", "With Device"];
  const iepByDis = {};
  data.ieps.forEach((iep) => {
    const child = data.children.find((c) => c.id === iep.childId);
    child?.disabilities?.forEach((d) => { iepByDis[d.type] = (iepByDis[d.type] || 0) + 1; });
  });
  const devByDis = {};
  data.devices.forEach((dev) => { devByDis[dev.disabilityType] = (devByDis[dev.disabilityType] || 0) + 1; });

  const disRows = Object.entries(data.disabilityBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => [
    type, count,
    data.summary.totalChildren > 0 ? ((count / data.summary.totalChildren) * 100).toFixed(1) + "%" : "0%",
    iepByDis[type] || 0, devByDis[type] || 0,
  ]);
  const ws4 = XLSX.utils.aoa_to_sheet([disHeaders, ...disRows]);
  ws4["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Disabilities");

  // ── SHEET 5: Interventions ─────────────────────────────────────
  const intHeaders = ["Date", "Child Name", "BB ID", "Intervention Type", "Duration (min)", "Topic", "Outcome"];
  const intRows = data.interventions.map((i) => [
    new Date(i.date).toLocaleDateString("en-IN"),
    i.child?.name || "", i.child?.bbId || "", i.type, i.durationMin, i.topic, i.outcome || "",
  ]);
  const ws5 = XLSX.utils.aoa_to_sheet([intHeaders, ...intRows]);
  ws5["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 15 }, { wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws5, "Interventions");

  // ── SHEET 6: Devices ───────────────────────────────────────────
  const devHeaders = ["Child Name", "BB ID", "Disability", "Device", "Provider", "Date Given", "Condition", "Warranty"];
  const devRows = data.devices.map((d) => [
    d.child?.name || "", d.child?.bbId || "", d.disabilityType, d.deviceName, d.provider,
    new Date(d.dateGiven).toLocaleDateString("en-IN"), d.condition || "",
    d.warrantyExpiry ? new Date(d.warrantyExpiry).toLocaleDateString("en-IN") : "",
  ]);
  const ws6 = XLSX.utils.aoa_to_sheet([devHeaders, ...devRows]);
  ws6["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws6, "Devices");

  // Write to buffer
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return buffer;
};

module.exports = { generateExcel };

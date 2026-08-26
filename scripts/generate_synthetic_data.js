#!/usr/bin/env node
// INFRA-XRAY — Synthetic Data Generator
// Generates 6 fictional Indian government infrastructure projects
// with realistic PDF documents and placeholder site photos.

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const DATA_DIR = path.join(__dirname, "..", "data");
const RAW_DOCS = path.join(DATA_DIR, "raw_docs");
const RAW_PHOTOS = path.join(DATA_DIR, "raw_photos");

// ─── 6 Projects with EXACT intended characteristics ───

const PROJECTS = [
  {
    project_id: "proj_001",
    project_name: "Widening of NH-48 (Jaipur–Jodhpur Section)",
    state: "Rajasthan",
    category: "road",
    sanctioned_amount_inr: 850000000,
    sanctioned_quantity: 10,
    unit: "km",
    contractor_name: "Rajasthan Infracon Ltd.",
    tender_id: "RJ/NG/2024/0412",
    gps_boundary: {
      type: "LineString",
      coordinates: [
        [26.9124, 75.7873],
        [26.9200, 75.8100],
        [26.9350, 75.8500],
        [26.9500, 75.8900],
        [26.9650, 75.9300],
      ],
    },
    start_date: "2024-03-15",
    deadline: "2025-09-30",
    // Intended: ALL CLEAN
    contract: { sanctioned_km: 10 },
    progress: { claimed_km: 9.9, percent: 99 },
    invoice: { billed_amount: 835000000, billed_km: 9.9 },
    inspection: { verified_km: 9.8, gps_track_deviation: 0 },
    photos: ["clean_surface", "clean_surface", "clean_surface", "clean_surface"],
  },
  {
    project_id: "proj_002",
    project_name: "Rural Road Connecting Aurangabad to Gaya (PMGSY)",
    state: "Bihar",
    category: "road",
    sanctioned_amount_inr: 250000000,
    sanctioned_quantity: 10,
    unit: "km",
    contractor_name: "Bharat Road Builders Pvt. Ltd.",
    tender_id: "BR/RD/2024/1187",
    gps_boundary: {
      type: "LineString",
      coordinates: [
        [24.7500, 84.9900],
        [24.7600, 85.0100],
        [24.7700, 85.0300],
        [24.7800, 85.0500],
        [24.7900, 85.0700],
      ],
    },
    start_date: "2024-01-10",
    deadline: "2025-06-30",
    // Intended: MAJOR MISMATCH (flagship demo case)
    contract: { sanctioned_km: 10 },
    progress: { claimed_km: 9.0, percent: 90 },
    invoice: { billed_amount: 175000000, billed_km: 9.0 }, // ₹17.5 Cr
    inspection: { verified_km: 7.8, gps_track_deviation: 0 },
    photos: ["clean_surface", "pothole", "cracking", "clean_surface"],
  },
  {
    project_id: "proj_003",
    project_name: "Construction of Government Higher Secondary School Building",
    state: "Madhya Pradesh",
    category: "building",
    sanctioned_amount_inr: 42000000,
    sanctioned_quantity: 4500,
    unit: "sqft",
    contractor_name: "MP Construction Corp",
    tender_id: "MP/EDU/2024/0293",
    gps_boundary: {
      type: "Polygon",
      coordinates: [
        [23.2599, 77.4126],
        [23.2600, 77.4128],
        [23.2602, 77.4128],
        [23.2602, 77.4126],
        [23.2599, 77.4126],
      ],
    },
    start_date: "2024-06-01",
    deadline: "2025-12-31",
    // Intended: COST OVERBILLING — work matches but invoice 18% higher
    contract: { sanctioned_sqft: 4500 },
    progress: { claimed_sqft: 4275, percent: 95 },
    invoice: { billed_amount: 49560000, billed_sqft: 4275 }, // 18% over BOQ
    inspection: { verified_sqft: 4250, gps_track_deviation: 0 },
    photos: ["clean_surface", "clean_surface", "clean_surface"],
  },
  {
    project_id: "proj_004",
    project_name: "Bridge Construction over Mahanadi River",
    state: "Odisha",
    category: "bridge",
    sanctioned_amount_inr: 620000000,
    sanctioned_quantity: 480,
    unit: "m",
    contractor_name: "Eastern Bridges Ltd.",
    tender_id: "OD/PWD/2024/0576",
    gps_boundary: {
      type: "LineString",
      coordinates: [
        [20.2961, 85.8245],
        [20.2965, 85.8250],
        [20.2970, 85.8255],
      ],
    },
    start_date: "2024-02-20",
    deadline: "2026-02-20",
    // Intended: DATE INCONSISTENCY — invoice dated BEFORE progress report
    contract: { sanctioned_m: 480 },
    progress: { claimed_m: 360, percent: 75, report_date: "2025-06-15" },
    invoice: { billed_amount: 465000000, billed_m: 360, payment_date: "2025-05-20" }, // BEFORE report
    inspection: { verified_m: 355, gps_track_deviation: 0 },
    photos: ["clean_surface", "cracking", "clean_surface"],
  },
  {
    project_id: "proj_005",
    project_name: "Water Pipeline from Treatment Plant to Distribution Network",
    state: "Uttar Pradesh",
    category: "pipeline",
    sanctioned_amount_inr: 180000000,
    sanctioned_quantity: 25,
    unit: "km",
    contractor_name: "UP Jal Nigam Contractors",
    tender_id: "UP/JN/2024/0834",
    gps_boundary: {
      type: "LineString",
      coordinates: [
        [26.8467, 80.9462],
        [26.8500, 80.9500],
        [26.8550, 80.9600],
        [26.8600, 80.9750],
        [26.8650, 80.9900],
      ],
    },
    start_date: "2024-04-01",
    deadline: "2025-10-31",
    // Intended: MODERATE MISMATCH — ~400m route deviation at one segment
    contract: { sanctioned_km: 25 },
    progress: { claimed_km: 20, percent: 80 },
    invoice: { billed_amount: 144000000, billed_km: 20 },
    inspection: { verified_km: 18.5, gps_track_deviation: 400 },
    photos: ["clean_surface", "clean_surface", "pothole", "clean_surface"],
  },
  {
    project_id: "proj_006",
    project_name: "Government Office Building — Sector 17, Chandigarh",
    state: "Punjab",
    category: "building",
    sanctioned_amount_inr: 95000000,
    sanctioned_quantity: 8000,
    unit: "sqft",
    contractor_name: "Chandigarh Buildtech Pvt. Ltd.",
    tender_id: "PB/GOV/2024/0102",
    gps_boundary: {
      type: "Polygon",
      coordinates: [
        [30.7333, 76.7794],
        [30.7335, 76.7796],
        [30.7337, 76.7796],
        [30.7337, 76.7794],
        [30.7333, 76.7794],
      ],
    },
    start_date: "2024-05-15",
    deadline: "2025-11-15",
    // Intended: CLEAN — everything matches within 2%
    contract: { sanctioned_sqft: 8000 },
    progress: { claimed_sqft: 7840, percent: 98 },
    invoice: { billed_amount: 93100000, billed_sqft: 7840 },
    inspection: { verified_sqft: 7800, gps_track_deviation: 0 },
    photos: ["clean_surface", "clean_surface", "clean_surface", "clean_surface"],
  },
];

// ─── Ground Truth ───

const GROUND_TRUTH = PROJECTS.map((p) => ({
  project_id: p.project_id,
  intended_mismatch_type:
    p.project_id === "proj_001"
      ? "none"
      : p.project_id === "proj_002"
      ? "major_quantity_mismatch"
      : p.project_id === "proj_003"
      ? "cost_overbilling"
      : p.project_id === "proj_004"
      ? "date_inconsistency"
      : p.project_id === "proj_005"
      ? "moderate_mismatch_with_route_deviation"
      : "none",
  quantity_deviation_pct:
    p.project_id === "proj_002"
      ? 22
      : p.project_id === "proj_005"
      ? 7.5
      : p.project_id === "proj_006"
      ? 2
      : p.project_id === "proj_001"
      ? 2
      : 0,
  cost_deviation_pct: p.project_id === "proj_003" ? 18 : 0,
  days_between_report_and_invoice:
    p.project_id === "proj_004" ? -26 : 0,
  route_deviation_m: p.project_id === "proj_005" ? 400 : 0,
  intended_cv_tags: p.photos,
  cv_anomaly_ratio:
    p.photos.filter((t) => t !== "clean_surface").length / p.photos.length,
}));

// ─── PDF Generator ───

function drawLetterhead(doc, title) {
  // Header bar
  doc.rect(50, 30, 500, 60).fill("#1a365d");
  doc.fontSize(16).fillColor("#ffffff").text("GOVERNMENT OF INDIA", 60, 40, { align: "center", width: 480 });
  doc.fontSize(10).text("Ministry of Road Transport & Highways / Public Works Department", 60, 60, { align: "center", width: 480 });

  // Title
  doc.moveDown(2);
  doc.fontSize(14).fillColor("#1a365d").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.moveTo(60, doc.y).lineTo(540, doc.y).stroke("#1a365d");
  doc.moveDown(0.5);
  doc.fillColor("#000000");
}

function generateContractPDF(project, filepath) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);
  drawLetterhead(doc, "CONTRACT AGREEMENT");
  doc.fontSize(10);
  doc.text(`Tender ID: ${project.tender_id}`);
  doc.text(`Project: ${project.project_name}`);
  doc.text(`State: ${project.state}`);
  doc.text(`Contractor: ${project.contractor_name}`);
  doc.moveDown();
  doc.text(`Scope of Work: ${project.sanctioned_quantity} ${project.unit} of ${project.category} work as per approved drawings and specifications.`);
  doc.text(`Sanctioned Quantity: ${project.sanctioned_quantity} ${project.unit}`);
  doc.text(`Sanctioned Cost: INR ${(project.sanctioned_amount_inr / 10000000).toFixed(2)} Cr`);
  doc.moveDown();
  const coords = project.gps_boundary.coordinates;
  doc.text(`GPS Boundary: ${coords.map((c) => `[${c[0]}, ${c[1]}]`).join(" → ")}`);
  doc.moveDown();
  doc.text(`Start Date: ${project.start_date}`);
  doc.text(`Completion Deadline: ${project.deadline}`);
  doc.moveDown(2);
  doc.text("Authorized Signatory: ________________________");
  doc.text("Date: ________________________");
  doc.end();
}

function generateBOQPDF(project, filepath) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);
  drawLetterhead(doc, "BILL OF QUANTITIES");

  doc.fontSize(10).text(`Tender ID: ${project.tender_id}`);
  doc.text(`Project: ${project.project_name}`);
  doc.moveDown();

  // Generate line items that sum to sanctioned amount
  const items = generateBOQItems(project);
  doc.fontSize(9);
  const tableTop = doc.y;
  const colX = [55, 230, 320, 400, 480];

  doc.fillColor("#1a365d").text("Item", colX[0], tableTop, { width: 170 });
  doc.text("Unit Rate", colX[1], tableTop, { width: 85 });
  doc.text("Qty", colX[2], tableTop, { width: 70 });
  doc.text("Amount", colX[3], tableTop, { width: 70 });
  doc.fillColor("#000000");
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.3);

  let total = 0;
  for (const item of items) {
    const y = doc.y;
    doc.text(item.item, colX[0], y, { width: 170 });
    doc.text(`₹${item.unit_rate_inr.toLocaleString("en-IN")}`, colX[1], y, { width: 85 });
    doc.text(`${item.quantity}`, colX[2], y, { width: 70 });
    doc.text(`₹${item.line_total_inr.toLocaleString("en-IN")}`, colX[3], y, { width: 70 });
    total += item.line_total_inr;
    doc.moveDown(0.8);
  }

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(10).text(`BOQ Total: INR ${total.toLocaleString("en-IN")}`, 300, doc.y, { width: 250, align: "right" });

  doc.end();
}

function generateBOQItems(project) {
  const total = project.sanctioned_amount_inr;
  const categories = {
    road: [
      "Earthwork in excavation",
      "Granular sub-base material",
      "Dense bituminous macadam",
      "Cement concrete pavement",
      "Road median and crash barriers",
      "Drainage structures",
    ],
    building: [
      "Foundation and plinth work",
      "Brick masonry walls",
      "RCC roof slab",
      "Plastering and painting",
      "Door and window frames",
      "Electrical and plumbing",
    ],
    bridge: [
      "Pile foundation work",
      "Pier and abutment construction",
      "Deck slab casting",
      "Bearings and expansion joints",
      "Approach road work",
      "Railings and finishing",
    ],
    pipeline: [
      "Pipe supply (HDPE/DI)",
      "Trench excavation and backfill",
      "Pipe laying and jointing",
      "Valve chambers",
      "Testing and commissioning",
      "Restoration of road surface",
    ],
  };

  const items = categories[project.category] || categories.road;
  const weights = [0.25, 0.15, 0.3, 0.15, 0.1, 0.05];
  let remaining = total;

  return items.map((item, i) => {
    const isLast = i === items.length - 1;
    const line_total = isLast ? remaining : Math.round(total * weights[i]);
    remaining -= line_total;
    const quantity = Math.round(project.sanctioned_quantity * (0.8 + Math.random() * 0.4) * 100) / 100;
    const unit_rate = Math.round(line_total / quantity);
    return { item, unit_rate_inr: unit_rate, quantity, line_total_inr: line_total };
  });
}

function generateProgressPDF(project, filepath) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);
  drawLetterhead(doc, "PROGRESS REPORT");

  doc.fontSize(10);
  doc.text(`Project: ${project.project_name}`);
  doc.text(`Tender ID: ${project.tender_id}`);
  doc.text(`Reporting Period: ${project.progress.report_date || "Q2 2025"}`);
  doc.moveDown();
  doc.text(`Claimed Quantity Completed: ${project.progress.claimed_km || project.progress.claimed_sqft || project.progress.claimed_m} ${project.unit}`);
  doc.text(`Percentage Complete: ${project.progress.percent}%`);
  doc.moveDown();
  doc.text(`Engineer-in-Charge: Dr. R. Mehta, Executive Engineer`);
  doc.moveDown(2);
  doc.text("Signature: ________________________");
  doc.text("Date: ________________________");
  doc.end();
}

function generateInvoicePDF(project, filepath) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);
  drawLetterhead(doc, "INVOICE / BILL");

  doc.fontSize(10);
  doc.text(`Invoice Number: INV-${project.tender_id}-001`);
  doc.text(`Project: ${project.project_name}`);
  doc.text(`Contractor: ${project.contractor_name}`);
  doc.moveDown();

  const billedQty = project.invoice.billed_km || project.invoice.billed_sqft || project.invoice.billed_m;
  doc.text(`Billed Quantity: ${billedQty} ${project.unit}`);
  doc.text(`Billed Amount: INR ${(project.invoice.billed_amount / 10000000).toFixed(2)} Cr`);
  doc.text(`Payment Date: ${project.invoice.payment_date}`);
  doc.moveDown();
  doc.text(`GSTIN: 07AAACB1234F1Z5`);
  doc.text(`Bank Release Ref: BR/2025/${Math.floor(Math.random() * 9000 + 1000)}`);
  doc.moveDown(2);
  doc.text("Authorized Signatory: ________________________");
  doc.end();
}

function generateInspectionPDF(project, filepath) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);
  drawLetterhead(doc, "INSPECTION REPORT");

  doc.fontSize(10);
  doc.text(`Project: ${project.project_name}`);
  doc.text(`Tender ID: ${project.tender_id}`);
  doc.text(`Inspection Date: 2025-07-10`);
  doc.moveDown();
  doc.text(`Inspector: Smt. K. Verma, Superintending Engineer`);
  doc.text(`Physically Verified: ${project.inspection.verified_km || project.inspection.verified_sqft || project.inspection.verified_m} ${project.unit}`);
  doc.moveDown();

  const photoRefs = project.photos.map((_, i) => `IMG_${2041 + i}.jpg`);
  doc.text(`Photo References: ${photoRefs.join(", ")}`);
  doc.moveDown();
  doc.text(`Condition Remarks: Work progress observed; see attached photos for site conditions.`);
  doc.text(`Risk Comment: ${project.inspection.gps_track_deviation > 0 ? "Route deviation observed at segment 3 — needs further investigation." : "Work appears consistent with reported progress."}`);
  doc.moveDown(2);
  doc.text("GPS Coordinates Recorded: " + project.gps_boundary.coordinates[0].join(", "));
  doc.moveDown();
  doc.text("Inspector Signature: ________________________");
  doc.end();
}

function generatePlaceholderPhoto(project, photoIndex, filepath) {
  // Generate a minimal valid JPEG (1x1 pixel, placeholder)
  // Real implementation would use canvas or sharp for actual placeholder images
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
    0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
    0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3f, 0x00, 0x7b, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xd9,
  ]);
  fs.writeFileSync(filepath, jpegHeader);
}

function generatePhotos(project) {
  const photoDir = path.join(RAW_PHOTOS, project.project_id);
  fs.mkdirSync(photoDir, { recursive: true });

  const photosMeta = [];
  const midCoord = project.gps_boundary.coordinates[Math.floor(project.gps_boundary.coordinates.length / 2)];

  project.photos.forEach((conditionTag, i) => {
    const filename = `IMG_${2041 + i}.jpg`;
    const filepath = path.join(photoDir, filename);
    generatePlaceholderPhoto(project, i, filepath);

    // Slight GPS variation per photo
    const lat = midCoord[0] + (Math.random() - 0.5) * 0.005;
    const lon = midCoord[1] + (Math.random() - 0.5) * 0.005;

    photosMeta.push({
      photo_id: `IMG_${2041 + i}`,
      gps_lat: Math.round(lat * 10000) / 10000,
      gps_lon: Math.round(lon * 10000) / 10000,
      timestamp: `2025-07-10T${9 + i}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00+05:30`,
      filepath: `raw_photos/${project.project_id}/${filename}`,
      condition_tag: conditionTag,
    });
  });

  fs.writeFileSync(path.join(photoDir, "photos_meta.json"), JSON.stringify(photosMeta, null, 2));
  return photosMeta;
}

// ─── Main Generator ───

function generate() {
  console.log("INFRA-XRAY — Synthetic Data Generator");
  console.log("=====================================\n");

  // Ensure directories
  [RAW_DOCS, RAW_PHOTOS, DATA_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));

  const projectsIndex = [];

  for (const project of PROJECTS) {
    console.log(`Generating: ${project.project_name} (${project.project_id})`);
    const projDocDir = path.join(RAW_DOCS, project.project_id);
    fs.mkdirSync(projDocDir, { recursive: true });

    // Generate 5 PDFs
    generateContractPDF(project, path.join(projDocDir, "Contract.pdf"));
    generateBOQPDF(project, path.join(projDocDir, "BOQ.pdf"));
    generateProgressPDF(project, path.join(projDocDir, "ProgressReport.pdf"));
    generateInvoicePDF(project, path.join(projDocDir, "Invoice.pdf"));
    generateInspectionPDF(project, path.join(projDocDir, "InspectionReport.pdf"));

    // Generate photos + metadata
    const photosMeta = generatePhotos(project);

    projectsIndex.push({
      project_id: project.project_id,
      project_name: project.project_name,
      state: project.state,
      category: project.category,
      sanctioned_amount_inr: project.sanctioned_amount_inr,
      sanctioned_quantity: project.sanctioned_quantity,
      unit: project.unit,
      contractor_name: project.contractor_name,
      tender_id: project.tender_id,
      gps_boundary: project.gps_boundary,
      start_date: project.start_date,
      deadline: project.deadline,
      documents: {
        contract: `raw_docs/${project.project_id}/Contract.pdf`,
        boq: `raw_docs/${project.project_id}/BOQ.pdf`,
        progress_report: `raw_docs/${project.project_id}/ProgressReport.pdf`,
        invoice: `raw_docs/${project.project_id}/Invoice.pdf`,
        inspection_report: `raw_docs/${project.project_id}/InspectionReport.pdf`,
      },
      photo_folder: `raw_photos/${project.project_id}/`,
      photo_count: photosMeta.length,
    });

    console.log(`  ✓ 5 PDFs + ${photosMeta.length} photos`);
  }

  // Write projects.json
  fs.writeFileSync(path.join(DATA_DIR, "projects.json"), JSON.stringify(projectsIndex, null, 2));
  console.log(`\n✓ projects.json (${projectsIndex.length} projects)`);

  // Write ground_truth.json
  fs.writeFileSync(path.join(DATA_DIR, "ground_truth.json"), JSON.stringify(GROUND_TRUTH, null, 2));
  console.log("✓ ground_truth.json");

  // Summary table
  console.log("\n─── Summary ───");
  console.log("Project ID  | Name                                          | State       | Category | Amount (Cr)");
  console.log("────────────┼──────────────────────────────────────────────┼─────────────┼──────────┼────────────");
  for (const p of projectsIndex) {
    const id = p.project_id.padEnd(11);
    const name = p.project_name.substring(0, 44).padEnd(44);
    const state = p.state.padEnd(11);
    const cat = p.category.padEnd(8);
    const amt = `₹${(p.sanctioned_amount_inr / 10000000).toFixed(0)}`;
    console.log(`${id} | ${name} | ${state} | ${cat} | ${amt}`);
  }
  console.log("\nDone. All synthetic data generated.");
}

generate();

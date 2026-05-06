// prisma/seed.js
// PRAGATI MIS Portal — Full Database Seed
// Bright Beginnings NGO | Rajasthan
// Run: node prisma/seed.js   OR   npm run db:seed
//
// Seeds:
//   1. Districts — Udaipur, Rajsamand, Pratapgarh
//   2. Blocks — all blocks for each district
//   3. Super Admin user
//   4. Sample staff users (District Coordinator, Block Coordinator, Field Workers)
//   5. Form fields — dynamic field config for all modules
//   6. Device catalog entries (stored as config)
// ─────────────────────────────────────────────────────────────────

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ── LOCATION DATA ─────────────────────────────────────────────────
// Source: Rajasthan government district/block official list
// All 3 districts covered under Bright Beginnings programme

const LOCATION_DATA = [
  // ── UDAIPUR ──────────────────────────────────────────────────────
  // 13 blocks | Divisional HQ: Udaipur
  {
    id: "dist-udaipur",
    name: "Udaipur",
    type: "DISTRICT",
    state: "Rajasthan",
    parentId: null,
    blocks: [
      { id: "block-udr-badgaon",     name: "Badgaon" },
      { id: "block-udr-bhinder",     name: "Bhinder" },
      { id: "block-udr-girwa",       name: "Girwa" },       // Udaipur city area
      { id: "block-udr-gogunda",     name: "Gogunda" },
      { id: "block-udr-jhadol",      name: "Jhadol" },
      { id: "block-udr-kherwara",    name: "Kherwara" },
      { id: "block-udr-kotra",       name: "Kotra" },       // Tribal / remote
      { id: "block-udr-lasadiya",    name: "Lasadiya" },
      { id: "block-udr-mavli",       name: "Mavli" },
      { id: "block-udr-salumber",    name: "Salumber" },
      { id: "block-udr-sarada",      name: "Sarada" },
      { id: "block-udr-semari",      name: "Semari" },
      { id: "block-udr-vallabhnagar",name: "Vallabhnagar" },
    ],
  },

  // ── RAJSAMAND ────────────────────────────────────────────────────
  // 9 blocks | Known for: Nathdwara, Kumbhalgarh
  {
    id: "dist-rajsamand",
    name: "Rajsamand",
    type: "DISTRICT",
    state: "Rajasthan",
    parentId: null,
    blocks: [
      { id: "block-rsm-amet",       name: "Amet" },
      { id: "block-rsm-bhim",       name: "Bhim" },
      { id: "block-rsm-deogarh",    name: "Deogarh" },
      { id: "block-rsm-kankroli",   name: "Kankroli" },     // District HQ area
      { id: "block-rsm-khamnor",    name: "Khamnor" },
      { id: "block-rsm-kumbhalgarh",name: "Kumbhalgarh" },
      { id: "block-rsm-nathdwara",  name: "Nathdwara" },
      { id: "block-rsm-railmagra",  name: "Railmagra" },
      { id: "block-rsm-rajsamand",  name: "Rajsamand" },    // City block
    ],
  },

  // ── PRATAPGARH ───────────────────────────────────────────────────
  // 7 blocks | Youngest district of Rajasthan (formed 2008)
  // High tribal population — ST concentrated
  {
    id: "dist-pratapgarh",
    name: "Pratapgarh",
    type: "DISTRICT",
    state: "Rajasthan",
    parentId: null,
    blocks: [
      { id: "block-ppg-arnod",        name: "Arnod" },
      { id: "block-ppg-chhoti-sadri", name: "Chhoti Sadri" },
      { id: "block-ppg-dhariawad",    name: "Dhariawad" },
      { id: "block-ppg-mandesar",     name: "Mandesar" },
      { id: "block-ppg-peepal-khunt", name: "Peepal Khunt" },
      { id: "block-ppg-pratapgarh",   name: "Pratapgarh" }, // HQ block
      { id: "block-ppg-sunel",        name: "Sunel" },
    ],
  },
];

// ── STAFF USERS ───────────────────────────────────────────────────
// Change ALL passwords before going live!
// Format: Name | Role | District | Block | Email | Temp Password

const STAFF_USERS = [
  // Super Admin — full access to everything
  {
    id: "user-super-admin",
    name: "Rajesh Kumar",
    email: "admin@brightbeginnings.org",
    password: "Pragati@Admin2025!",   // CHANGE IMMEDIATELY
    role: "SUPER_ADMIN",
    districtId: null,
    blockId: null,
    phone: "9800000001",
  },

  // District Coordinators — one per district
  {
    id: "user-dc-udaipur",
    name: "Priya Singh",
    email: "dc.udaipur@brightbeginnings.org",
    password: "Udaipur@DC2025!",
    role: "DISTRICT_COORDINATOR",
    districtId: "dist-udaipur",
    blockId: null,
    phone: "9800000002",
  },
  {
    id: "user-dc-rajsamand",
    name: "Suresh Patel",
    email: "dc.rajsamand@brightbeginnings.org",
    password: "Rajsamand@DC2025!",
    role: "DISTRICT_COORDINATOR",
    districtId: "dist-rajsamand",
    blockId: null,
    phone: "9800000003",
  },
  {
    id: "user-dc-pratapgarh",
    name: "Meena Sharma",
    email: "dc.pratapgarh@brightbeginnings.org",
    password: "Pratapgarh@DC2025!",
    role: "DISTRICT_COORDINATOR",
    districtId: "dist-pratapgarh",
    blockId: null,
    phone: "9800000004",
  },

  // Block Coordinators — sample (add more as needed)
  {
    id: "user-bc-girwa",
    name: "Amit Sharma",
    email: "bc.girwa@brightbeginnings.org",
    password: "Girwa@BC2025!",
    role: "BLOCK_COORDINATOR",
    districtId: "dist-udaipur",
    blockId: "block-udr-girwa",
    phone: "9800000005",
  },
  {
    id: "user-bc-nathdwara",
    name: "Rekha Verma",
    email: "bc.nathdwara@brightbeginnings.org",
    password: "Nathdwara@BC2025!",
    role: "BLOCK_COORDINATOR",
    districtId: "dist-rajsamand",
    blockId: "block-rsm-nathdwara",
    phone: "9800000006",
  },
  {
    id: "user-bc-pratapgarh",
    name: "Dinesh Meena",
    email: "bc.pratapgarh@brightbeginnings.org",
    password: "PPG@BC2025!",
    role: "BLOCK_COORDINATOR",
    districtId: "dist-pratapgarh",
    blockId: "block-ppg-pratapgarh",
    phone: "9800000007",
  },

  // Field Workers — sample (add all real FWs in Admin panel after go-live)
  {
    id: "user-fw-badgaon",
    name: "Sunita Bai",
    email: "fw.badgaon@brightbeginnings.org",
    password: "Badgaon@FW2025!",
    role: "FIELD_WORKER",
    districtId: "dist-udaipur",
    blockId: "block-udr-badgaon",
    phone: "9800000008",
  },
  {
    id: "user-fw-mavli",
    name: "Kavita Joshi",
    email: "fw.mavli@brightbeginnings.org",
    password: "Mavli@FW2025!",
    role: "FIELD_WORKER",
    districtId: "dist-udaipur",
    blockId: "block-udr-mavli",
    phone: "9800000009",
  },
  {
    id: "user-fw-kankroli",
    name: "Ramesh Gujar",
    email: "fw.kankroli@brightbeginnings.org",
    password: "Kankroli@FW2025!",
    role: "FIELD_WORKER",
    districtId: "dist-rajsamand",
    blockId: "block-rsm-kankroli",
    phone: "9800000010",
  },
  {
    id: "user-fw-chhoti-sadri",
    name: "Meera Patel",
    email: "fw.chhotisadri@brightbeginnings.org",
    password: "ChhotiSadri@FW2025!",
    role: "FIELD_WORKER",
    districtId: "dist-pratapgarh",
    blockId: "block-ppg-chhoti-sadri",
    phone: "9800000011",
  },

  // Viewer — for NGO donors / govt reporting officers
  {
    id: "user-viewer-hq",
    name: "Monitoring Officer",
    email: "monitor@brightbeginnings.org",
    password: "Monitor@View2025!",
    role: "VIEWER",
    districtId: null,
    blockId: null,
    phone: "9800000012",
  },
];

// ── DYNAMIC FORM FIELDS ───────────────────────────────────────────
// These populate the Admin → Form Builder with default fields
// Admin can add more / edit labels / reorder via the portal UI

const DEFAULT_FORM_FIELDS = [
  // Children Registry — Personal Details section
  { module: "children", section: "personal", fieldKey: "religion",      label: "Religion",              labelHindi: "धर्म",           type: "select",   options: ["Hindu","Muslim","Christian","Sikh","Buddhist","Jain","Other"], isRequired: false, displayOrder: 10 },
  { module: "children", section: "personal", fieldKey: "motherTongue",  label: "Mother Tongue",         labelHindi: "मातृभाषा",       type: "select",   options: ["Hindi","Wagdi","Mewari","Dhundhari","Haryanvi","Urdu","Other"], isRequired: false, displayOrder: 11 },
  { module: "children", section: "personal", fieldKey: "siblings",      label: "Number of Siblings",    labelHindi: "भाई-बहन",        type: "number",   isRequired: false, displayOrder: 12 },
  { module: "children", section: "personal", fieldKey: "orphan",        label: "Orphan / Single Parent",labelHindi: "अनाथ / एकल माता-पिता", type: "select", options: ["No","Yes - Orphan","Yes - Single Parent"], isRequired: false, displayOrder: 13 },

  // Children Registry — Health section (new section)
  { module: "children", section: "health",   fieldKey: "bloodGroup",    label: "Blood Group",           labelHindi: "रक्त समूह",      type: "select",   options: ["A+","A-","B+","B-","O+","O-","AB+","AB-","Unknown"], isRequired: false, displayOrder: 1 },
  { module: "children", section: "health",   fieldKey: "eyeSight",      label: "Eyesight (with glasses)",labelHindi: "दृष्टि",        type: "select",   options: ["Normal","Low Vision","Blind"], isRequired: false, displayOrder: 2 },
  { module: "children", section: "health",   fieldKey: "hearingAid",    label: "Hearing Aid Used",      labelHindi: "श्रवण यंत्र",   type: "select",   options: ["Yes","No","Needs assessment"], isRequired: false, displayOrder: 3 },
  { module: "children", section: "health",   fieldKey: "nutrition",     label: "Nutritional Status",    labelHindi: "पोषण स्थिति",   type: "select",   options: ["Normal","MAM (Moderate)","SAM (Severe)","Obesity"], isRequired: false, displayOrder: 4 },
  { module: "children", section: "health",   fieldKey: "lastMedical",   label: "Last Medical Checkup",  labelHindi: "अंतिम चिकित्सा",type: "date",     isRequired: false, displayOrder: 5 },

  // IEP — Behaviour Support section
  { module: "iep", section: "behaviour",    fieldKey: "behaviourConcern",  label: "Behaviour Concerns",     labelHindi: "व्यवहार चिंताएं",  type: "textarea", isRequired: false, displayOrder: 1, helpText: "Describe any specific behaviour challenges observed in classroom or home" },
  { module: "iep", section: "behaviour",    fieldKey: "triggers",          label: "Known Triggers",         labelHindi: "ज्ञात ट्रिगर",    type: "textarea", isRequired: false, displayOrder: 2 },
  { module: "iep", section: "behaviour",    fieldKey: "strategies",        label: "Positive Behaviour Strategies", type: "textarea",          isRequired: false, displayOrder: 3 },
  { module: "iep", section: "behaviour",    fieldKey: "pbsRequired",       label: "PBS Plan Required",      type: "select",   options: ["Yes","No","Under assessment"], isRequired: false, displayOrder: 4 },

  // Interventions — extra fields
  { module: "interventions", section: "session", fieldKey: "modeOfDelivery", label: "Mode of Delivery", type: "select", options: ["In-person","Video call","Phone call","Home visit","Hybrid"], isRequired: false, displayOrder: 10 },
  { module: "interventions", section: "session", fieldKey: "languageUsed",   label: "Language Used",    type: "select", options: ["Hindi","Wagdi","Mewari","English","Sign Language","Mixed"], isRequired: false, displayOrder: 11 },
  { module: "interventions", section: "session", fieldKey: "parentPresent",  label: "Parent Present",   type: "select", options: ["Yes","No","Partially"], isRequired: false, displayOrder: 12 },

  // Assessments — extra fields
  { module: "assessments", section: "details", fieldKey: "assessmentTool", label: "Assessment Tool Used", type: "select", options: ["VSMS","ASER","NIMH Tool","Custom BB Checklist","Teacher Observation","Vineland-3","SNAP-IV","Other"], isRequired: false, displayOrder: 5 },
  { module: "assessments", section: "details", fieldKey: "languageMedium", label: "Assessment Language", type: "select", options: ["Hindi","Wagdi","English","Non-verbal"], isRequired: false, displayOrder: 6 },
  { module: "assessments", section: "details", fieldKey: "environment",    label: "Assessment Environment", type: "select", options: ["School","Home","Resource Room","Community","AWC"], isRequired: false, displayOrder: 7 },

  // Devices — extra fields
  { module: "devices", section: "record", fieldKey: "governmentScheme",  label: "Government Scheme Name", type: "text",   isRequired: false, displayOrder: 8, helpText: "e.g. ADIP, Rajasthan BOCW, other state scheme" },
  { module: "devices", section: "record", fieldKey: "identificationCamp",label: "Identification Camp",    type: "select", options: ["Yes - BB Camp","Yes - Govt Camp","Yes - ALIMCO","No - Direct"], isRequired: false, displayOrder: 9 },
  { module: "devices", section: "record", fieldKey: "repairHistory",     label: "Repair History",         type: "textarea", isRequired: false, displayOrder: 10, helpText: "Any past repairs, replacements, modifications" },
];

// ── NOTIFICATION TEMPLATES ────────────────────────────────────────
// Stored as config — SMS templates for MSG91

const NOTIFICATION_TEMPLATES = [
  {
    key: "iep_review_due",
    titleEn: "IEP Review Due",
    titleHi: "IEP समीक्षा की तिथि",
    messageEn: "PRAGATI Alert: IEP review for {childName} ({bbId}) is due on {reviewDate}. Please complete the quarterly review. - Bright Beginnings",
    messageHi: "PRAGATI सूचना: {childName} ({bbId}) की IEP समीक्षा {reviewDate} को होनी है। कृपया तिमाही समीक्षा पूरी करें। - Bright Beginnings",
    triggerDaysBefore: 7,
    recipients: ["FIELD_WORKER", "BLOCK_COORDINATOR"],
    channel: "SMS_AND_INAPP",
    isActive: true,
  },
  {
    key: "baseline_pending",
    titleEn: "Baseline Assessment Pending",
    titleHi: "बेसलाइन मूल्यांकन लंबित",
    messageEn: "PRAGATI Reminder: Child {childName} ({bbId}) was enrolled {daysSince} days ago but baseline assessment is still pending. - Bright Beginnings",
    messageHi: "PRAGATI अनुस्मारक: {childName} ({bbId}) का नामांकन {daysSince} दिन पहले हुआ, बेसलाइन मूल्यांकन अभी तक नहीं हुआ। - Bright Beginnings",
    triggerDaysBefore: -7,
    recipients: ["FIELD_WORKER"],
    channel: "INAPP",
    isActive: true,
  },
  {
    key: "iep_not_created",
    titleEn: "IEP Not Created",
    titleHi: "IEP नहीं बनाई गई",
    messageEn: "PRAGATI Alert: {childName} ({bbId}) has baseline done 14+ days ago but no IEP created yet. Please create IEP. - Bright Beginnings",
    messageHi: "PRAGATI सूचना: {childName} का बेसलाइन 14+ दिन पहले हुआ पर IEP अभी नहीं बनी। - Bright Beginnings",
    triggerDaysBefore: -14,
    recipients: ["FIELD_WORKER", "BLOCK_COORDINATOR"],
    channel: "SMS_AND_INAPP",
    isActive: true,
  },
  {
    key: "no_intervention",
    titleEn: "No Intervention Logged",
    titleHi: "कोई हस्तक्षेप दर्ज नहीं",
    messageEn: "PRAGATI Alert: No intervention logged for {childName} ({bbId}) in the last 14 days. Please log sessions. - Bright Beginnings",
    messageHi: "PRAGATI: {childName} के लिए 14 दिनों में कोई हस्तक्षेप दर्ज नहीं। कृपया सत्र दर्ज करें। - Bright Beginnings",
    triggerDaysBefore: -14,
    recipients: ["FIELD_WORKER"],
    channel: "INAPP",
    isActive: true,
  },
  {
    key: "device_followup",
    titleEn: "Device Follow-up Due",
    titleHi: "उपकरण अनुवर्ती की तिथि",
    messageEn: "PRAGATI Reminder: Follow-up check due for device given to {childName} ({bbId}). Please verify condition. - Bright Beginnings",
    messageHi: "PRAGATI: {childName} को दिए गए उपकरण की अनुवर्ती जांच की तिथि आ गई है। - Bright Beginnings",
    triggerDaysBefore: 0,
    recipients: ["FIELD_WORKER"],
    channel: "INAPP",
    isActive: true,
  },
];

// ─────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("─".repeat(60));
  console.log("PRAGATI Database Seed — Bright Beginnings NGO");
  console.log("─".repeat(60));

  // ── 1. SEED LOCATIONS ─────────────────────────────────────────
  console.log("\n📍 Seeding Districts and Blocks...");

  for (const district of LOCATION_DATA) {
    const { blocks, ...distData } = district;

    // Upsert district
    await prisma.location.upsert({
      where: { id: distData.id },
      update: { name: distData.name, isActive: true },
      create: {
        id: distData.id,
        name: distData.name,
        type: "DISTRICT",
        state: "Rajasthan",
        parentId: null,
        isActive: true,
      },
    });
    console.log(`  ✓ District: ${distData.name}`);

    // Upsert all blocks for this district
    for (const block of blocks) {
      await prisma.location.upsert({
        where: { id: block.id },
        update: { name: block.name, isActive: true },
        create: {
          id: block.id,
          name: block.name,
          type: "BLOCK",
          state: "Rajasthan",
          parentId: distData.id,
          isActive: true,
        },
      });
      console.log(`    → Block: ${block.name}`);
    }
  }

  const totalBlocks = LOCATION_DATA.reduce((sum, d) => sum + d.blocks.length, 0);
  console.log(`\n  📊 ${LOCATION_DATA.length} Districts | ${totalBlocks} Blocks seeded`);

  // ── 2. SEED USERS ─────────────────────────────────────────────
  console.log("\n👥 Seeding Staff Users...");

  const SALT_ROUNDS = 12;

  for (const staff of STAFF_USERS) {
    const passwordHash = await bcrypt.hash(staff.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: staff.email },
      update: {
        name: staff.name,
        role: staff.role,
        districtId: staff.districtId,
        blockId: staff.blockId,
        status: "ACTIVE",
      },
      create: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        passwordHash,
        role: staff.role,
        districtId: staff.districtId,
        blockId: staff.blockId,
        status: "ACTIVE",
      },
    });

    const roleLabel = staff.role.replace(/_/g, " ");
    const scopeLabel = staff.blockId
      ? `Block: ${staff.blockId.replace("block-", "").replace(/-/g, " ").toUpperCase()}`
      : staff.districtId
      ? `District: ${staff.districtId.replace("dist-", "").toUpperCase()}`
      : "All India";
    console.log(`  ✓ ${roleLabel.padEnd(24)} ${staff.name.padEnd(20)} (${scopeLabel})`);
  }

  console.log(`\n  📊 ${STAFF_USERS.length} Users seeded`);

  // ── 3. SEED FORM FIELDS ───────────────────────────────────────
  console.log("\n🔧 Seeding Dynamic Form Fields...");

  for (const field of DEFAULT_FORM_FIELDS) {
    await prisma.formField.upsert({
      where: {
        module_section_fieldKey: {
          module: field.module,
          section: field.section,
          fieldKey: field.fieldKey,
        },
      },
      update: {
        label: field.label,
        labelHindi: field.labelHindi || null,
        options: field.options ? field.options : undefined,
        isRequired: field.isRequired,
        displayOrder: field.displayOrder,
        helpText: field.helpText || null,
        isActive: true,
      },
      create: {
        module: field.module,
        section: field.section,
        fieldKey: field.fieldKey,
        label: field.label,
        labelHindi: field.labelHindi || null,
        type: field.type,
        options: field.options || null,
        isRequired: field.isRequired,
        isActive: true,
        displayOrder: field.displayOrder,
        helpText: field.helpText || null,
      },
    });
    console.log(`  ✓ [${field.module}/${field.section}] ${field.label}`);
  }

  console.log(`\n  📊 ${DEFAULT_FORM_FIELDS.length} Form fields seeded`);

  // ── 4. SEED NOTIFICATION TEMPLATES ───────────────────────────
  // Only if NotificationTemplate model exists in your schema
  // Uncomment after adding the model to schema.prisma

  /*
  console.log("\n🔔 Seeding Notification Templates...");
  for (const tmpl of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { key: tmpl.key },
      update: { ...tmpl },
      create: { ...tmpl },
    });
    console.log(`  ✓ ${tmpl.titleEn}`);
  }
  */

  // ── 5. SUMMARY ────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("✅ Seed Complete!");
  console.log("─".repeat(60));

  console.log("\n📋 LOGIN CREDENTIALS (change all before go-live!):\n");
  console.log(
    "Role".padEnd(24) +
    "Email".padEnd(42) +
    "Temp Password"
  );
  console.log("─".repeat(80));
  for (const staff of STAFF_USERS) {
    console.log(
      staff.role.replace(/_/g, " ").padEnd(24) +
      staff.email.padEnd(42) +
      staff.password
    );
  }

  console.log("\n⚠️  IMPORTANT:");
  console.log("   1. Change ALL passwords after first login");
  console.log("   2. Super Admin: admin@brightbeginnings.org");
  console.log("   3. Add more Field Workers via Admin → User Management in the portal");
  console.log("   4. Villages are entered manually during child registration (free text)");
  console.log("\n🚀 Start the server: npm run dev");
  console.log("🔍 View database: npx prisma studio\n");
}

// ── RUN ───────────────────────────────────────────────────────────
main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

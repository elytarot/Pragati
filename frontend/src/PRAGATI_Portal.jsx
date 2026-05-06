
import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { aiAPI, assessmentsAPI, authAPI, childrenAPI, reportsAPI, locationsAPI } from "./api/index.js";
import { useChildren, useDashboard, useDevices, useIEP, useInterventions, useLocations, useUsers, useAIGoals } from "./hooks/useAPI.js";
import { useAuth } from "./context/AuthContext.jsx";

// -- TOKENS -------------------------------------------------------
const P="#CC1E53",PD="#A8163F",PL="#FCE8EF",PF="#FFF5F8";
const NAV="#1B2537",NAVL="#253049",NAVA="rgba(255,255,255,0.08)";
const BG="#F2F4F8",WH="#FFFFFF",BD="#E5E7EB";
const T1="#111827",T2="#4B5563",T3="#9CA3AF";
const GRN="#059669",GBG="#ECFDF5",GDK="#065F46";
const ORG="#D97706",OBG="#FFFBEB",ODK="#92400E";
const BLU="#1D4ED8",BBG="#EFF6FF",BDK="#1E40AF";
const PUR="#6D28D9",PUBG="#F5F3FF";
const TEL="#0891B2",TBG="#ECFEFF";
const RED="#DC2626";

// -- STATIC DATA --------------------------------------------------
const DISABILITIES=["Visually Impaired","Hearing Impaired","Autism Spectrum Disorder","Physical Disability","Intellectual Disability","Learning Disability","Speech & Language Disorder","Cerebral Palsy","Multiple Disability","Down Syndrome"];
const DEVICES={"Visually Impaired":["Smart Cane","Braille Kit","DAISY Player","Braille Display","Smart Glasses","Talking Calculator","Talking Watch","Screen Reader Software","Smartphone (Accessibility)","Laptop (with NVDA)","Braille Note Taker"],"Hearing Impaired":["Hearing Aid (Mono)","Hearing Aid (Binaural)","FM System","Cochlear Implant (Referral)","Sign Language App","Visual Alert System","Vibrating Alarm","Amplified Phone"],"Physical Disability":["Manual Wheelchair","Motorized Wheelchair","Walker/Rollator","Crutches","Adapted Tricycle","Prosthetic Limb","AFO Orthosis","Special Seating","Gait Trainer","Standing Frame"],"Autism Spectrum Disorder":["AAC Communication Board","Speech Generating Device","Sensory Tools","Social Story Apps","Visual Schedule Board","Noise-Cancelling Headphones","Fidget Tools","Weighted Blanket","Timer"],"Cerebral Palsy":["Powered Wheelchair","Gait Trainer","Standing Frame","AFO Splint","Eye Gaze Device","Adapted Computer Input","Head Pointer","Adapted Spoon/Fork"],"Intellectual Disability":["AAC Device","Picture Exchange Cards","Communication Board","Adapted Books","Simple Switch Device","Activity Schedules"],"Learning Disability":["Text-to-Speech Software","Audio Books","Reading Pen","Word Prediction Software","Colored Overlays","Digital Magnifier","Spell Checker"],"Speech & Language Disorder":["Speech Generating Device","Voice Amplifier","AAC App","PECS Cards","Communication Board","Electrolarynx"],"Multiple Disability":["Multi-Modal AAC System","Snoezelen Sensory Tools","Adapted Equipment","Eye Gaze + Switch Combo"],"Down Syndrome":["Communication Aid","Picture Cards","AAC App","Adapted Books","Simple Switch Device","Sensory Tools"]};
const PROVIDERS=["Bright Beginnings","SMSA","SJE","ALIMCO","Government Scheme","Family Purchased","Other"];
const DISTRICTS={Udaipur:["Badgaon","Bhinder","Girwa","Gogunda","Jhadol","Kherwara","Kotra","Lasadiya","Mavli","Salumber","Sarada","Semari","Vallabhnagar"],Rajsamand:["Amet","Bhim","Deogarh","Kankroli","Khamnor","Nathdwara","Railmagra","Rajsamand","Kumbhalgarh"],Pratapgarh:["Arnod","Chhoti Sadri","Dhariawad","Peepal Khunt","Pratapgarh","Sunel","Mandesar"]};
const CLASSES=["Anganwadi","Bal Vatika","Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12","Out of School"];
const SCHOOL_TYPES=["GPS (Govt Primary School)","GMS (Govt Middle School)","GSS (Govt Secondary School)","GSSS (Govt Sr. Secondary)","KGBV (Kasturba Gandhi)","AWC (Anganwadi)","NIOS (Open School)","Special School","Private School","Out of School"];
const CATEGORIES=["General","OBC","SC","ST","EWS"];
const INT_TYPES=["School Inclusion Support","Resource Room Session","Home Visit","Therapy Session","Digital Learning","Camp / Workshop"];
const INT_OUTCOMES=["Excellent","Good","Satisfactory","Needs Improvement","Absent"];
const IEP_DOMAINS=["Academic / FLN","Communication","Orientation & Mobility","Daily Living (ADL)","Social-Emotional","Motor Skills","STEM","Behaviour Support","Vocational / Pre-Vocational","Transition Planning"];
const ROLES=["Super Admin","District Coordinator","Block Coordinator","Field Worker","Viewer"];
const ROLE_COLORS={"Super Admin":P,"District Coordinator":BLU,"Block Coordinator":TEL,"Field Worker":GRN,"Viewer":T3};
const ROLE_LABELS={SUPER_ADMIN:"Super Admin",DISTRICT_COORDINATOR:"District Coordinator",BLOCK_COORDINATOR:"Block Coordinator",FIELD_WORKER:"Field Worker",VIEWER:"Viewer"};
const ROLE_ENUMS={"Super Admin":"SUPER_ADMIN","District Coordinator":"DISTRICT_COORDINATOR","Block Coordinator":"BLOCK_COORDINATOR","Field Worker":"FIELD_WORKER","Viewer":"VIEWER"};
const GENDER_ENUMS={Male:"MALE",Female:"FEMALE",Transgender:"TRANSGENDER"};
const GENDER_LABELS={MALE:"Male",FEMALE:"Female",TRANSGENDER:"Transgender"};
const ASSESSMENT_ENUMS={Baseline:"BASELINE",Endline:"ENDLINE","Mid-year Review":"MID_YEAR"};
const ASSESSMENT_LABELS={BASELINE:"Baseline",ENDLINE:"Endline",MID_YEAR:"Mid-year Review"};

const USERS=[
  {id:1,name:"Rajesh Kumar",email:"admin@brightbeginnings.org",role:"Super Admin",dist:"All",block:"All",pass:"Pragati@Admin2025!"},
  {id:2,name:"Priya Singh",email:"dc.udaipur@brightbeginnings.org",role:"District Coordinator",dist:"Udaipur",block:"All",pass:"Udaipur@DC2025!"},
  {id:3,name:"Amit Sharma",email:"bc.girwa@brightbeginnings.org",role:"Block Coordinator",dist:"Udaipur",block:"Girwa",pass:"Girwa@BC2025!"},
  {id:4,name:"Sunita Bai",email:"fw.badgaon@brightbeginnings.org",role:"Field Worker",dist:"Udaipur",block:"Badgaon",pass:"Badgaon@FW2025!"},
  {id:5,name:"Monitoring Officer",email:"monitor@brightbeginnings.org",role:"Viewer",dist:"All",block:"All",pass:"Monitor@View2025!"},
];

const EMPTY_CHILD_FORM={name:"",dob:"",gen:"",dist:"",block:"",village:"",school:"",stype:"",cls:"",dis:[],sev:"",certNo:"",certAuth:"",diag:"",comorbid:"",meds:"",dad:"",mom:"",phone:"",cat:"",bpl:"",aadhar:"",worker:"",udise:"",gp:"",hab:"",pin:"",enrDate:""};

const getAcademicYear=()=>{
  const now=new Date();
  const year=now.getMonth()>=3?now.getFullYear():now.getFullYear()-1;
  return `${year}-${String((year+1)%100).padStart(2,"0")}`;
};

const toDistrictMap=(districts)=>Object.fromEntries((districts||[]).map(d=>[d.name,(d.children||[]).map(b=>b.name)]));
const calcAge=(dob)=>dob?Math.max(0,Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000))):0;
const mapChildToLegacy=(child)=>{const custom=child.customData||{};const dis=child.disabilities||[];return {backendId:child.id,id:child.bbId,name:child.name,age:calcAge(child.dob),dob:child.dob?new Date(child.dob).toISOString().slice(0,10):"",gen:GENDER_LABELS[child.gender]||child.gender,dis:dis.map(d=>d.type),sev:dis[0]?.severity||"",cls:child.currentClass||"",school:child.schoolName||"",stype:child.schoolType||"",dist:child.district?.name||"",block:child.block?.name||"",village:child.village||"",gp:child.gramPanchayat||"",pin:child.pincode||"",hasIEP:child.status==="ACTIVE"||child.status==="COMPLETED",hasDev:false,status:child.status==="ASSESSMENT_PENDING"?"Assessment Pending":child.status==="IEP_PENDING"?"IEP Pending":child.status==="ACTIVE"?"Active":child.status,worker:child.worker?.name||custom.worker||"",dad:custom.guardianName||"",mom:custom.motherName||"",phone:custom.guardianPhone||"",cat:child.category||"",bpl:child.bplStatus||"",aadhar:child.aadharNo||"",udise:child.udiseCode||"",certNo:child.certNo||"",certAuth:child.certAuthority||"",diag:child.primaryDiagnosis||"",comorbid:child.comorbidity||"",meds:child.medications||"",enrDate:child.createdAt?new Date(child.createdAt).toISOString().slice(0,10):""};};
const buildChildPayload=(form,districts)=>{const district=(districts||[]).find(d=>d.name===form.dist);const block=(district?.children||[]).find(b=>b.name===form.block);return {name:form.name,dob:form.dob,gender:GENDER_ENUMS[form.gen]||"MALE",districtId:district?.id||"",blockId:block?.id||"",village:form.village,gramPanchayat:form.gp||"",pincode:form.pin||"",schoolName:form.school,schoolType:form.stype||"",currentClass:form.cls,category:form.cat||"",bplStatus:form.bpl||"",aadharNo:form.aadhar||"",certNo:form.certNo||"",certAuthority:form.certAuth||"",udiseCode:form.udise||"",primaryDiagnosis:form.diag||"",comorbidity:form.comorbid||"",medications:form.meds||"",customData:{guardianName:form.dad||"",motherName:form.mom||"",guardianPhone:form.phone||"",worker:form.worker||""},disabilities:(form.dis||[]).map((type,index)=>({type,severity:form.sev||null,diagnosis:form.diag||null,isPrimary:index===0}))};};
const mapGoalToLegacy=(goal,childId)=>({id:goal.id,childId,domain:goal.domain,goal:goal.goalStatement,baseline:goal.baselineDesc||"",target:goal.targetDesc||"",priority:goal.priority||"High",status:goal.status==="NOT_STARTED"?"Not Started":goal.status==="IN_PROGRESS"?"In Progress":goal.status==="ACHIEVED"?"Achieved":goal.status,pct:goal.achievementPct||0,aiGen:!!goal.aiGenerated,provider:goal.aiProvider||null});
const mapAssessmentToLegacy=(item)=>({id:item.id,childId:item.child?.bbId||item.childId,childName:item.child?.name||"",type:ASSESSMENT_LABELS[item.type]||item.type,domain:item.domain,score:item.score,level:item.level||"",date:item.date?new Date(item.date).toISOString().slice(0,10):"",assessor:item.assessor?.name||""});
const mapInterventionToLegacy=(item)=>({id:item.id,date:item.date?new Date(item.date).toISOString().slice(0,10):"",childId:item.child?.bbId||item.childId,childName:item.child?.name||"",type:item.type,duration:item.durationMin,topic:item.topic,iepGoal:item.iepGoalLinked||"",staff:item.staff?.name||"",outcome:item.outcome||"",notes:item.notes||""});
const mapDeviceToLegacy=(item)=>({id:item.id,childId:item.child?.bbId||item.childId,childName:item.child?.name||"",dis:item.disabilityType,devices:[item.deviceName],provider:item.provider,date:item.dateGiven?new Date(item.dateGiven).toISOString().slice(0,10):"",condition:item.condition||"",serial:item.serialNo||"",warranty:item.warrantyExpiry?new Date(item.warrantyExpiry).toISOString().slice(0,10):""});
const mapUserToLegacy=(item)=>({id:item.id,name:item.name,email:item.email,role:ROLE_LABELS[item.role]||item.role,dist:item.district?.name||"All",block:item.block?.name||"All",pass:""});
const mapSessionUser=(user)=>({id:user.id,name:user.name,email:user.email,role:ROLE_LABELS[user.role]||user.role,dist:user.district||"All",block:user.block||"All",districtId:user.districtId||null,blockId:user.blockId||null});

const CHILDREN_DATA=[
  {id:"BB-UDR-BDG-0001",name:"Ravi Sharma",age:10,dob:"2014-03-15",gen:"Male",dis:["Visually Impaired"],sev:"Moderate",cls:"Class 5",school:"GPS Badgaon",stype:"GPS",dist:"Udaipur",block:"Badgaon",village:"Champa Ki Dhani",hasIEP:true,hasDev:true,status:"Active",worker:"Sunita Bai",dad:"Ramesh Sharma",mom:"Geeta Devi",phone:"9876543210",cat:"OBC"},
  {id:"BB-UDR-GGD-0002",name:"Priya Kumari",age:8,dob:"2016-07-22",gen:"Female",dis:["Hearing Impaired"],sev:"Mild",cls:"Class 3",school:"GPS Gogunda",stype:"GPS",dist:"Udaipur",block:"Gogunda",village:"Keval Ki Nali",hasIEP:true,hasDev:true,status:"Active",worker:"Sunita Bai",dad:"Suresh Kumar",mom:"Radha Devi",phone:"9765432109",cat:"SC"},
  {id:"BB-RSM-NAT-0003",name:"Arjun Meena",age:12,dob:"2012-11-08",gen:"Male",dis:["Autism Spectrum Disorder"],sev:"Moderate",cls:"Class 6",school:"GMS Nathdwara",stype:"GMS",dist:"Rajsamand",block:"Nathdwara",village:"Bhopal Pura",hasIEP:false,hasDev:false,status:"IEP Pending",worker:"Amit Sharma",dad:"Mohan Meena",mom:"Savitri Devi",phone:"9654321098",cat:"ST"},
  {id:"BB-PPG-CSS-0004",name:"Sunita Bai",age:7,dob:"2017-05-12",gen:"Female",dis:["Physical Disability","Cerebral Palsy"],sev:"Severe",cls:"Class 2",school:"GPS Chhoti Sadri",stype:"GPS",dist:"Pratapgarh",block:"Chhoti Sadri",village:"Aamli Faliya",hasIEP:true,hasDev:true,status:"Active",worker:"Meera Patel",dad:"Dhanna Lal",mom:"Kamla Devi",phone:"9543210987",cat:"ST"},
  {id:"BB-RSM-AMT-0005",name:"Mohanlal Nath",age:15,dob:"2009-09-30",gen:"Male",dis:["Intellectual Disability"],sev:"Moderate",cls:"Class 8",school:"GSS Amet",stype:"GSS",dist:"Rajsamand",block:"Amet",village:"Naya Gaon",hasIEP:false,hasDev:false,status:"Assessment Pending",worker:"Amit Sharma",dad:"Bhaga Nath",mom:"Parvati Devi",phone:"9432109876",cat:"General"},
  {id:"BB-UDR-MVL-0006",name:"Kamla Devi",age:6,dob:"2018-01-18",gen:"Female",dis:["Cerebral Palsy"],sev:"Severe",cls:"Anganwadi",school:"AWC Mavli",stype:"AWC",dist:"Udaipur",block:"Mavli",village:"Bhil Ka Kheda",hasIEP:true,hasDev:true,status:"Active",worker:"Sunita Bai",dad:"Kishan Lal","mom":"Santosh Devi",phone:"9321098765",cat:"SC"},
  {id:"BB-UDR-BHN-0007",name:"Deepak Jain",age:9,dob:"2015-08-25",gen:"Male",dis:["Learning Disability"],sev:"Mild",cls:"Class 4",school:"GPS Bhinder",stype:"GPS",dist:"Udaipur",block:"Bhinder",village:"Chura Ki Basti",hasIEP:true,hasDev:false,status:"Active",worker:"Sunita Bai",dad:"Ashok Jain",mom:"Beena Jain",phone:"9210987654",cat:"General"},
  {id:"BB-RSM-KNK-0008",name:"Laxmi Patel",age:11,dob:"2013-04-03",gen:"Female",dis:["Speech & Language Disorder"],sev:"Moderate",cls:"Class 5",school:"GPS Kankroli",stype:"GPS",dist:"Rajsamand",block:"Kankroli",village:"Patel Mohalla",hasIEP:false,hasDev:true,status:"Active",worker:"Amit Sharma",dad:"Govind Patel",mom:"Savita Patel",phone:"9109876543",cat:"OBC"},
];

const TREND_DATA=[{m:"Oct",enr:45,iep:32,asmnt:28,int:142},{m:"Nov",enr:52,iep:38,asmnt:35,int:168},{m:"Dec",enr:58,iep:44,asmnt:42,int:155},{m:"Jan",enr:63,iep:50,asmnt:48,int:182},{m:"Feb",enr:71,iep:58,asmnt:55,int:201},{m:"Mar",enr:78,iep:65,asmnt:61,int:224}];
const DIS_DATA=[{name:"VI",v:58,c:P},{name:"HI",v:72,c:BLU},{name:"Autism",v:38,c:PUR},{name:"Physical",v:48,c:GRN},{name:"Intellectual",v:32,c:ORG},{name:"Learning",v:28,c:TEL},{name:"Others",v:36,c:T3}];
const INT_BAR=[{m:"Oct",school:120,resource:80,home:55,therapy:32},{m:"Nov",school:142,resource:92,home:68,therapy:38},{m:"Dec",school:135,resource:85,home:60,therapy:35},{m:"Jan",school:160,resource:105,home:78,therapy:42},{m:"Feb",school:178,resource:118,home:88,therapy:48},{m:"Mar",school:195,resource:130,home:96,therapy:52}];
const RADAR_DATA=[{skill:"Communication",baseline:45,current:72},{skill:"Mobility",baseline:52,current:78},{skill:"Daily Living",baseline:38,current:65},{skill:"Academic",baseline:42,current:70},{skill:"Social",baseline:35,current:62},{skill:"Vocational",baseline:28,current:48}];
const DIST_SUMMARY=[["Udaipur",142,118,87,42,83,GRN],["Rajsamand",98,79,62,32,80,ORG],["Pratapgarh",72,51,37,20,71,BLU]];

const INTERVENTIONS_DATA=[
  {id:1,date:"2025-04-22",childId:"BB-UDR-BDG-0001",childName:"Ravi Sharma",type:"Resource Room Session",duration:45,topic:"Braille reading — CVC words",iepGoal:"Academic / FLN",staff:"Sunita Bai",outcome:"Good",notes:"Child read 8/10 CVC words correctly."},
  {id:2,date:"2025-04-21",childId:"BB-UDR-GGD-0002",childName:"Priya Kumari",type:"School Inclusion Support",duration:60,topic:"Sign language in classroom",iepGoal:"Communication",staff:"Amit Kumar",outcome:"Satisfactory",notes:"Teacher used sign for 3 key words today."},
  {id:3,date:"2025-04-20",childId:"BB-RSM-NAT-0003",childName:"Arjun Meena",type:"Home Visit",duration:90,topic:"Sensory activities + parent training",iepGoal:"Social-Emotional",staff:"Meera Patel",outcome:"Good",notes:"Mother trained on visual schedule."},
  {id:4,date:"2025-04-19",childId:"BB-PPG-CSS-0004",childName:"Sunita Bai",type:"Therapy Session",duration:30,topic:"Physiotherapy — mobility exercises",iepGoal:"Orientation & Mobility",staff:"Dr. Rakesh V.",outcome:"Excellent",notes:"Child walked 5 steps independently."},
  {id:5,date:"2025-04-18",childId:"BB-UDR-MVL-0006",childName:"Kamla Devi",type:"Resource Room Session",duration:45,topic:"Gait trainer + fine motor tasks",iepGoal:"Motor Skills",staff:"Sunita Bai",outcome:"Good",notes:"Held pencil for 10 minutes."},
];

const DEVICES_DATA=[
  {id:1,childId:"BB-UDR-BDG-0001",childName:"Ravi Sharma",dis:"Visually Impaired",devices:["Smart Cane","DAISY Player"],provider:"Bright Beginnings",date:"2025-01-15",condition:"New",serial:"SC-2025-001",warranty:"2027-01-15"},
  {id:2,childId:"BB-UDR-GGD-0002",childName:"Priya Kumari",dis:"Hearing Impaired",devices:["Hearing Aid (Binaural)"],provider:"SMSA",date:"2025-02-20",condition:"New",serial:"HA-2025-008",warranty:"2027-02-20"},
  {id:3,childId:"BB-PPG-CSS-0004",childName:"Sunita Bai",dis:"Physical Disability",devices:["Manual Wheelchair","AFO Orthosis"],provider:"SJE",date:"2025-03-05",condition:"Good",serial:"WC-2025-012",warranty:"2028-03-05"},
  {id:4,childId:"BB-UDR-MVL-0006",childName:"Kamla Devi",dis:"Cerebral Palsy",devices:["Gait Trainer","AAC Device"],provider:"Bright Beginnings",date:"2025-03-12",condition:"New",serial:"GT-2025-004",warranty:"2027-03-12"},
  {id:5,childId:"BB-RSM-KNK-0008",childName:"Laxmi Patel",dis:"Speech & Language Disorder",devices:["Speech Generating Device"],provider:"ALIMCO",date:"2025-04-01",condition:"New",serial:"SGD-2025-002",warranty:"2027-04-01"},
];

const IEP_GOALS_DATA=[
  {id:1,childId:"BB-UDR-BDG-0001",domain:"Academic / FLN",goal:"Child will use Braille to read and write 3-letter CVC words with 80% accuracy in 4 out of 5 trials by March 2025.",baseline:"Cannot identify Braille letters",target:"Read & write 20 CVC words accurately",priority:"High",status:"In Progress",pct:65,aiGen:true,provider:"claude"},
  {id:2,childId:"BB-UDR-BDG-0001",domain:"Orientation & Mobility",goal:"Child will navigate independently from classroom to library using long cane technique with verbal cues only in 4/5 trials by March 2025.",baseline:"Requires physical guidance everywhere",target:"Independent navigation on 3 school routes",priority:"High",status:"Achieved",pct:92,aiGen:false,provider:null},
  {id:3,childId:"BB-UDR-BDG-0001",domain:"Daily Living (ADL)",goal:"Child will independently organize school bag using tactile labeling system with 90% accuracy across 5 consecutive days.",baseline:"Requires full assistance to organize bag",target:"Independent daily bag organization",priority:"Medium",status:"Achieved",pct:95,aiGen:true,provider:"claude"},
  {id:4,childId:"BB-UDR-BDG-0001",domain:"Social-Emotional",goal:"Child will initiate conversation with 2 or more peers during free time on 3 out of 5 school days for 4 consecutive weeks.",baseline:"No peer-initiated interaction observed",target:"Regular peer interaction daily",priority:"Medium",status:"In Progress",pct:55,aiGen:false,provider:null},
];

const ASSESSMENTS_DATA=[
  {id:1,childId:"BB-UDR-BDG-0001",childName:"Ravi Sharma",type:"Baseline",domain:"Academic / FLN",score:42,level:"Emerging",date:"2024-04-01",assessor:"Sunita Bai"},
  {id:2,childId:"BB-UDR-BDG-0001",childName:"Ravi Sharma",type:"Endline",domain:"Academic / FLN",score:78,level:"Developing",date:"2025-03-31",assessor:"Sunita Bai"},
  {id:3,childId:"BB-UDR-GGD-0002",childName:"Priya Kumari",type:"Baseline",domain:"Communication",score:35,level:"Pre-emergent",date:"2024-04-05",assessor:"Amit Kumar"},
  {id:4,childId:"BB-PPG-CSS-0004",childName:"Sunita Bai",type:"Baseline",domain:"Mobility & Motor",score:55,level:"Early",date:"2024-04-08",assessor:"Meera Patel"},
  {id:5,childId:"BB-UDR-MVL-0006",childName:"Kamla Devi",type:"Baseline",domain:"Motor Skills",score:30,level:"Pre-emergent",date:"2024-04-10",assessor:"Sunita Bai"},
];

const NAV_ITEMS=[
  {id:"dashboard",label:"Dashboard",icon:"📊",grp:"Core"},
  {id:"children",label:"Children Registry",icon:"👶",grp:"Core"},
  {id:"iep",label:"IEP Management",icon:"📋",grp:"Core"},
  {id:"assessments",label:"Assessments",icon:"📝",grp:"Core"},
  {id:"interventions",label:"Interventions",icon:"🤝",grp:"Core"},
  {id:"devices",label:"Assistive Devices",icon:"♿",grp:"Core"},
  {id:"reports",label:"Reports",icon:"📈",grp:"Core"},
  {id:"ai",label:"AI Assistant",icon:"✨",grp:"Tools"},
  {id:"locations",label:"Locations",icon:"🗺️",grp:"Admin"},
  {id:"users",label:"User Management",icon:"👥",grp:"Admin"},
  {id:"admin",label:"Admin Settings",icon:"⚙️",grp:"Admin"},
];

// -- SHARED COMPONENTS --------------------------------------------
const css = (base, extra = {}) => ({ ...base, ...extra });

function Btn({ children, onClick, variant = "primary", size = "md", disabled, style: sx = {} }) {
  const v = { primary:{background:P,color:"#fff",border:"none"}, secondary:{background:NAV,color:"#fff",border:"none"}, outline:{background:"transparent",color:P,border:`1.5px solid ${P}`}, ghost:{background:"transparent",color:T2,border:`1px solid ${BD}`}, success:{background:GRN,color:"#fff",border:"none"}, danger:{background:RED,color:"#fff",border:"none"}, info:{background:BLU,color:"#fff",border:"none"} };
  const s = { sm:{padding:"5px 12px",fontSize:11,borderRadius:6}, md:{padding:"8px 18px",fontSize:13,borderRadius:8}, lg:{padding:"11px 26px",fontSize:15,borderRadius:9} };
  return <button onClick={onClick} disabled={disabled} style={{fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,transition:"opacity 0.15s",opacity:disabled?0.5:1,whiteSpace:"nowrap",...v[variant],...s[size],...sx}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.8";}} onMouseLeave={e=>{e.currentTarget.style.opacity=disabled?"0.5":"1";}}>{children}</button>;
}

function Badge({ text, color = P, bg }) {
  const bgCol = bg || `${color}18`;
  return <span style={{background:bgCol,color,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:"0.2px",whiteSpace:"nowrap"}}>{text}</span>;
}

function Card({ children, style: sx = {}, title, sub, action, noPad }) {
  return <div style={{background:WH,borderRadius:12,padding:noPad?0:18,border:`1px solid ${BD}`,...sx}}>
    {(title||action)&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,padding:noPad?"16px 16px 0":"0"}}>
      <div><p style={{margin:0,fontSize:14,fontWeight:700,color:T1}}>{title}</p>{sub&&<p style={{margin:"3px 0 0",fontSize:11,color:T3}}>{sub}</p>}</div>
      {action}
    </div>}
    {children}
  </div>;
}

function StatCard({ label, value, icon, color = P, change, sub }) {
  const [hov,setHov]=useState(false);
  return <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:WH,borderRadius:12,padding:"16px 18px",border:`1px solid ${BD}`,borderLeft:`4px solid ${color}`,transform:hov?"translateY(-2px)":"translateY(0)",transition:"transform 0.2s",cursor:"default"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div><p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.7px"}}>{label}</p><p style={{margin:0,fontSize:26,fontWeight:800,color:T1,lineHeight:1}}>{value}</p></div>
      <span style={{fontSize:24,opacity:0.8}}>{icon}</span>
    </div>
    {sub&&<p style={{margin:"6px 0 0",fontSize:11,color:T3}}>{sub}</p>}
    {change!=null&&<p style={{margin:"4px 0 0",fontSize:11,fontWeight:700,color:change>=0?GRN:RED}}>{change>=0?"?":"?"} {Math.abs(change)}% vs last month</p>}
  </div>;
}

function SHead({ title, sub, action }) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
    <div><h2 style={{margin:0,fontSize:20,fontWeight:800,color:T1}}>{title}</h2>{sub&&<p style={{margin:"4px 0 0",fontSize:13,color:T2}}>{sub}</p>}</div>
    {action}
  </div>;
}

function Inp({ label, value, onChange, type = "text", placeholder, options, required, rows = 3, hint }) {
  const bs = {border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",color:T1,background:WH,transition:"border-color 0.15s"};
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<label style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.7px"}}>{label}{required&&<span style={{color:P}}> *</span>}</label>}
    {type==="select"
      ?<select value={value||""} onChange={e=>onChange(e.target.value)} style={bs} onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor=BD}><option value="">Select…</option>{options?.map(o=><option key={o?.v||o} value={o?.v||o}>{o?.l||o}</option>)}</select>
      :type==="textarea"
      ?<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...bs,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor=BD}/>
      :<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} style={bs} onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor=BD}/>}
    {hint&&<p style={{margin:0,fontSize:10,color:T3}}>{hint}</p>}
  </div>;
}

function Tabs({ tabs, active, onChange, compact }) {
  return <div style={{display:"flex",gap:2,background:"#F3F4F6",padding:3,borderRadius:10,marginBottom:16,flexWrap:"wrap"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{padding:compact?"5px 11px":"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:compact?11:12,fontWeight:700,background:active===t.id?P:"transparent",color:active===t.id?"#fff":T2,fontFamily:"inherit",transition:"all 0.2s"}}>{t.label}</button>)}
  </div>;
}

function Table({ cols, rows, onView, onEdit, compact }) {
  const p = compact ? "7px 10px" : "10px 12px";
  return <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:compact?11:13}}>
      <thead><tr style={{background:"#F9FAFB"}}>{cols.map(c=><th key={c} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:T3,fontSize:10,textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{c}</th>)}{(onView||onEdit)&&<th style={{padding:"8px 12px",color:T3,fontSize:10,textTransform:"uppercase"}}>Actions</th>}</tr></thead>
      <tbody>{rows.map((row,ri)=><tr key={ri} style={{borderTop:`1px solid ${BD}`,background:ri%2===0?WH:"#FAFAFA",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=PL} onMouseLeave={e=>e.currentTarget.style.background=ri%2===0?WH:"#FAFAFA"}>
        {row.map((cell,ci)=><td key={ci} style={{padding:p,verticalAlign:"middle"}}>{cell}</td>)}
        {(onView||onEdit)&&<td style={{padding:p}}><div style={{display:"flex",gap:4}}>
          {onView&&<Btn variant="outline" size="sm" onClick={()=>onView(ri)}>View</Btn>}
          {onEdit&&<Btn variant="ghost" size="sm" onClick={()=>onEdit(ri)}>Edit</Btn>}
        </div></td>}
      </tr>)}</tbody>
    </table>
  </div>;
}

function ProgressBar({ pct, color = P, height = 6 }) {
  return <div style={{background:BD,borderRadius:4,height,overflow:"hidden"}}><div style={{width:`${pct}%`,background:color,height,borderRadius:4,transition:"width 0.4s"}}/></div>;
}

function Modal({ open, onClose, title, children, width = 640 }) {
  if (!open) return null;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:WH,borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 22px",borderBottom:`1px solid ${BD}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <h3 style={{margin:0,fontSize:16,fontWeight:700,color:T1}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T3,lineHeight:1,padding:"0 4px"}}>×</button>
      </div>
      <div style={{padding:22,overflowY:"auto"}}>{children}</div>
    </div>
  </div>;
}

function SearchBar({ value, onChange, placeholder, extra }) {
  return <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",padding:14,background:WH,borderRadius:10,border:`1px solid ${BD}`,marginBottom:12}}>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={`🔍 ${placeholder||"Search…"}`} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",flex:1,minWidth:180}} onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor=BD}/>
    {extra}
  </div>;
}

// -- LOGIN --------------------------------------------------------
function Login({ onLogin }) {
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  const { login } = useAuth();
  const attempt = async (u) => {
    const creds = u ? { email: u.email, password: u.pass } : { email, password: pass };
    setLoading(true); setErr("");
    try {
      const user = await login(creds.email, creds.password);
      onLogin(mapSessionUser(user));
    } catch(e) {
      setErr(e.response?.data?.message || "Invalid credentials. Try a backend account.");
    } finally {
      setLoading(false);
    }
  };
  return <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${NAV} 0%,${NAVL} 50%,#0f1929 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif",padding:16}}>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <style>{`
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.8); }
    `}</style>
    <div style={{display:"flex",borderRadius:20,overflow:"hidden",boxShadow:"0 30px 70px rgba(0,0,0,0.45)",width:880,maxWidth:"100%"}}>
      <div style={{background:P,padding:"48px 40px",flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{width:54,height:54,background:"rgba(255,255,255,0.15)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,color:"#fff",marginBottom:20}}>P</div>
        <h1 style={{color:"#fff",fontSize:32,fontWeight:800,margin:"0 0 4px",letterSpacing:"-0.5px"}}>PRAGATI</h1>
        <p style={{color:"rgba(255,255,255,0.65)",fontSize:12,margin:"0 0 4px",lineHeight:1.5,maxWidth:280}}>Progress Reporting & Assessment for Growth And Tracking of Individuals</p>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,margin:"0 0 24px"}}>Bright Beginnings NGO · CWSN MIS Portal · Rajasthan</p>
        <div style={{display:"flex",gap:8,marginBottom:22}}>
          {[["312","Children"],["248","IEPs"],["94","Schools"],["32","Blocks"]].map(([v,l])=><div key={l} style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}><p style={{color:"#fff",fontSize:18,fontWeight:800,margin:0,lineHeight:1}}>{v}</p><p style={{color:"rgba(255,255,255,0.6)",fontSize:9,margin:"3px 0 0",textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</p></div>)}
        </div>
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"12px 14px"}}>
          <p style={{color:"rgba(255,255,255,0.85)",fontSize:12,margin:0,lineHeight:1.85}}>📍 Udaipur · Rajsamand · Pratapgarh<br/>📋 IEP · Assessments · Interventions<br/>♿ Assistive Devices · Device Catalog<br/>✨ AI Goal Generation · NEP 2020 Aligned</p>
        </div>
      </div>
      <div style={{background:WH,padding:"48px 38px",width:360,flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:T1}}>Welcome back</h2>
        <p style={{margin:"0 0 26px",fontSize:13,color:T3}}>Sign in to PRAGATI Portal</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Inp label="Email" value={email} onChange={setEmail} type="email" placeholder="your@email.com"/>
          <Inp label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••"/>
          {err&&<div style={{padding:"8px 12px",background:"#FEF2F2",borderRadius:7,fontSize:12,color:RED}}>{err}</div>}
          <Btn onClick={()=>attempt(null)} disabled={loading} style={{width:"100%",justifyContent:"center"}}>{loading?"Signing In...":"Sign In"}</Btn>
        </div>
        <div style={{marginTop:24,borderTop:`1px solid ${BD}`,paddingTop:20}}>
          <p style={{margin:"0 0 10px",fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.7px"}}>Demo Accounts</p>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {USERS.map(u=><button key={u.id} onClick={()=>attempt(u)} style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${BD}`,background:"#FAFAFA",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background=PL;e.currentTarget.style.borderColor=P;}} onMouseLeave={e=>{e.currentTarget.style.background="#FAFAFA";e.currentTarget.style.borderColor=BD;}}>
              <span style={{fontSize:12,fontWeight:700,color:T1}}>{u.name}</span>
              <Badge text={u.role} color={ROLE_COLORS[u.role]}/>
            </button>)}
          </div>
        </div>
      </div>
    </div>
  </div>;
}

// -- DASHBOARD ----------------------------------------------------
function Dashboard({ user }) {
  const { data } = useDashboard();
  const { districts, refresh: refreshLocations } = useLocations();
  const districtNames=useMemo(()=>Object.fromEntries((districts||[]).map(d=>[d.id,d.name])),[districts]);
  const kpis=data?.kpis||{};
  const TREND_VIEW=(data?.trend||[]).map(item=>item.m?item:{m:item.month,enr:item.enrolled,iep:item.ieps,asmnt:item.assessed,int:item.interventions});
  const DIS_VIEW=(data?.disabilityBreakdown||[]).map((d,i)=>({name:d.type,v:d.count,c:[P,BLU,PUR,GRN,ORG,TEL,T3][i%7]}));
  const DIST_VIEW=(data?.districtBreakdown||[]).map((d,i)=>[districtNames[d.districtId]||"District",d.count,Math.round((kpis.iepCoveragePct||0)*d.count/100),0,0,kpis.iepCoveragePct||0,[GRN,ORG,BLU][i%3]]);
  return <div>
    <SHead title="PRAGATI Dashboard" sub={`Bright Beginnings NGO · CWSN Progress Overview · AY 2024-25 · ${user.dist==="All"?"All Districts":user.dist}`}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
      <StatCard label="Total CWSN Children" value={kpis.totalChildren??312} icon="👶" color={P} sub="Across 3 Districts, 32 Blocks"/>
      <StatCard label="Active IEPs" value={kpis.activeIEPs??248} icon="📋" color={BLU} sub={`${kpis.iepCoveragePct??79.5}% Coverage Rate`}/>
      <StatCard label="Interventions (Mar)" value={kpis.monthlyInterventions??847} icon="🤝" color={GRN} sub="School + Resource + Home + Therapy"/>
      <StatCard label="Devices Distributed" value={kpis.devicesTotal??186} icon="♿" color={PUR} sub="14 Device Types · 4 Providers"/>
      <StatCard label="Assessments Done" value={kpis.assessmentsTotal??278} icon="📝" color={ORG} sub="Baseline + Endline Surveys"/>
      <StatCard label="Schools Covered" value={kpis.schoolsCovered??94} icon="🏫" color={TEL} sub="GPS, GMS, GSS, AWC, KGBV"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14,marginBottom:14}}>
      <Card title="Enrollment, IEP & Assessment Trend" action={<Badge text="6 months" color={BLU}/>}>
        <ResponsiveContainer width="100%" height={200}><LineChart data={TREND_VIEW}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/><XAxis dataKey="m" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/><Line dataKey="enr" stroke={P} strokeWidth={2.5} dot={{r:3}} name="Enrolled"/><Line dataKey="iep" stroke={BLU} strokeWidth={2.5} dot={{r:3}} name="IEPs Active"/><Line dataKey="asmnt" stroke={GRN} strokeWidth={2.5} dot={{r:3}} name="Assessed"/></LineChart></ResponsiveContainer>
      </Card>
      <Card title="Disability Distribution">
        <ResponsiveContainer width="100%" height={155}><PieChart><Pie data={DIS_VIEW} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="v" paddingAngle={2}>{DIS_VIEW.map((d,i)=><Cell key={i} fill={d.c}/>)}</Pie><Tooltip formatter={(v,n)=>[`${v} children`,n]}/></PieChart></ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px",marginTop:4}}>{DIS_VIEW.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:d.c}}/><span style={{fontSize:10,color:T3}}>{d.name} ({d.v})</span></div>)}</div>
      </Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 3fr",gap:14,marginBottom:14}}>
      <Card title="IEP Domain Progress (Average)">
        <ResponsiveContainer width="100%" height={190}><RadarChart data={RADAR_DATA}><PolarGrid stroke={BD}/><PolarAngleAxis dataKey="skill" tick={{fontSize:9}}/><Radar name="Current" dataKey="current" stroke={P} fill={P} fillOpacity={0.22}/><Radar name="Baseline" dataKey="baseline" stroke={BLU} fill={BLU} fillOpacity={0.15}/><Legend iconType="circle" wrapperStyle={{fontSize:10}}/></RadarChart></ResponsiveContainer>
      </Card>
      <Card title="Monthly Interventions by Type">
        <ResponsiveContainer width="100%" height={190}><BarChart data={INT_BAR}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/><XAxis dataKey="m" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="school" stackId="a" fill={P} name="School"/><Bar dataKey="resource" stackId="a" fill={BLU} name="Resource"/><Bar dataKey="home" stackId="a" fill={GRN} name="Home"/><Bar dataKey="therapy" stackId="a" fill={PUR} radius={[3,3,0,0]} name="Therapy"/></BarChart></ResponsiveContainer>
      </Card>
    </div>
    <Card title="District-wise Summary" sub="Real-time coverage and IEP achievement" action={<Badge text="Live" color={GRN}/>}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:"#F9FAFB"}}>{["District","Children","IEPs","Devices","Schools","IEP Coverage"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontWeight:700,color:T3,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>{DIST_VIEW.map(([d,c,i,dv,sc,cv,cc],ri)=><tr key={d} style={{borderTop:`1px solid ${BD}`,background:ri%2===0?WH:"#FAFAFA"}}>
          <td style={{padding:"11px 12px",fontWeight:700,color:P}}>{d}</td>
          <td style={{padding:"11px 12px"}}>{c}</td><td style={{padding:"11px 12px"}}>{i}</td><td style={{padding:"11px 12px"}}>{dv}</td><td style={{padding:"11px 12px"}}>{sc}</td>
          <td style={{padding:"11px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1}}><ProgressBar pct={cv} color={cc} height={6}/></div><span style={{fontWeight:700,fontSize:12,color:cc}}>{cv}%</span></div></td>
        </tr>)}</tbody>
      </table>
    </Card>
  </div>;
}

// -- CHILDREN REGISTRY --------------------------------------------
function ChildrenReg({ user }) {
  const [view,setView]=useState("list");const [search,setSrch]=useState("");const [selChild,setSelChild]=useState(null);
  const [fDist,setFDist]=useState("");const [fDis,setFDis]=useState("");const [fCls,setFCls]=useState("");
  const [form,setForm]=useState(EMPTY_CHILD_FORM);
  const [customData,setCustomData]=useState({});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const { children, total, create, update } = useChildren({ limit: 200 });
  const { districts } = useLocations();
  const { devices } = useDevices({ limit: 500 });
  const customFieldsConfig=useMemo(()=>{try{return JSON.parse(localStorage.getItem("pragati_custom_fields")||"[]");}catch{return [];}},[view]);
  const districtTree=useMemo(()=>toDistrictMap(districts||[]),[districts]);
  const CHILDREN_DATA=useMemo(()=>children.map(mapChildToLegacy),[children]);
  const DEVICES_DATA=useMemo(()=>devices.map(mapDeviceToLegacy),[devices]);
  const liveSelChild=useMemo(()=>selChild?CHILDREN_DATA.find(c=>c.backendId===selChild.backendId)||CHILDREN_DATA.find(c=>c.id===selChild.id)||selChild:null,[CHILDREN_DATA,selChild]);
  const { plans } = useIEP(liveSelChild?.backendId||"");
  const { interventions } = useInterventions(liveSelChild?.backendId?{ childId: liveSelChild.backendId, limit: 50 }:{ limit: 1 });
  const IEP_GOALS_DATA=useMemo(()=>((plans[0]?.goals)||[]).map(g=>mapGoalToLegacy(g,liveSelChild?.id||selChild?.id||"")),[plans,liveSelChild,selChild]);
  const INTERVENTIONS_DATA=useMemo(()=>interventions.map(mapInterventionToLegacy),[interventions]);
  const ff=(k,v)=>setForm(p=>({...p,[k]:v}));
  const toggleDis=(d)=>ff("dis",form.dis.includes(d)?form.dis.filter(x=>x!==d):[...form.dis,d]);
  const filtered=CHILDREN_DATA.filter(c=>
    (!search||c.name.toLowerCase().includes(search.toLowerCase())||c.id.includes(search)||c.village.toLowerCase().includes(search.toLowerCase()))&&
    (!fDist||c.dist===fDist)&&(!fDis||c.dis.includes(fDis))&&(!fCls||c.cls===fCls));
  const resetForm=()=>setForm(EMPTY_CHILD_FORM);
  const saveChild=async()=>{
    if(!form.name||!form.dob||!form.gen||!form.dist||!form.block||!form.village||!form.school||!form.cls||!form.dis?.length){setErr("Please fill all required child registration fields.");setMsg("");return;}
    setSaving(true);setErr("");setMsg("");
    try{
      const payload=buildChildPayload(form,districts);
      if(!payload.districtId||!payload.blockId)throw new Error("Please choose a valid district and block from the live backend list.");
      const saved=view==="edit"&&form.backendId?await update(form.backendId,payload):await create(payload);
      const mapped=mapChildToLegacy(saved);
      setSelChild(mapped);
      setForm(mapped);
      setMsg(view==="edit"?"Child profile updated successfully.":"Child registered successfully.");
      setView("view");
    }catch(e){
      setErr(e.response?.data?.message||e.message||"Unable to save child record right now.");
    }finally{setSaving(false);}
  };

  if(view==="view"&&liveSelChild){
    const ch=liveSelChild;
    const childDevices=DEVICES_DATA.filter(d=>d.childId===ch.id);
    return <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <Btn variant="ghost" size="sm" onClick={()=>setView("list")}>⬅️ Back to List</Btn>
        <Badge text={ch.status} color={ch.status==="Active"?GRN:ch.status==="IEP Pending"?P:ORG}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:P,color:"#fff",fontSize:24,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>{ch.name.charAt(0)}</div>
              <h3 style={{margin:"0 0 3px",fontSize:16,fontWeight:800,color:T1}}>{ch.name}</h3>
              <p style={{margin:"0 0 8px",fontSize:12,color:P,fontWeight:700}}>{ch.id}</p>
              <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>{ch.dis.map(d=><Badge key={d} text={d.split(" ")[0]} color={P}/>)}</div>
            </div>
            {[["Class",ch.cls],["School",ch.school],["District",ch.dist],["Block",ch.block],["Village",ch.village],["Age",`${ch.age} years`],["Gender",ch.gen],["Category",ch.cat],["Father",ch.dad],["Mother",ch.mom],["Mobile",ch.phone],["Field Worker",ch.worker]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px dashed ${BD}`,fontSize:12}}><span style={{color:T3,fontWeight:500}}>{k}</span><span style={{fontWeight:600,color:T1,textAlign:"right",maxWidth:"55%"}}>{v}</span></div>)}
          </Card>
          <div style={{display:"flex",gap:6}}>
            <Btn variant="outline" size="sm" style={{flex:1,justifyContent:"center"}} onClick={()=>{setForm({...ch});setView("edit");}}>Edit</Btn>
            <Btn size="sm" style={{flex:1,justifyContent:"center"}}>+ Intervention</Btn>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[["IEPs",plans[0]?"1 Active":"None",plans[0]?GRN:ORG],["Devices",childDevices.length?"Assigned":"None",childDevices.length?GRN:ORG],["Status",ch.status,ch.status==="Active"?GRN:P]].map(([l,v,c])=><div key={l} style={{background:WH,borderRadius:10,padding:14,border:`1px solid ${BD}`,textAlign:"center"}}><p style={{fontSize:10,color:T3,fontWeight:700,textTransform:"uppercase",margin:"0 0 4px"}}>{l}</p><p style={{fontSize:16,fontWeight:800,color:c,margin:0}}>{v}</p></div>)}
          </div>
          <Card title="IEP Goals" action={<Btn size="sm">+ New IEP</Btn>}>
            {IEP_GOALS_DATA.filter(g=>g.childId===ch.id).length>0
              ?IEP_GOALS_DATA.filter(g=>g.childId===ch.id).map(g=><div key={g.id} style={{padding:"10px 0",borderBottom:`1px dashed ${BD}`}}>
                <div style={{display:"flex",gap:6,marginBottom:5,flexWrap:"wrap"}}><Badge text={g.domain} color={P}/><Badge text={g.status} color={g.status==="Achieved"?GRN:BLU}/>{g.aiGen&&<Badge text="AI Generated" color={ORG}/>}</div>
                <p style={{fontSize:12,color:T1,margin:"0 0 7px",lineHeight:1.5}}>{g.goal}</p>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1}}><ProgressBar pct={g.pct} color={g.status==="Achieved"?GRN:P}/></div><span style={{fontSize:11,fontWeight:700,color:g.status==="Achieved"?GRN:P}}>{g.pct}%</span></div>
              </div>)
              :<p style={{color:T3,fontSize:13,padding:"10px 0"}}>No IEP goals recorded yet.</p>}
          </Card>
          <Card title="Recent Interventions">
            {INTERVENTIONS_DATA.filter(i=>i.childId===ch.id).length>0
              ?<Table compact cols={["Date","Type","Duration","Outcome"]} rows={INTERVENTIONS_DATA.filter(i=>i.childId===ch.id).map(i=>[i.date,<Badge text={i.type.split(" ")[0]} color={BLU}/>,`${i.duration} min`,<Badge text={i.outcome} color={i.outcome==="Excellent"||i.outcome==="Good"?GRN:ORG}/>])}/>
              :<p style={{color:T3,fontSize:13}}>No interventions logged.</p>}
          </Card>
        </div>
      </div>
    </div>;
  }

  if(view==="add"||view==="edit"){
    return <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <Btn variant="ghost" size="sm" onClick={()=>setView("list")}>⬅️ Back</Btn>
        <div><h2 style={{margin:0,fontSize:18,fontWeight:800,color:T1}}>{view==="add"?"Register New CWSN Child":"Edit Child Profile"}</h2><p style={{margin:"3px 0 0",fontSize:12,color:T3}}>Fields marked * are required</p></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK}}>{msg}</div>}
        {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED}}>{err}</div>}
        <Card title="Personal Details">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <Inp label="Full Name" value={form.name} onChange={v=>ff("name",v)} required placeholder="Child's full name"/>
            <Inp label="Date of Birth" value={form.dob} onChange={v=>ff("dob",v)} type="date" required/>
            <Inp label="Gender" value={form.gen} onChange={v=>ff("gen",v)} type="select" options={["Male","Female","Transgender"]} required/>
            <Inp label="Father's Name" value={form.dad} onChange={v=>ff("dad",v)} placeholder="Father's full name"/>
            <Inp label="Mother's Name" value={form.mom} onChange={v=>ff("mom",v)} placeholder="Mother's full name"/>
            <Inp label="Mobile Number" value={form.phone} onChange={v=>ff("phone",v)} type="tel" placeholder="10-digit mobile"/>
            <Inp label="Aadhar Number" value={form.aadhar} onChange={v=>ff("aadhar",v)} placeholder="12-digit (stored masked)"/>
            <Inp label="Social Category" value={form.cat} onChange={v=>ff("cat",v)} type="select" options={CATEGORIES}/>
            <Inp label="BPL Status" value={form.bpl} onChange={v=>ff("bpl",v)} type="select" options={["BPL","APL","AAY"]}/>
          </div>
        </Card>
        <Card title="Location Details">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <Inp label="District" value={form.dist} onChange={v=>{ff("dist",v);ff("block","");}} type="select" options={Object.keys(districtTree)} required/>
            <Inp label="Block" value={form.block} onChange={v=>ff("block",v)} type="select" options={form.dist?districtTree[form.dist]:[]} required/>
            <Inp label="Village / Dhani" value={form.village} onChange={v=>ff("village",v)} placeholder="Type village name" required hint="Free text — type any village name"/>
            <Inp label="Gram Panchayat" value={form.gp} onChange={v=>ff("gp",v)} placeholder="GP name"/>
            <Inp label="Habitation" value={form.hab} onChange={v=>ff("hab",v)} placeholder="Dhani / Faliya name"/>
            <Inp label="Pincode" value={form.pin} onChange={v=>ff("pin",v)} placeholder="6-digit pincode"/>
          </div>
        </Card>
        <Card title="School / Centre Details">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <Inp label="School / AWC Name" value={form.school} onChange={v=>ff("school",v)} placeholder="School name" required/>
            <Inp label="School Type" value={form.stype} onChange={v=>ff("stype",v)} type="select" options={SCHOOL_TYPES}/>
            <Inp label="Current Class" value={form.cls} onChange={v=>ff("cls",v)} type="select" options={CLASSES} required/>
            <Inp label="UDISE Code" value={form.udise} onChange={v=>ff("udise",v)} placeholder="11-digit UDISE code"/>
            <Inp label="Assigned Field Worker" value={form.worker} onChange={v=>ff("worker",v)} placeholder="Staff name"/>
            <Inp label="Enrollment Date" value={form.enrDate} onChange={v=>ff("enrDate",v)} type="date"/>
          </div>
        </Card>
        <Card title="Disability Details">
          <div style={{marginBottom:14}}>
            <label style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.7px",display:"block",marginBottom:8}}>Disability Type(s) <span style={{color:P}}>*</span> <span style={{fontSize:10,color:T3,fontWeight:400,textTransform:"none"}}>(Multiple allowed)</span></label>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{DISABILITIES.map(d=>{const sel=form.dis?.includes(d);return <label key={d} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",border:`1.5px solid ${sel?P:BD}`,borderRadius:7,cursor:"pointer",background:sel?PL:WH,fontSize:12,fontWeight:sel?700:400,transition:"all 0.15s"}}><input type="checkbox" checked={!!sel} onChange={()=>toggleDis(d)} style={{accentColor:P}}/>{d}</label>;})}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <Inp label="Severity" value={form.sev} onChange={v=>ff("sev",v)} type="select" options={["Mild (0-40%)","Moderate (40-70%)","Severe (70-80%)","Profound (80%+)"]}/>
            <Inp label="Disability Certificate No." value={form.certNo} onChange={v=>ff("certNo",v)} placeholder="Certificate number"/>
            <Inp label="Issuing Authority" value={form.certAuth} onChange={v=>ff("certAuth",v)} placeholder="CMO / District Hospital"/>
            <Inp label="Primary Diagnosis" value={form.diag} onChange={v=>ff("diag",v)} placeholder="Medical diagnosis"/>
            <Inp label="Co-morbidities" value={form.comorbid} onChange={v=>ff("comorbid",v)} placeholder="Other conditions"/>
            <Inp label="Current Medications" value={form.meds} onChange={v=>ff("meds",v)} placeholder="If any"/>
          </div>
        </Card>
        {customFieldsConfig.length>0&&<Card title="Additional Information (Custom Fields)">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {customFieldsConfig.map(f=><Inp key={f.id} label={f.label+(f.req?" *":"")} value={customData[f.id]||""} onChange={v=>setCustomData(p=>({...p,[f.id]:v}))} type={f.type==="Date"?"date":f.type==="Number"?"number":"text"} required={f.req}/>)}
          </div>
        </Card>}
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={saveChild} disabled={saving}>{saving?"Saving...":"💾 Save & Register"}</Btn>
          <Btn variant="outline" onClick={saveChild} disabled={saving}>{saving?"Saving...":"Save as Draft"}</Btn>
          <Btn variant="ghost" onClick={()=>setView("list")}>Cancel</Btn>
        </div>
      </div>
    </div>;
  }

  return <div>
    <SHead title="Children Registry" sub={`${total||CHILDREN_DATA.length} CWSN Children Enrolled · Rajasthan`} action={<Btn onClick={()=>{resetForm();setMsg("");setErr("");setView("add");}}>+ Register Child</Btn>}/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <SearchBar value={search} onChange={setSrch} placeholder="Search by name, ID, village…" extra={<>
      <select value={fDist} onChange={e=>setFDist(e.target.value)} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:12,fontFamily:"inherit",outline:"none",background:WH}}><option value="">All Districts</option>{Object.keys(districtTree).map(d=><option key={d}>{d}</option>)}</select>
      <select value={fDis} onChange={e=>setFDis(e.target.value)} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:12,fontFamily:"inherit",outline:"none",background:WH}}><option value="">All Disabilities</option>{DISABILITIES.map(d=><option key={d}>{d}</option>)}</select>
      <select value={fCls} onChange={e=>setFCls(e.target.value)} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:12,fontFamily:"inherit",outline:"none",background:WH}}><option value="">All Classes</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>
      <Badge text={`${filtered.length} shown`} color={BLU}/>
    </>}/>
    <Card noPad>
      <Table cols={["ID","Child Name","Age/Gender","Disability","Class","School","Location","IEP","Device","Status"]}
        rows={filtered.map(c=>[
          <span style={{fontWeight:700,color:P,fontSize:11}}>{c.id}</span>,
          <span style={{fontWeight:700}}>{c.name}</span>,
          `${c.age}y / ${c.gen.charAt(0)}`,
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{c.dis.map(d=><Badge key={d} text={d.split(" ")[0]}/>)}</div>,
          c.cls,
          <span style={{fontSize:11}}>{c.school}</span>,
          <span style={{fontSize:11,color:T3}}>{c.block}, {c.dist}</span>,
          <Badge text={c.hasIEP?"? Active":"? Pending"} color={c.hasIEP?GRN:ORG}/>,
          <Badge text={c.hasDev?"? Yes":"? No"} color={c.hasDev?GRN:T3}/>,
          <Badge text={c.status} color={c.status==="Active"?GRN:c.status==="IEP Pending"?P:ORG}/>
        ])} onView={ri=>{setSelChild(filtered[ri]);setMsg("");setErr("");setView("view");}} onEdit={ri=>{setForm(filtered[ri]);setMsg("");setErr("");setView("edit");}}/>
    </Card>
  </div>;
}

// -- IEP MANAGEMENT -----------------------------------------------
function IEPMgmt({ user, onAI }) {
  const [tab,setTab]=useState("overview");const [selChild,setSelChild]=useState("");
  const [plop,setPlop]=useState({academic:"",comm:"",social:"",mobility:"",adl:"",voc:""});
  const [flnLevels,setFln]=useState({oral:"",reading:"",writing:"",numeracy:""});
  const [stemLevels,setStem]=useState({science:"",tech:"",eng:"",math:""});
  const [newGoal,setNewGoal]=useState({domain:"",goal:"",baseline:"",target:"",priority:"High",method:""});
  const [addingGoal,setAddingGoal]=useState(false);const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const [aiDraft, setAiDraft] = useState(localStorage.getItem("pragati_ai_goals_draft")||"");
  const clearAiDraft = () => { localStorage.removeItem("pragati_ai_goals_draft"); setAiDraft(""); };
  useEffect(() => { const i = setInterval(()=>setAiDraft(localStorage.getItem("pragati_ai_goals_draft")||""), 1500); return ()=>clearInterval(i); }, []);
  const { children } = useChildren({ limit: 200 });
  const CHILDREN_DATA=useMemo(()=>children.map(mapChildToLegacy),[children]);
  useEffect(()=>{if(!selChild&&CHILDREN_DATA.length)setSelChild(CHILDREN_DATA[0].id);},[CHILDREN_DATA,selChild]);
  const ch=useMemo(()=>CHILDREN_DATA.find(c=>c.id===selChild)||CHILDREN_DATA[0]||null,[CHILDREN_DATA,selChild]);
  const { plans, createPlan, updatePlan, addGoal } = useIEP(ch?.backendId||"");
  const plan=plans[0]||null;
  const goals=useMemo(()=>((plan?.goals)||[]).map(g=>mapGoalToLegacy(g,ch?.id||"")),[plan,ch]);
  useEffect(()=>{
    if(plan){
      setPlop({academic:plan.plopAcademic||"",comm:plan.plopCommunication||"",social:plan.plopSocial||"",mobility:plan.plopMobility||"",adl:plan.plopAdl||"",voc:plan.plopVocational||""});
      setFln({oral:plan.flnOral||"",reading:plan.flnReading||"",writing:plan.flnWriting||"",numeracy:plan.flnNumeracy||""});
      setStem({science:plan.stemScience||"",tech:plan.stemTech||"",eng:plan.stemEngineering||"",math:plan.stemMath||""});
    }else{
      setPlop({academic:"",comm:"",social:"",mobility:"",adl:"",voc:""});
      setFln({oral:"",reading:"",writing:"",numeracy:""});
      setStem({science:"",tech:"",eng:"",math:""});
    }
  },[plan?.id]);
  const createNewIEP=async()=>{
    if(!ch){setErr("Please register a child first.");return;}
    if(plan){setMsg("This child already has an active IEP.");setErr("");return;}
    setSaving(true);setErr("");setMsg("");
    try{
      await createPlan({childId:ch.backendId,academicYear:getAcademicYear(),reviewCycle:"Quarterly",parentConsent:true,consentDate:new Date().toISOString()});
      setMsg("New IEP created successfully.");
    }catch(e){setErr(e.response?.data?.message||"Unable to create IEP.");}
    finally{setSaving(false);}
  };
  const savePlanSection=async(data,successMsg)=>{
    if(!plan){setErr("Create an IEP first for this child.");setMsg("");return;}
    setSaving(true);setErr("");setMsg("");
    try{await updatePlan(plan.id,data);setMsg(successMsg);}catch(e){setErr(e.response?.data?.message||"Unable to save IEP section.");}finally{setSaving(false);}
  };
  const saveGoal=async()=>{
    if(!plan){setErr("Create an IEP first for this child.");setMsg("");return;}
    if(!newGoal.domain||!newGoal.goal){setErr("Please fill the goal domain and statement.");setMsg("");return;}
    setSaving(true);setErr("");setMsg("");
    try{
      await addGoal(plan.id,{domain:newGoal.domain,goalStatement:newGoal.goal,baselineDesc:newGoal.baseline,targetDesc:newGoal.target,priority:newGoal.priority,measureMethod:newGoal.method});
      setAddingGoal(false);setNewGoal({domain:"",goal:"",baseline:"",target:"",priority:"High",method:""});setMsg("IEP goal saved successfully.");
    }catch(e){setErr(e.response?.data?.message||"Unable to save goal.");}
    finally{setSaving(false);}
  };
  const TABS=[{id:"overview",label:"Overview"},{id:"plop",label:"PLOP"},{id:"fln",label:"FLN / STEM"},{id:"goals",label:"Annual Goals"},{id:"services",label:"Services"},{id:"accommodation",label:"Accommodations"},{id:"transition",label:"Transition"},{id:"progress",label:"Progress"}];

  return <div>
    <SHead title="IEP Management" sub="Individualized Education Programs — Structured, NEP 2020 & RPWD Act Aligned" action={<div style={{display:"flex",gap:8}}><Btn variant="outline" size="sm" onClick={onAI}>✨ AI Goals</Btn><Btn size="sm" onClick={createNewIEP} disabled={saving}>{saving?"Saving...":"+ New IEP"}</Btn></div>}/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1,minWidth:200}}>
          <label style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:4}}>Select Child</label>
          <select value={selChild} onChange={e=>setSelChild(e.target.value)} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",background:WH}}>
            {CHILDREN_DATA.filter(c=>c.hasIEP||true).map(c=><option key={c.id} value={c.id}>{c.id} — {c.name} | {c.dis.join(", ")} | {c.cls}</option>)}
          </select>
        </div>
        {ch&&<><Badge text={`${ch.name}`} color={P}/><Badge text={`IEP: ${plan?.academicYear||getAcademicYear()}`} color={BLU}/><Badge text={`Review: ${plan?.reviewCycle||"Quarterly"}`} color={ORG}/><Badge text={plan?"IEP Active":"IEP Pending"} color={plan?GRN:RED}/></>}
      </div>
    </Card>
    <Tabs tabs={TABS} active={tab} onChange={setTab}/>

    {tab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card title={`IEP Summary — ${ch?.name||""}`}>
        {ch&&[["Child ID",ch.id],["Disability",ch.dis.join(", ")+" ("+ch.sev+")"],["Class",ch.cls+" — "+ch.school],["IEP Period",plan?.academicYear||getAcademicYear()],["Review Cycle",plan?.reviewCycle||"Quarterly"],["Total Goals",goals.length],["Goals Achieved",goals.length?goals.filter(g=>g.status==="Achieved").length+" ("+Math.round(goals.filter(g=>g.status==="Achieved").length/goals.length*100)+"%)":"0 (0%)"],["IEP Coordinator",user?.name||"Current User"],["Parent Consent",plan?.consentDate?`Received — ${new Date(plan.consentDate).toISOString().slice(0,10)}`:"Pending"],["Last Review",plan?.updatedAt?new Date(plan.updatedAt).toISOString().slice(0,10):"Not updated yet"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px dashed ${BD}`,fontSize:12}}><span style={{color:T3,fontWeight:500}}>{k}</span><span style={{fontWeight:700,color:T1,textAlign:"right",maxWidth:"58%"}}>{v}</span></div>)}
      </Card>
      <Card title="Goal Achievement by Domain">
        {[["Communication",85,GRN],["Orientation & Mobility",90,GRN],["Daily Living (ADL)",70,BLU],["Academic / FLN",72,BLU],["Social-Emotional",55,ORG],["STEM / Vocational",48,PUR]].map(([a,pct,c])=><div key={a} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:T2}}>{a}</span><span style={{fontWeight:700,color:c}}>{pct}%</span></div>
          <ProgressBar pct={pct} color={c}/>
        </div>)}
      </Card>
    </div>}

    {tab==="plop"&&<Card title="Present Level of Performance (PLOP)" action={<Badge text="2024-25" color={BLU}/>}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[{k:"academic",l:"📚 Academic Skills",ph:"Current subject performance, grade-level comparison, reading/writing/numeracy level…"},{k:"comm",l:"🗣️ Communication Skills",ph:"Verbal/non-verbal, AAC usage, language development, social communication…"},{k:"social",l:"🤝 Social-Emotional",ph:"Peer interaction, emotional regulation, behavioural observations…"},{k:"mobility",l:"🏃 Mobility & Motor Skills",ph:"Gross motor, fine motor, O&M skills, functional mobility…"},{k:"adl",l:"🍽️ Daily Living Skills (ADL)",ph:"Self-care, hygiene, dressing, functional independence…"},{k:"voc",l:"💼 Vocational / Pre-Vocational",ph:"Work readiness, vocational interests, transition skills (age 14+)…"}].map(({k,l,ph})=><div key={k}>
          <label style={{fontSize:13,fontWeight:700,color:T1,display:"block",marginBottom:6}}>{l}</label>
          <textarea value={plop[k]} onChange={e=>setPlop(p=>({...p,[k]:e.target.value}))} placeholder={ph} rows={3} style={{width:"100%",border:`1.5px solid ${BD}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.6}}/>
        </div>)}
        <Btn onClick={()=>savePlanSection({plopAcademic:plop.academic,plopCommunication:plop.comm,plopSocial:plop.social,plopMobility:plop.mobility,plopAdl:plop.adl,plopVocational:plop.voc},"PLOP saved successfully.")} disabled={saving}>{saving?"Saving...":"Save PLOP"}</Btn>
      </div>
    </Card>}

    {tab==="fln"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card title="Foundational Literacy & Numeracy (FLN)">
        {[{k:"oral",l:"Oral Language / Listening",opts:["Pre-emergent","Emergent","Early","Developing","Proficient"]},{k:"reading",l:"Reading / Decoding",opts:["No letter recognition","Letter recognition","CVC words","Simple sentences","Short paragraphs","Fluent reading"]},{k:"writing",l:"Writing Skills",opts:["Pre-writing","Letter writing","Word writing","Sentence writing","Paragraph writing","Creative writing"]},{k:"numeracy",l:"Numeracy / Mathematics",opts:["Pre-number concepts","Numbers 1–10","Numbers 1–100","Basic +/-","× ÷","Fractions","Grade-level"]}].map(({k,l,opts})=><div key={k} style={{marginBottom:14}}>
          <label style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:7}}>{l}</label>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>{opts.map((o,i)=><label key={o} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,padding:"4px 8px",borderRadius:6,background:flnLevels[k]===o?PL:"transparent",fontWeight:flnLevels[k]===o?700:400}}><input type="radio" name={`fln-${k}`} checked={flnLevels[k]===o} onChange={()=>setFln(p=>({...p,[k]:o}))} style={{accentColor:P}}/>{i+1}. {o}</label>)}</div>
        </div>)}
        <Btn onClick={()=>savePlanSection({flnOral:flnLevels.oral,flnReading:flnLevels.reading,flnWriting:flnLevels.writing,flnNumeracy:flnLevels.numeracy},"FLN levels saved successfully.")} disabled={saving}>{saving?"Saving...":"Save FLN Levels"}</Btn>
      </Card>
      <Card title="STEM Skills Assessment">
        {[{k:"science",l:"Science Concepts"},{k:"tech",l:"Technology Usage"},{k:"eng",l:"Engineering / Problem Solving"},{k:"math",l:"Applied Mathematics"}].map(({k,l})=><div key={k} style={{marginBottom:12}}>
          <label style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:6}}>{l}</label>
          <select value={stemLevels[k]} onChange={e=>setStem(p=>({...p,[k]:e.target.value}))} style={{width:"100%",border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"inherit",outline:"none",background:WH}}>
            {["Not Assessed","Below Grade Level","Near Grade Level","At Grade Level","Above Grade Level"].map(o=><option key={o}>{o}</option>)}
          </select>
        </div>)}
        <Btn onClick={()=>savePlanSection({stemScience:stemLevels.science,stemTech:stemLevels.tech,stemEngineering:stemLevels.eng,stemMath:stemLevels.math},"STEM levels saved successfully.")} disabled={saving}>{saving?"Saving...":"Save STEM Levels"}</Btn>
      </Card>
    </div>}

    {tab==="goals"&&<Card title="Annual Goals & Short-term Objectives (SMART)" action={<div style={{display:"flex",gap:8}}><Btn variant="outline" size="sm" onClick={onAI}>✨ AI Generate</Btn><Btn size="sm" onClick={()=>setAddingGoal(!addingGoal)}>+ Add Goal</Btn></div>}>
      {aiDraft && !addingGoal && <div style={{background:"#F9FAFB",borderRadius:10,padding:14,marginBottom:14,border:`1.5px solid ${P}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <h4 style={{margin:"0 0 4px",fontSize:13,fontWeight:700,color:P}}>✨ AI Generated Goals Draft</h4>
            <p style={{fontSize:11,color:T3,margin:0}}>Review the AI suggestions below and copy them into new goals.</p>
          </div>
          <Btn variant="ghost" size="sm" onClick={clearAiDraft}>Clear Draft</Btn>
        </div>
        <div style={{fontSize:12,lineHeight:1.6,color:T2,maxHeight:250,overflowY:"auto",whiteSpace:"pre-wrap",padding:10,background:WH,borderRadius:6,border:`1px solid ${BD}`}}>{aiDraft}</div>
        <Btn size="sm" style={{marginTop:10}} onClick={()=>{setAddingGoal(true);setNewGoal(p=>({...p,goal:aiDraft}));}}>+ Copy to New Goal</Btn>
      </div>}
      {addingGoal&&<div style={{background:"#F9FAFB",borderRadius:10,padding:14,marginBottom:14,border:`1.5px solid ${P}30`}}>
        <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:T1}}>New IEP Goal</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <Inp label="Domain" value={newGoal.domain} onChange={v=>setNewGoal(p=>({...p,domain:v}))} type="select" options={IEP_DOMAINS} required/>
          <Inp label="Priority" value={newGoal.priority} onChange={v=>setNewGoal(p=>({...p,priority:v}))} type="select" options={["High","Medium","Low"]}/>
        </div>
        <Inp label="SMART Goal Statement *" value={newGoal.goal} onChange={v=>setNewGoal(p=>({...p,goal:v}))} type="textarea" rows={2} placeholder="Child will [do what] + [under what conditions] + [to what criterion] + [by when]…"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
          <Inp label="Current Baseline" value={newGoal.baseline} onChange={v=>setNewGoal(p=>({...p,baseline:v}))} type="textarea" rows={2} placeholder="What can child do now?"/>
          <Inp label="End-of-Year Target" value={newGoal.target} onChange={v=>setNewGoal(p=>({...p,target:v}))} type="textarea" rows={2} placeholder="What does success look like?"/>
        </div>
        <Inp label="Measurement Method" value={newGoal.method} onChange={v=>setNewGoal(p=>({...p,method:v}))} placeholder="How will progress be tracked? (observation, data sheet, work sample…)" style={{marginTop:10}}/>
        <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveGoal} disabled={saving}>{saving?"Saving...":"Save Goal"}</Btn><Btn variant="ghost" onClick={()=>setAddingGoal(false)}>Cancel</Btn></div>
      </div>}
      {goals.map((g,i)=><div key={g.id} style={{background:"#F9FAFB",borderRadius:10,padding:14,marginBottom:10,borderLeft:`4px solid ${g.status==="Achieved"?GRN:g.status==="Not Started"?T3:P}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}><Badge text={g.domain} color={P}/><Badge text={g.priority} color={g.priority==="High"?ORG:BLU}/><Badge text={g.status} color={g.status==="Achieved"?GRN:g.status==="Not Started"?T3:BLU}/>{g.aiGen&&<Badge text={`AI: ${g.provider}`} color={ORG}/>}</div>
          <div style={{display:"flex",gap:4}}><Btn variant="ghost" size="sm">Edit</Btn><Btn variant="ghost" size="sm">Objectives</Btn></div>
        </div>
        <p style={{fontSize:13,color:T1,marginBottom:8,lineHeight:1.6}}>{g.goal}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div style={{background:WH,borderRadius:6,padding:"6px 9px",fontSize:11}}><span style={{color:T3,fontWeight:700}}>Baseline: </span><span style={{color:T2}}>{g.baseline}</span></div>
          <div style={{background:WH,borderRadius:6,padding:"6px 9px",fontSize:11}}><span style={{color:T3,fontWeight:700}}>Target: </span><span style={{color:T2}}>{g.target}</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{flex:1}}><ProgressBar pct={g.pct} color={g.status==="Achieved"?GRN:P}/></div><span style={{fontSize:12,fontWeight:700,color:g.status==="Achieved"?GRN:P}}>{g.pct}%</span></div>
      </div>)}
    </Card>}

    {tab==="services"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card title="Special Education Services" action={<Btn size="sm">+ Add</Btn>}>
        {[{s:"School Inclusion Support",f:"Daily",d:"Full day",p:"General Teacher + SE"},{s:"Resource Room Session",f:"3× / week",d:"45 min",p:"Special Educator"},{s:"Home Visit",f:"2× / month",d:"60 min",p:"Field Worker"},{s:"Peer Buddy System",f:"Daily",d:"As needed",p:"Peer Buddy"},{s:"Digital Learning",f:"1× / week",d:"30 min",p:"Resource Teacher"}].map((sv,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px dashed ${BD}`}}><div><p style={{fontWeight:700,fontSize:13,margin:0}}>{sv.s}</p><p style={{fontSize:11,color:T3,margin:"2px 0 0"}}>{sv.p} · {sv.f} · {sv.d}</p></div><Btn variant="ghost" size="sm">Edit</Btn></div>)}
      </Card>
      <Card title="Therapies & Related Services" action={<Btn size="sm">+ Add</Btn>}>
        {[{s:"Orientation & Mobility (O&M)",sp:"O&M Specialist",f:"1× / week"},{s:"Low Vision Therapy",sp:"Vision Therapist",f:"1× / month"},{s:"Child Counselling",sp:"Counsellor",f:"Fortnightly"},{s:"Parent Training",sp:"Special Educator",f:"Monthly"},{s:"Physiotherapy",sp:"Physiotherapist",f:"As needed"}].map((t,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px dashed ${BD}`}}><div><p style={{fontWeight:700,fontSize:13,margin:0}}>{t.s}</p><p style={{fontSize:11,color:T3,margin:"2px 0 0"}}>{t.sp} · {t.f}</p></div><Btn variant="ghost" size="sm">Edit</Btn></div>)}
      </Card>
    </div>}

    {tab==="accommodation"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {[{cat:"🏫 Instructional",items:["Braille textbooks provided","Audio instructions for all activities","Extended time — 1.5× standard","Preferential seating near teacher","Tactile / hands-on learning materials","Step-by-step task breakdown"]},{cat:"🌍 Environmental",items:["Tactile maps of school campus","Adequate lighting in classroom","Clear obstacle-free pathways","Buddy system assigned","Accessible washroom route","Stable furniture arrangement"]},{cat:"📝 Assessment",items:["Braille exam papers provided","Scribe / reader allowed","Oral examination option","Additional 30 min per paper","Separate quiet room available"]},{cat:"💻 Technology",items:["Screen reader on computer/tablet","DAISY player for audio books","Smart Cane for mobility","Talking calculator for math","Braille display (when available)","Laptop with NVDA"]}].map(({cat,items})=><Card key={cat} title={cat} action={<button style={{fontSize:11,color:P,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>+ Add</button>}>
        {items.map(it=><div key={it} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"4px 0",fontSize:12}}><span style={{color:GRN,flexShrink:0,marginTop:1}}>?</span><span style={{color:T2}}>{it}</span></div>)}
      </Card>)}
    </div>}

    {tab==="transition"&&<Card title="Transition Planning" sub="For children aged 14 and above — post-school goals" action={<Btn size="sm">Save Plan</Btn>}>
      <div style={{padding:20,textAlign:"center",color:T3}}><div style={{fontSize:36,marginBottom:10}}>✨</div><p style={{fontWeight:700,color:T2,fontSize:14}}>Transition Plan — Ravi Sharma (Age 10)</p><p style={{fontSize:13}}>Transition planning is activated at age 14. This child will be eligible in 4 years.</p><p style={{fontSize:12,marginTop:8}}>Transition goals cover: Vocational training, Community participation, Self-advocacy, Independent living, Government scheme linkages (DDRS, NHFDC, NIOS, ALIMCO).</p></div>
    </Card>}

    {tab==="progress"&&<Card title="Quarterly Progress Reports" action={<Btn size="sm">+ Add Progress Entry</Btn>}>
      <div style={{marginBottom:16}}>
        <ResponsiveContainer width="100%" height={200}><RadarChart data={RADAR_DATA}><PolarGrid stroke={BD}/><PolarAngleAxis dataKey="skill" tick={{fontSize:9}}/><Radar name="Current" dataKey="current" stroke={P} fill={P} fillOpacity={0.22}/><Radar name="Baseline" dataKey="baseline" stroke={BLU} fill={BLU} fillOpacity={0.15}/><Legend iconType="circle" wrapperStyle={{fontSize:10}}/></RadarChart></ResponsiveContainer>
      </div>
      {goals.map(g=><div key={g.id} style={{padding:"10px 12px",background:"#F9FAFB",borderRadius:8,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{display:"flex",gap:5}}><Badge text={g.domain} color={P}/><Badge text={g.status} color={g.status==="Achieved"?GRN:BLU}/></div><span style={{fontSize:11,color:T3}}>Last updated: Mar 2025</span></div>
        <p style={{fontSize:12,color:T2,marginBottom:6,lineHeight:1.5}}>{g.goal}</p>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1}}><ProgressBar pct={g.pct} color={g.status==="Achieved"?GRN:P}/></div><span style={{fontWeight:700,fontSize:12,color:g.status==="Achieved"?GRN:P,minWidth:32}}>{g.pct}%</span><Btn variant="ghost" size="sm">Update</Btn></div>
      </div>)}
    </Card>}
  </div>;
}

// -- ASSESSMENTS --------------------------------------------------
function Assessments() {
  const [modal,setModal]=useState(false);const [form,setForm]=useState({childId:"",type:"Baseline",domain:"",score:"",level:"",date:new Date().toISOString().slice(0,10),assessor:""});
  const [rows,setRows]=useState([]);const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");const [editId,setEditId]=useState(null);const [viewOnly,setViewOnly]=useState(false);
  const { children } = useChildren({ limit: 200 });
  const CHILDREN_DATA=useMemo(()=>children.map(mapChildToLegacy),[children]);
  const loadAssessments=async()=>{try{setRows((await assessmentsAPI.list({limit:200})).map(mapAssessmentToLegacy));}catch(e){setErr(e.response?.data?.message||"Unable to load assessment records.");}};
  useEffect(()=>{loadAssessments();},[]);
  const ff=(k,v)=>setForm(p=>({...p,[k]:v}));
  const saveAssessment=async()=>{
    const child=CHILDREN_DATA.find(c=>c.id===form.childId);
    if(!child||!form.domain||form.score===""||!form.date){setErr("Please complete all required assessment fields.");setMsg("");return;}
    setSaving(true);setErr("");setMsg("");
    try{
      if (editId) {
        await assessmentsAPI.update(editId, { score:Number(form.score),level:form.level,date:form.date,notes:form.notes });
      } else {
        await assessmentsAPI.create({childId:child.backendId,type:ASSESSMENT_ENUMS[form.type]||"BASELINE",domain:form.domain,score:Number(form.score),level:form.level,date:form.date,notes:form.notes});
      }
      await loadAssessments();
      setModal(false);
      setForm({childId:"",type:"Baseline",domain:"",score:"",level:"",date:new Date().toISOString().slice(0,10),assessor:""});
      setMsg(editId ? "Assessment updated successfully." : "Assessment saved successfully.");
    }catch(e){setErr(e.response?.data?.message||"Unable to save assessment.");}finally{setSaving(false);}
  };
  const baselineCount=rows.filter(a=>a.type==="Baseline").length;
  const endlineCount=rows.filter(a=>a.type==="Endline").length;
  const pendingEndline=Math.max(0,new Set(rows.filter(a=>a.type==="Baseline").map(a=>a.childId)).size-new Set(rows.filter(a=>a.type==="Endline").map(a=>a.childId)).size);
  const avgImprovement=(()=>{
    const grouped=rows.reduce((acc,item)=>{const key=`${item.childId}-${item.domain}`;(acc[key]||(acc[key]=[])).push(item);return acc;},{});
    const gains=Object.values(grouped).map((items)=>{const base=items.find(i=>i.type==="Baseline");const end=[...items].reverse().find(i=>i.type==="Endline");return base&&end?end.score-base.score:null;}).filter(v=>v!=null);
    return gains.length?`${Math.round(gains.reduce((a,b)=>a+b,0)/gains.length)}%`:"0%";
  })();
  return <div>
    <SHead title="Assessments" sub="Baseline & Endline surveys — measure every child's progress across all domains" action={<div style={{display:"flex",gap:8}}><Btn onClick={()=>{setEditId(null);setViewOnly(false);setForm({childId:"",type:"Baseline",domain:"",score:"",level:"",date:new Date().toISOString().slice(0,10),assessor:"",notes:""});setModal(true);}}>+ New Assessment</Btn></div>}/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      <StatCard label="Baselines Done" value={baselineCount} icon="👶" color={P}/>
      <StatCard label="Endlines Done" value={endlineCount} icon="⚙️" color={GRN}/>
      <StatCard label="Pending Endline" value={pendingEndline} icon="⚙️" color={ORG} sub="Baseline done, endline pending"/>
      <StatCard label="Avg Improvement" value={avgImprovement} icon="📋" color={BLU} sub="Across all domains"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14,marginBottom:14}}>
      <Card title="Assessment Records" noPad>
        <Table cols={["Child ID","Name","Type","Domain","Score","Level","Date","Assessor"]}
          rows={rows.map(a=>[
            <span style={{color:P,fontWeight:700,fontSize:11}}>{a.childId}</span>,
            a.childName,
            <Badge text={a.type} color={a.type==="Baseline"?BLU:GRN}/>,
            a.domain,
            <span style={{fontWeight:700}}>{a.score}/100</span>,
            <Badge text={a.level} color={a.level==="Pre-emergent"?P:a.level==="Emerging"?ORG:GRN}/>,
            a.date,a.assessor
          ])} onView={(ri)=>{
            const a = rows[ri];
            setForm({childId:a.childId,type:a.type,domain:a.domain,score:a.score,level:a.level||"",date:a.date,assessor:a.assessor,notes:a.notes||""});
            setEditId(a.id); setViewOnly(true); setModal(true);
          }} onEdit={(ri)=>{
            const a = rows[ri];
            setForm({childId:a.childId,type:a.type,domain:a.domain,score:a.score,level:a.level||"",date:a.date,assessor:a.assessor,notes:a.notes||""});
            setEditId(a.id); setViewOnly(false); setModal(true);
          }}/>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card title="FLN Levels (NEP 2020)" sub="Select level for each domain">
          {[{d:"Oral Language",opts:["Pre-emergent","Emergent","Early","Developing","Proficient"]},{d:"Reading",opts:["No letters","Letters","CVC words","Sentences","Paragraphs","Fluent"]},{d:"Writing",opts:["Pre-writing","Letters","Words","Sentences","Paragraphs"]},{d:"Numeracy",opts:["Pre-number","1–10","1–100","Basic +/-","×÷","Grade-level"]}].map(({d,opts})=><div key={d} style={{marginBottom:10}}>
            <p style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 5px"}}>{d}</p>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{opts.map((o,i)=><span key={o} style={{padding:"3px 7px",borderRadius:4,fontSize:10,background:i===2?PL:BD,color:i===2?P:T2,fontWeight:i===2?700:400,cursor:"pointer"}}>{o}</span>)}</div>
          </div>)}
        </Card>
      </div>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title="New Assessment Entry">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Inp label="Child" value={form.childId} onChange={v=>ff("childId",v)} type="select" options={CHILDREN_DATA.map(c=>({v:c.id,l:`${c.id} — ${c.name}`}))} required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Assessment Type" value={form.type} onChange={v=>ff("type",v)} type="select" options={["Baseline","Endline","Mid-year Review"]} required/>
          <Inp label="Domain" value={form.domain} onChange={v=>ff("domain",v)} type="select" options={["Academic / FLN","Communication","Mobility & Motor","Daily Living (ADL)","Social-Emotional","STEM / Vocational"]} required/>
          <Inp label="Score (0–100)" value={form.score} onChange={v=>ff("score",v)} type="number" placeholder="0–100" required/>
          <Inp label="Performance Level" value={form.level} onChange={v=>ff("level",v)} type="select" options={["Pre-emergent","Emerging","Early","Developing","Proficient"]}/>
          <Inp label="Assessment Date" value={form.date} onChange={v=>ff("date",v)} type="date" required/>
          <Inp label="Assessor Name" value={form.assessor} onChange={v=>ff("assessor",v)} placeholder="Your name" required/>
        </div>
        <Inp label="Observations / Notes" value={form.notes} onChange={v=>ff("notes",v)} type="textarea" rows={3} placeholder="Key observations, context, child's behaviour during assessment…"/>
        <div style={{display:"flex",gap:8}}><Btn onClick={saveAssessment} disabled={saving}>{saving?"Saving...":"Save Assessment"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)}>Cancel</Btn></div>
      </div>
    </Modal>
  </div>;
}

// -- INTERVENTIONS ------------------------------------------------
function Interventions() {
  const [modal,setModal]=useState(false);const [fType,setFType]=useState("");
  const [viewItem,setViewItem]=useState(null);
  const [form,setForm]=useState({childId:"",type:"",date:new Date().toISOString().slice(0,10),duration:"",topic:"",iepGoal:"",activity:"",materials:"",outcome:"Good",staff:"",notes:"",nextSteps:""});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const { children } = useChildren({ limit: 200 });
  const CHILDREN_DATA=useMemo(()=>children.map(mapChildToLegacy),[children]);
  const { interventions, create } = useInterventions({ limit: 200 });
  const INTERVENTIONS_DATA=useMemo(()=>interventions.map(mapInterventionToLegacy),[interventions]);
  const ff=(k,v)=>setForm(p=>({...p,[k]:v}));
  const filtered=INTERVENTIONS_DATA.filter(i=>!fType||i.type===fType);
  const saveIntervention=async()=>{
    const child=CHILDREN_DATA.find(c=>c.id===form.childId);
    if(!child||!form.type||!form.date||!form.duration||!form.topic){setErr("Please complete all required intervention fields.");setMsg("");return;}
    setSaving(true);setErr("");setMsg("");
    try{
      await create({childId:child.backendId,type:form.type,date:form.date,durationMin:Number(form.duration),topic:form.topic,iepGoalLinked:form.iepGoal||null,activity:form.activity||null,materialsUsed:form.materials||null,outcome:form.outcome||null,notes:form.notes||null,nextSteps:form.nextSteps||null});
      setModal(false);
      setForm({childId:"",type:"",date:new Date().toISOString().slice(0,10),duration:"",topic:"",iepGoal:"",activity:"",materials:"",outcome:"Good",staff:"",notes:"",nextSteps:""});
      setMsg("Intervention saved successfully.");
    }catch(e){setErr(e.response?.data?.message||"Unable to save intervention.");}finally{setSaving(false);}
  };
  const handleExport=()=>{
    const csv="data:text/csv;charset=utf-8,Date,Child ID,Child Name,Type,Duration,Topic,Staff,Outcome,Notes\n"+filtered.map(i=>`"${i.date}","${i.childId}","${i.childName}","${i.type}","${i.duration}","${i.topic}","${i.staff}","${i.outcome}","${i.notes}"`).join("\n");
    const link=document.createElement("a");link.href=encodeURI(csv);link.download=`Interventions_${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(link);link.click();document.body.removeChild(link);
  };
  const countsByType=INT_TYPES.reduce((acc,type)=>({...acc,[type]:INTERVENTIONS_DATA.filter(i=>i.type===type).length}),{});
  return <div>
    <SHead title="Interventions" sub="Multi-modal support sessions — School, Resource Room, Home Visit, Therapy, Digital & more" action={<Btn onClick={()=>setModal(true)}>+ Log Intervention</Btn>}/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
      {[{l:"School Inclusion",filter:"School Inclusion Support",n:countsByType["School Inclusion Support"]||0,i:"🏫",c:P,d:"In-class support"},{l:"Resource Room",filter:"Resource Room Session",n:countsByType["Resource Room Session"]||0,i:"🏫",c:BLU,d:"Remedial sessions"},{l:"Home Visit",filter:"Home Visit",n:countsByType["Home Visit"]||0,i:"🏠",c:GRN,d:"Family support"},{l:"Therapy Sessions",filter:"Therapy Session",n:countsByType["Therapy Session"]||0,i:"⚕️",c:PUR,d:"PT/OT/Speech/O&M"},{l:"Digital Learning",filter:"Digital Learning",n:countsByType["Digital Learning"]||0,i:"💻",c:TEL,d:"Tech-aided sessions"},{l:"Camp / Workshop",filter:"Camp / Workshop",n:countsByType["Camp / Workshop"]||0,i:"⛺",c:ORG,d:"Group learning"}].map(t=><div key={t.l} style={{background:WH,borderRadius:12,padding:14,border:`1px solid ${BD}`,borderTop:`3px solid ${t.c}`,cursor:"pointer",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"} onClick={()=>setFType(fType===t.filter?"":t.filter)}>
        <div style={{fontSize:20,marginBottom:5}}>{t.i}</div>
        <p style={{fontWeight:700,fontSize:13,color:T1,margin:"0 0 1px"}}>{t.l}</p>
        <p style={{fontSize:22,fontWeight:800,color:t.c,margin:"0 0 2px"}}>{t.n}</p>
        <p style={{fontSize:11,color:T3,margin:0}}>{t.d}</p>
      </div>)}
    </div>
    <Card title="Intervention Session Log" action={<div style={{display:"flex",gap:8,alignItems:"center"}}>{fType&&<><Badge text={`Filtered: ${fType}`} color={BLU}/><Btn variant="ghost" size="sm" onClick={()=>setFType("")}>Clear</Btn></>}<Btn variant="ghost" size="sm" onClick={handleExport}>Export</Btn></div>} noPad>
      <Table cols={["Date","Child","Type","Duration","Topic / Activity","Conducted By","Outcome"]}
        rows={filtered.map(i=>[i.date,<span style={{fontWeight:700}}>{i.childName.split(" ")[0]} <span style={{fontSize:10,color:T3}}>({i.childId.split("-").slice(-1)[0]})</span></span>,<Badge text={i.type.split(" ")[0]} color={BLU}/>,`${i.duration} min`,<span style={{fontSize:12}}>{i.topic}</span>,i.staff,<Badge text={i.outcome} color={i.outcome==="Excellent"||i.outcome==="Good"?GRN:ORG}/>])}
        onView={(ri)=>{setViewItem(filtered[ri]);}}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="Log Intervention Session" width={680}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Child" value={form.childId} onChange={v=>ff("childId",v)} type="select" options={CHILDREN_DATA.map(c=>({v:c.id,l:`${c.id} — ${c.name}`}))} required/>
          <Inp label="Session Type" value={form.type} onChange={v=>ff("type",v)} type="select" options={INT_TYPES} required/>
          <Inp label="Date" value={form.date} onChange={v=>ff("date",v)} type="date" required/>
          <Inp label="Duration (minutes)" value={form.duration} onChange={v=>ff("duration",v)} type="number" placeholder="e.g. 45" required/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Topic / Skill Area" value={form.topic} onChange={v=>ff("topic",v)} placeholder="What was taught / practiced?" required/>
          <Inp label="IEP Goal Linked (optional)" value={form.iepGoal} onChange={v=>ff("iepGoal",v)} type="select" options={[...IEP_DOMAINS]}/>
        </div>
        <Inp label="Activity Description" value={form.activity} onChange={v=>ff("activity",v)} type="textarea" rows={2} placeholder="What activities were done? Materials used?"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Inp label="Child Participation" value={form.outcome} onChange={v=>ff("outcome",v)} type="select" options={INT_OUTCOMES} required/>
          <Inp label="Conducted By" value={form.staff} onChange={v=>ff("staff",v)} placeholder="Your name" required/>
        </div>
        <Inp label="Key Observations" value={form.notes} onChange={v=>ff("notes",v)} type="textarea" rows={2} placeholder="What did you observe? Any progress or concerns?"/>
        <Inp label="Next Steps" value={form.nextSteps} onChange={v=>ff("nextSteps",v)} placeholder="What to focus on in next session?"/>
        <div style={{display:"flex",gap:8}}><Btn onClick={saveIntervention} disabled={saving}>{saving?"Saving...":"Save Session"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)}>Cancel</Btn></div>
      </div>
    </Modal>
    <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Intervention Session Details" width={500}>
      {viewItem && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,borderBottom:`1px dashed ${BD}`,paddingBottom:10}}>
            <div><p style={{fontSize:10,color:T3,margin:"0 0 2px"}}>Child Name</p><p style={{fontSize:13,fontWeight:700,margin:0}}>{viewItem.childName}</p></div>
            <div><p style={{fontSize:10,color:T3,margin:"0 0 2px"}}>Child ID</p><p style={{fontSize:13,fontWeight:700,color:P,margin:0}}>{viewItem.childId}</p></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,borderBottom:`1px dashed ${BD}`,paddingBottom:10}}>
            <div><p style={{fontSize:10,color:T3,margin:"0 0 2px"}}>Date</p><p style={{fontSize:13,fontWeight:700,margin:0}}>{viewItem.date}</p></div>
            <div><p style={{fontSize:10,color:T3,margin:"0 0 2px"}}>Type</p><Badge text={viewItem.type} color={BLU}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,borderBottom:`1px dashed ${BD}`,paddingBottom:10}}>
            <div><p style={{fontSize:10,color:T3,margin:"0 0 2px"}}>Duration</p><p style={{fontSize:13,fontWeight:700,margin:0}}>{viewItem.duration} min</p></div>
            <div><p style={{fontSize:10,color:T3,margin:"0 0 2px"}}>Conducted By</p><p style={{fontSize:13,fontWeight:700,margin:0}}>{viewItem.staff}</p></div>
          </div>
          <div style={{borderBottom:`1px dashed ${BD}`,paddingBottom:10}}>
            <p style={{fontSize:10,color:T3,margin:"0 0 4px"}}>Topic / Activity</p>
            <p style={{fontSize:13,margin:0}}>{viewItem.topic}</p>
          </div>
          <div style={{borderBottom:`1px dashed ${BD}`,paddingBottom:10}}>
            <p style={{fontSize:10,color:T3,margin:"0 0 4px"}}>Outcome</p>
            <Badge text={viewItem.outcome} color={viewItem.outcome==="Excellent"||viewItem.outcome==="Good"?GRN:ORG}/>
          </div>
          <div>
            <p style={{fontSize:10,color:T3,margin:"0 0 4px"}}>Notes / Observations</p>
            <p style={{fontSize:13,margin:0,color:T2,lineHeight:1.5}}>{viewItem.notes||"No additional notes."}</p>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><Btn onClick={()=>setViewItem(null)}>Close</Btn></div>
        </div>
      )}
    </Modal>
  </div>;
}

// -- ASSISTIVE DEVICES --------------------------------------------
function AssistiveDevices() {
  const [selDis,setSelDis]=useState("Visually Impaired");const [selDevs,setSelDevs]=useState([]);const [modal,setModal]=useState(false);
  const [form,setForm]=useState({childId:"",dis:"",devs:[],provider:"",date:"",condition:"New",serial:"",warranty:"",training:"No"});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const { children } = useChildren({ limit: 200 });
  const CHILDREN_DATA=useMemo(()=>children.map(mapChildToLegacy),[children]);
  const { devices, create } = useDevices({ limit: 500 });
  const DEVICES_DATA=useMemo(()=>devices.map(mapDeviceToLegacy),[devices]);
  const toggle=(d)=>setSelDevs(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);
  const saveDevices=async()=>{
    const child=CHILDREN_DATA.find(c=>c.id===form.childId);
    if(!child||!form.provider||!form.date||!selDevs.length){setErr("Please choose child, provider, date, and at least one device.");setMsg("");return;}
    setSaving(true);setErr("");setMsg("");
    try{
      await Promise.all(selDevs.map(deviceName=>create({childId:child.backendId,disabilityType:selDis,deviceName,provider:form.provider,dateGiven:form.date,condition:form.condition,serialNo:form.serial||null,warrantyExpiry:form.warranty||null,trainingGiven:form.training==="Yes"})));
      setMsg("Device record saved successfully.");
      setSelDevs([]);
      setForm({childId:"",dis:"",devs:[],provider:"",date:"",condition:"New",serial:"",warranty:"",training:"No"});
    }catch(e){setErr(e.response?.data?.message||"Unable to save device record.");}finally{setSaving(false);}
  };
  const childrenWithDevices=new Set(DEVICES_DATA.map(d=>d.childId));
  return <div>
    <SHead title="Assistive Device Management" sub="Disability-wise device catalog · Distribution tracking · Provider-wise records" action={<Btn onClick={()=>setModal(true)}>+ Log Device</Btn>}/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      <StatCard label="Devices Distributed" value={DEVICES_DATA.length} icon="⚙️" color={P}/>
      <StatCard label="Children with Devices" value={childrenWithDevices.size} icon="📋" color={BLU}/>
      <StatCard label="Pending Assessment" value={Math.max(0,CHILDREN_DATA.length-childrenWithDevices.size)} icon="⚙️" color={ORG} sub="Need device evaluation"/>
      <StatCard label="BB Provided" value={DEVICES_DATA.filter(d=>d.provider==="Bright Beginnings").length} icon="🤝" color={GRN} sub="Bright Beginnings distributed"/>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title="Log Assistive Device">

      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>
        {DISABILITIES.map(d=><button key={d} onClick={()=>{setSelDis(d);setSelDevs([]);}} style={{padding:"6px 13px",borderRadius:20,border:`1.5px solid ${selDis===d?P:BD}`,background:selDis===d?P:WH,color:selDis===d?"#fff":T2,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",transition:"all 0.2s"}}>{d}</button>)}
      </div>
      {selDis&&DEVICES[selDis]&&<>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <p style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.6px",margin:0}}>Devices for {selDis} — child can have multiple:</p>
          {selDevs.length>0&&<Badge text={`${selDevs.length} selected`} color={P}/>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:7,marginBottom:14}}>
          {DEVICES[selDis].map(dev=>{const sel=selDevs.includes(dev);return <label key={dev} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",border:`1.5px solid ${sel?P:BD}`,borderRadius:8,cursor:"pointer",background:sel?PL:"#F9FAFB",transition:"all 0.15s"}}><input type="checkbox" checked={sel} onChange={()=>toggle(dev)} style={{accentColor:P,flexShrink:0}}/><span style={{fontSize:12,fontWeight:sel?700:400,color:sel?P:T1}}>{dev}</span></label>;})}
        </div>
        {selDevs.length>0&&<div style={{background:"#F9FAFB",borderRadius:10,padding:14,border:`1.5px solid ${P}25`}}>
          <p style={{fontSize:12,fontWeight:700,color:P,marginBottom:12}}>Assign {selDevs.length} device(s): {selDevs.join(", ")}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
            <Inp label="Select Child" value={form.childId} onChange={v=>setForm(p=>({...p,childId:v}))} type="select" options={CHILDREN_DATA.map(c=>({v:c.id,l:`${c.id} — ${c.name}`}))} required/>
            <Inp label="Provided By" value={form.provider} onChange={v=>setForm(p=>({...p,provider:v}))} type="select" options={PROVIDERS} required/>
            <Inp label="Distribution Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} type="date" required/>
            <Inp label="Device Condition" value={form.condition} onChange={v=>setForm(p=>({...p,condition:v}))} type="select" options={["New","Good","Fair","Repaired/Refurbished"]}/>
            <Inp label="Serial / Ref. No." value={form.serial} onChange={v=>setForm(p=>({...p,serial:v}))} placeholder="Device serial number"/>
            <Inp label="Warranty Expiry" value={form.warranty} onChange={v=>setForm(p=>({...p,warranty:v}))} type="date"/>
          </div>
          <div style={{display:"flex",gap:8}}><Btn onClick={saveDevices} disabled={saving}>{saving?"Saving...":"💾 Save Device Record"}</Btn><Btn variant="outline" onClick={()=>setSelDevs([])}>Clear Selection</Btn></div>
        </div>}
      </>}
    
    </Modal>
    <Card title="Device Distribution History" noPad>
      <Table cols={["Child ID","Child Name","Disability","Device(s)","Provided By","Date","Condition","Status"]}
        rows={DEVICES_DATA.map(d=>[
          <span style={{color:P,fontWeight:700,fontSize:11}}>{d.childId}</span>,
          d.childName,
          <Badge text={d.dis.split(" ")[0]}/>,
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{d.devices.map(dv=><Badge key={dv} text={dv.split("(")[0].trim()} color={BLU}/>)}</div>,
          <Badge text={d.provider} color={d.provider==="Bright Beginnings"?P:d.provider==="SMSA"?BLU:GRN}/>,
          d.date,d.condition,
          <Badge text="Active" color={GRN}/>
        ])} />
    </Card>
  </div>;
}

// -- REPORTS ------------------------------------------------------
function Reports() {
  const [period,setPeriod]=useState("Monthly");const [dim,setDim]=useState("gender");const [gen,setGen]=useState(false);
  const [district,setDistrict]=useState("");const [month,setMonth]=useState("April 2025");const [loading,setLoading]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");const [lastReport,setLastReport]=useState(null);
  const { districts } = useLocations();
  const districtMap=useMemo(()=>toDistrictMap(districts||[]),[districts]);
  const generateReport=async(format="pdf")=>{
    setLoading(true);setErr("");setMsg("");
    try{
      const selectedDistrict=(districts||[]).find(d=>d.name===district);
      const result=await reportsAPI.generate({type:"overview",period:period.toLowerCase(),districtId:selectedDistrict?.id||null,dimension:dim,format});
      setLastReport(result);setGen(true);setMsg(`${format.toUpperCase()} report generated successfully.`);
      if(result.downloadUrl)window.open(result.downloadUrl,"_blank","noopener,noreferrer");
    }catch(e){setErr(e.response?.data?.message||"Unable to generate report.");}finally{setLoading(false);}
  };
  return <div>
    <SHead title="Reports & Analytics" sub="Generate Monthly / Quarterly / Annual reports — Gender, Age, Class, Disability-wise"/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.7px"}}>Report Period</label>
          <div style={{display:"flex",gap:2,background:"#F3F4F6",padding:3,borderRadius:9}}>
            {["Monthly","Quarterly","Annually"].map(p=><button key={p} onClick={()=>setPeriod(p)} style={{padding:"7px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:period===p?P:"transparent",color:period===p?"#fff":T2,fontFamily:"inherit",transition:"all 0.2s"}}>{p}</button>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",flex:1,alignItems:"flex-end"}}>
          <select value={district} onChange={e=>setDistrict(e.target.value)} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",background:WH}}><option value="">All Districts</option>{Object.keys(districtMap).map(d=><option key={d}>{d}</option>)}</select>
          <select style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",background:WH}}><option>All Blocks</option></select>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",background:WH}}><option>April 2025</option><option>March 2025</option><option>Q4 2024-25</option><option>FY 2024-25</option></select>
          <Btn onClick={()=>generateReport("pdf")} disabled={loading}>{loading?"Generating...":"📄 Generate Report"}</Btn>
          {gen&&<><Btn variant="outline" onClick={()=>generateReport("pdf")} disabled={loading}>📄 PDF</Btn><Btn variant="ghost" onClick={()=>generateReport("excel")} disabled={loading}>📊 Excel</Btn></>}
        </div>
      </div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[["👥","gender","Gender-wise"],["🏫","class","Class-wise"],["🎂","age","Age-wise"],["♿","disability","Disability-wise"],["🗺️","district","District-wise"],["👩‍🏫","staff","Staff-wise"],["🏢","provider","Provider-wise"],["🏫","school","School-wise"]].map(([ico,id,l])=><div key={id} onClick={()=>setDim(id)} style={{background:dim===id?PL:WH,borderRadius:10,padding:14,border:`1.5px solid ${dim===id?P:BD}`,textAlign:"center",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{if(dim!==id){e.currentTarget.style.borderColor=P;e.currentTarget.style.background=PL;}}} onMouseLeave={e=>{if(dim!==id){e.currentTarget.style.borderColor=BD;e.currentTarget.style.background=WH;}}}>
        <div style={{fontSize:20,marginBottom:4}}>{ico}</div>
        <p style={{fontWeight:700,fontSize:12,margin:0,color:dim===id?P:T1}}>{l}</p>
      </div>)}
    </div>
    {gen&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card title={`${period} Report — ${dim.charAt(0).toUpperCase() + dim.slice(1)}-wise`} action={<Badge text="Apr 2025" color={BLU}/>}>
        <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}><thead><tr style={{background:"#F9FAFB"}}>{["Category","Male","Female","Trans","Total"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:T3,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{[["Total Enrolled",lastReport?.rawData?.gender?.MALE||0,lastReport?.rawData?.gender?.FEMALE||0,lastReport?.rawData?.gender?.TRANSGENDER||0,lastReport?.rawData?.summary?.totalChildren||0],["Active IEPs","-","-","-",lastReport?.rawData?.summary?.iepActive||0],["With Devices","-","-","-",lastReport?.rawData?.summary?.devicesTotal||0],["Assessed","-","-","-",lastReport?.rawData?.summary?.assessedCount||0],["Interventions","-","-","-",lastReport?.rawData?.summary?.interventionsTotal||0]].map(([cat,m,f,t,tot],i)=><tr key={cat} style={{borderTop:`1px solid ${BD}`,background:i%2===0?WH:"#FAFAFA"}}><td style={{padding:"9px 12px",fontWeight:600}}>{cat}</td><td style={{padding:"9px 12px",color:BLU,fontWeight:700}}>{m}</td><td style={{padding:"9px 12px",color:P,fontWeight:700}}>{f}</td><td style={{padding:"9px 12px",color:T3}}>{t}</td><td style={{padding:"9px 12px",fontWeight:800}}>{tot}</td></tr>)}</tbody>
        </table>
      </Card>
      <Card title={`${period} Report — Age-wise`}>
        <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}><thead><tr style={{background:"#F9FAFB"}}>{["Age Group","Total","IEP%","Device%"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:T3,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{[["3–6 (Early Childhood)",lastReport?.rawData?.age?.["3-6"]||0,"-","-"],["6–11 (Primary)",lastReport?.rawData?.age?.["6-11"]||0,"-","-"],["11–15 (Upper Primary)",lastReport?.rawData?.age?.["11-15"]||0,"-","-"],["15–18 (Secondary)",lastReport?.rawData?.age?.["15-18"]||0,"-","-"],["18–21 (Transition)",lastReport?.rawData?.age?.["18-21"]||0,"-","-"]].map(([g,c,ip,dp],ri)=><tr key={g} style={{borderTop:`1px solid ${BD}`,background:ri%2===0?WH:"#FAFAFA"}}><td style={{padding:"9px 12px"}}>{g}</td><td style={{padding:"9px 12px",fontWeight:700}}>{c}</td><td style={{padding:"9px 12px"}}><Badge text={ip} color={parseInt(ip)>=80?GRN:ORG}/></td><td style={{padding:"9px 12px"}}><Badge text={dp} color={parseInt(dp)>=60?GRN:ORG}/></td></tr>)}</tbody>
        </table>
      </Card>
      <Card title="Monthly Trend" style={{gridColumn:"1/-1"}}>
        <ResponsiveContainer width="100%" height={180}><AreaChart data={TREND_DATA}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/><XAxis dataKey="m" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend wrapperStyle={{fontSize:11}}/><Area dataKey="enr" stroke={P} fill={PL} name="Enrolled" strokeWidth={2}/><Area dataKey="iep" stroke={BLU} fill={BBG} name="IEPs" strokeWidth={2}/><Area dataKey="asmnt" stroke={GRN} fill={GBG} name="Assessed" strokeWidth={2}/></AreaChart></ResponsiveContainer>
      </Card>
    </div>}
    {!gen&&<div style={{padding:60,textAlign:"center",background:WH,borderRadius:12,border:`1px solid ${BD}`}}><div style={{fontSize:48,marginBottom:14}}>✨</div><p style={{fontSize:16,fontWeight:700,color:T2,margin:"0 0 8px"}}>Configure and generate your report</p><p style={{fontSize:13,color:T3,margin:"0 0 20px"}}>Select period, district, date range, and click Generate Report</p><Btn onClick={()=>setGen(true)}>📄 Generate Report</Btn></div>}
  </div>;
}

// -- AI ASSISTANT -------------------------------------------------
function AIAssistant({ onSaveToIEP }) {
  const [prov,setProv]=useState("gemini");const [loading,setLoading]=useState(false);const [result,setResult]=useState("");const [err,setErr]=useState("");const [msg,setMsg]=useState("");
  const [prof,setProf]=useState({name:"",age:"",gen:"",cls:"",dis:"",sev:"Moderate",area:"All Areas",lang:"English",context:""});
  const pp=(k,v)=>setProf(p=>({...p,[k]:v}));
  const generate=async()=>{
    if(!prof.dis||!prof.cls){setErr("Please select Disability Type and Class first.");return;}
    try{
      const apiKey = localStorage.getItem(`pragati_${prov}_key`) || undefined;
      const data=await aiAPI.generateGoals({provider:prov, apiKey, name:prof.name,age:prof.age,gender:prof.gen,cls:prof.cls,disability:prof.dis,severity:prof.sev,goalArea:prof.area,language:prof.lang,context:prof.context});
      if(data.text)setResult(data.text);else setErr("No AI response received.");
    }catch(e){setErr(e.response?.data?.message||"AI generation failed. Please check backend AI settings.");}
    setLoading(false);
  };
  const saveDraft=()=>{if(!result)return;localStorage.setItem("pragati_ai_goals_draft",result);setMsg("AI goals saved! Redirecting to IEP module...");setTimeout(()=>{if(onSaveToIEP)onSaveToIEP();},1000);};
  return <div>
    <SHead title="AI Assistant" sub="Generate IEP goals, intervention plans & summaries — Claude · GPT-4 · Gemini · NEP 2020 Aligned"/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <Card title="AI Provider" style={{marginBottom:14}}>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{id:"claude",name:"Claude (Anthropic)",icon:"🤖",desc:"Best for SMART goals. Pre-integrated — ready to use.",avail:!!localStorage.getItem("pragati_claude_key")},{id:"openai",name:"GPT-4 (OpenAI)",icon:"⚙️",desc:"General purpose. Admin must enter API key.",avail:!!localStorage.getItem("pragati_openai_key")},{id:"gemini",name:"Gemini (Google)",icon:"✨",desc:"Hindi/English bilingual support.",avail:true}].map(pv=><div key={pv.id} onClick={()=>{if(pv.avail)setProv(pv.id);}} style={{padding:14,borderRadius:10,border:`2px solid ${prov===pv.id&&pv.avail?P:BD}`,background:prov===pv.id&&pv.avail?PL:WH,cursor:pv.avail?"pointer":"default",opacity:pv.avail?1:0.6,minWidth:190}}>
          <div style={{fontSize:20,marginBottom:4}}>{pv.icon}</div>
          <p style={{fontWeight:700,fontSize:13,margin:"0 0 3px",color:T1}}>{pv.name}</p>
          <p style={{fontSize:11,color:T3,margin:"0 0 7px"}}>{pv.desc}</p>
          <Badge text={pv.avail?(prov===pv.id?"Active ✅":"Available"):"Coming Soon"} color={pv.avail?(prov===pv.id?GRN:BLU):ORG}/>
        </div>)}
      </div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.7fr",gap:14}}>
      <Card title="Child Profile Input">
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <Inp label="Child Name (optional)" value={prof.name} onChange={v=>pp("name",v)} placeholder="Personalises the output"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Inp label="Age (years)" value={prof.age} onChange={v=>pp("age",v)} type="number" placeholder="e.g. 10"/>
            <Inp label="Gender" value={prof.gen} onChange={v=>pp("gen",v)} type="select" options={["Male","Female","Transgender"]}/>
          </div>
          <Inp label="Current Class *" value={prof.cls} onChange={v=>pp("cls",v)} type="select" options={CLASSES} required/>
          <Inp label="Disability Type *" value={prof.dis} onChange={v=>pp("dis",v)} type="select" options={DISABILITIES} required/>
          <Inp label="Severity Level" value={prof.sev} onChange={v=>pp("sev",v)} type="select" options={["Mild (0-40%)","Moderate (40-70%)","Severe (70-80%)","Profound (80%+)"]}/>
          <Inp label="Goal Area Focus" value={prof.area} onChange={v=>pp("area",v)} type="select" options={["All Areas","Academic/FLN","Communication","Mobility & Motor","Daily Living Skills","Social-Emotional","STEM/Vocational","Transition Planning"]}/>
          <Inp label="Output Language" value={prof.lang} onChange={v=>pp("lang",v)} type="select" options={["English","Hindi (Bilingual)"]}/>
          <Inp label="Additional Context" value={prof.context} onChange={v=>pp("context",v)} type="textarea" rows={2} placeholder="Specific needs, available resources, school type…"/>
          <Btn onClick={generate} disabled={loading} style={{justifyContent:"center"}}>{loading?"⏳ Generating…":"📄 Generate IEP Goals"}</Btn>
          <div style={{padding:10,background:"#F9FAFB",borderRadius:8,fontSize:11,color:T3,lineHeight:1.6,border:`1px solid ${BD}`}}>
            🤖 Gemini AI is pre-integrated<br/>📜 NEP 2020 + RPWD Act 2016 aligned<br/>🌵 Rural Rajasthan context-aware<br/>✏️ All goals editable before saving to IEP
          </div>
        </div>
      </Card>
      <Card title="AI Generated IEP Goals" action={result?<div style={{display:"flex",gap:6}}><Btn variant="outline" size="sm" onClick={()=>navigator.clipboard?.writeText(result)}>📋 Copy</Btn><Btn size="sm" onClick={saveDraft}>Save to IEP</Btn></div>:null}>
        {loading?<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:60,gap:14}}>
          <div style={{width:44,height:44,border:`3px solid ${PL}`,borderTop:`3px solid ${P}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
          <p style={{color:T2,fontSize:14,margin:0,fontWeight:700}}>Generating SMART goals…</p>
          <p style={{color:T3,fontSize:12,margin:0,textAlign:"center"}}>Aligned to NEP 2020 · RPWD Act 2016 · Samagra Shiksha<br/>Rural Rajasthan context injected</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        </div>:result?<div style={{fontSize:13,lineHeight:1.8,color:T1,maxHeight:560,overflowY:"auto",whiteSpace:"pre-wrap",fontFamily:"inherit",padding:"0 4px"}}>{result}</div>
        :<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:60,textAlign:"center",color:T3}}>
          <div style={{fontSize:52,marginBottom:14}}>✨</div>
          <p style={{fontSize:15,fontWeight:700,color:T2,margin:"0 0 8px"}}>AI Goals will appear here</p>
          <p style={{fontSize:12,margin:"0 0 16px"}}>Fill the child profile form and click Generate IEP Goals</p>
          <div style={{background:"#F9FAFB",borderRadius:10,padding:14,fontSize:12,color:T2,textAlign:"left",maxWidth:380,border:`1px solid ${BD}`}}>
            <p style={{fontWeight:700,margin:"0 0 8px",color:T1}}>What Gemini generates:</p>
            {["5 SMART goals across key domains","Baseline description per goal","End-of-year target benchmark","2–3 practical activity suggestions","Progress measurement method","NEP 2020 + RPWD Act alignment"].map(i=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}><span style={{color:GRN}}>✓</span><span>{i}</span></div>)}
          </div>
        </div>}
      </Card>
    </div>
  </div>;
}

// -- LOCATIONS ----------------------------------------------------
function Locations() {
  const [activeD,setActiveD]=useState("Udaipur");const [newBlock,setNewBlock]=useState("");const [newVillage,setNewVillage]=useState("");const [selBlock,setSelBlock]=useState("");const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const { districts } = useLocations();
  const { children } = useChildren({ limit: 200 });
  const { users } = useUsers();
  const districtTree=useMemo(()=>toDistrictMap(districts||[]),[districts]);
  const CHILDREN_DATA=useMemo(()=>children.map(mapChildToLegacy),[children]);
  useEffect(()=>{if(!districtTree[activeD]){const first=Object.keys(districtTree)[0];if(first)setActiveD(first);}},[districtTree,activeD]);
  const addBlock=async()=>{
    const district=(districts||[]).find(d=>d.name===activeD);
    if(!district||!newBlock.trim()){setErr("Please select a district and enter a block name.");setMsg("");return;}
    try{await locationsAPI.create({name:newBlock.trim(),type:"BLOCK",parentId:district.id});await refreshLocations();setMsg("Block added successfully.");setErr("");setNewBlock("");}catch(e){setErr(e.response?.data?.message||"Unable to add block.");setMsg("");}
  };
  return <div>
    <SHead title="Location Management" sub="Districts → Blocks → Villages (manual entry) — Rajasthan"/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <div style={{display:"flex",gap:14}}>
      <div style={{width:170,flexShrink:0}}>
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${BD}`,fontSize:10,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:"0.7px"}}>Districts</div>
          {Object.keys(districtTree).map(d=><button key={d} onClick={()=>setActiveD(d)} style={{width:"100%",padding:"11px 14px",border:"none",textAlign:"left",cursor:"pointer",background:activeD===d?`${P}10`:"transparent",color:activeD===d?P:T2,borderLeft:activeD===d?`3px solid ${P}`:"3px solid transparent",fontSize:13,fontWeight:700,fontFamily:"inherit",transition:"all 0.2s",display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14}}>✨</span>{d}</button>)}
        </Card>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
        <Card title={`${activeD} — ${(districtTree[activeD]||[]).length} Blocks`} action={<Badge text={`${CHILDREN_DATA.filter(c=>c.dist===activeD).length} children`} color={P}/>}>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {(districtTree[activeD]||[]).map(block=><div key={block} style={{padding:"6px 13px",background:"#F9FAFB",border:`1px solid ${BD}`,borderRadius:8,fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:6,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=P;e.currentTarget.style.background=PL;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.background="#F9FAFB";}} onClick={()=>setSelBlock(block)}>{block}<button style={{border:"none",background:"none",cursor:"pointer",color:RED,fontSize:12,padding:0,fontFamily:"inherit",lineHeight:1}} title="Remove">×</button></div>)}
            <div style={{padding:"6px 13px",background:PF,border:`1.5px dashed ${P}`,borderRadius:8,fontSize:12,color:P,cursor:"pointer",fontWeight:700}}>+ Add Block</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{flex:1}}><Inp label="New Block Name" value={newBlock} onChange={setNewBlock} placeholder="Type new block name…"/></div>
            <Btn onClick={addBlock} disabled={!newBlock.trim()} style={{flexShrink:0}}>Add Block</Btn>
          </div>
        </Card>
        <Card title="Village Entry — Manual" sub="Villages are entered freely during child registration. You can also pre-register villages here.">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
            <Inp label="Block" value={selBlock} onChange={setSelBlock} type="select" options={districtTree[activeD]||[]} required/>
            <div><Inp label="Village / Dhani Name" value={newVillage} onChange={setNewVillage} placeholder="Type village name…" hint="Any name — Gaon, Dhani, Faliya, Mohalla…"/></div>
            <Btn onClick={()=>{if(newVillage.trim()){setMsg("Village list stays manual here and is captured during child registration.");setErr("");setNewVillage("");}}} disabled={!newVillage.trim()}>Add Village</Btn>
          </div>
        </Card>
        <Card title="District Coverage Summary" noPad>
          <Table cols={["District","Blocks","Children","IEPs","Schools","Field Workers","IEP Coverage"]}
            rows={Object.entries(districtTree).map(([d,blocks])=>{const ch=CHILDREN_DATA.filter(c=>c.dist===d);const iep=ch.filter(c=>c.hasIEP);const pct=ch.length?Math.round(iep.length/ch.length*100):0;const workerCount=users.filter(u=>(u.district?.name||"All")===d&&[ROLE_ENUMS["Field Worker"],"Field Worker"].includes(u.role)).length;return [<span style={{fontWeight:700,color:P}}>{d}</span>,blocks.length,ch.length,iep.length,new Set(ch.map(c=>c.school)).size,workerCount,<div style={{display:"flex",alignItems:"center",gap:6}}><ProgressBar pct={pct} color={pct>=80?GRN:ORG}/><span style={{fontWeight:700,fontSize:12,color:pct>=80?GRN:ORG,minWidth:32}}>{pct}%</span></div>];})}/>
        </Card>
      </div>
    </div>
  </div>;
}

// -- USER MANAGEMENT ----------------------------------------------
function UserMgmt({ user }) {
  const [modal,setModal]=useState(false);const [form,setForm]=useState({name:"",email:"",role:"",dist:"",block:"",pass:""});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const { users, create } = useUsers();
  const { districts } = useLocations();
  const districtTree=useMemo(()=>toDistrictMap(districts||[]),[districts]);
  const ff=(k,v)=>setForm(p=>({...p,[k]:v}));
  const canManage=user.role==="Super Admin"||user.role==="District Coordinator";
  const saveUser=async()=>{
    if(!form.name||!form.email||!form.role||!form.pass){setErr("Please complete all required user fields.");setMsg("");return;}
    const district=(districts||[]).find(d=>d.name===form.dist);
    const block=(district?.children||[]).find(b=>b.name===form.block);
    setSaving(true);setErr("");setMsg("");
    try{
      await create({name:form.name,email:form.email,password:form.pass,role:ROLE_ENUMS[form.role]||form.role,districtId:form.dist==="All"?"":district?.id||"",blockId:form.block==="All"?"":block?.id||""});
      setModal(false);setForm({name:"",email:"",role:"",dist:"",block:"",pass:""});setMsg("User created successfully.");
    }catch(e){setErr(e.response?.data?.message||"Unable to create user.");}finally{setSaving(false);}
  };
  return <div>
    <SHead title="User Management" sub="Multi-user, role-based access — 5 roles with district/block data isolation" action={canManage&&<Btn onClick={()=>setModal(true)}>+ Add User</Btn>}/>
    {msg&&<div style={{padding:"10px 12px",background:GBG,border:`1px solid ${GRN}35`,borderRadius:8,fontSize:12,color:GDK,marginBottom:12}}>{msg}</div>}
    {err&&<div style={{padding:"10px 12px",background:"#FEF2F2",border:`1px solid ${RED}25`,borderRadius:8,fontSize:12,color:RED,marginBottom:12}}>{err}</div>}
    <Card style={{marginBottom:14,padding:"12px 16px"}}>
      <p style={{margin:0,fontSize:12,color:T2,lineHeight:1.7}}><strong style={{color:T1}}>Role hierarchy:</strong> Super Admin → District Coordinator → Block Coordinator → Field Worker → Viewer. Each role can only see data within their assigned scope. Field Workers see only their own caseload.</p>
    </Card>
    <Card noPad>
      <Table cols={["Name","Email","Role","District / Block","Last Login","Status","Actions"]}
        rows={users.map(u=>[
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:ROLE_COLORS[ROLE_LABELS[u.role]||u.role]||P,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{u.name.charAt(0)}</div><span style={{fontWeight:700}}>{u.name}</span></div>,
          <span style={{fontSize:12,color:T3}}>{u.email}</span>,
          <Badge text={ROLE_LABELS[u.role]||u.role} color={ROLE_COLORS[ROLE_LABELS[u.role]||u.role]||P}/>,
          <span style={{fontSize:12}}>{u.district?.name||"All"}{u.block?.name?` / ${u.block.name}`:""}</span>,
          u.lastLogin?new Date(u.lastLogin).toLocaleString():"Never",
          <Badge text={u.status||"ACTIVE"} color={(u.status||"ACTIVE")==="ACTIVE"?GRN:ORG}/>,
          <div style={{display:"flex",gap:4}}><Btn variant="ghost" size="sm">Edit</Btn>{user.role==="Super Admin"&&<Btn variant="ghost" size="sm">Deactivate</Btn>}</div>
        ])}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="Add New User">
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <Inp label="Full Name" value={form.name} onChange={v=>ff("name",v)} required/>
        <Inp label="Email Address" value={form.email} onChange={v=>ff("email",v)} type="email" required/>
        <Inp label="Role" value={form.role} onChange={v=>ff("role",v)} type="select" options={ROLES} required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="District" value={form.dist} onChange={v=>{ff("dist",v);ff("block","All");}} type="select" options={["All",...Object.keys(districtTree)]}/>
          <Inp label="Block" value={form.block} onChange={v=>ff("block",v)} type="select" options={form.dist&&form.dist!=="All"?["All",...(districtTree[form.dist]||[])]:["All"]}/>
        </div>
        <Inp label="Temporary Password" value={form.pass} onChange={v=>ff("pass",v)} type="password" placeholder="User will be prompted to change" required/>
        <div style={{padding:10,background:BBG,borderRadius:7,fontSize:11,color:BDK}}>User will receive an SMS with login link and temporary password.</div>
        <div style={{display:"flex",gap:8}}><Btn onClick={saveUser} disabled={saving}>{saving?"Creating...":"Create User"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)}>Cancel</Btn></div>
      </div>
    </Modal>
  </div>;
}

// -- ADMIN SETTINGS -----------------------------------------------
function AdminSettings({ user }) {
  const [tab,setTab]=useState("overview");
  const [aiKeys,setAiKeys]=useState({claude:localStorage.getItem("pragati_claude_key")||"",openai:localStorage.getItem("pragati_openai_key")||"",gemini:localStorage.getItem("pragati_gemini_key")||""});
  const [saved,setSaved]=useState("");
  const [formBuilderOpen, setFormBuilderOpen]=useState(false);
  const [dynFields,setDynFields]=useState(()=>{try{return JSON.parse(localStorage.getItem("pragati_custom_fields")||"[]");}catch{return [];}});
  const isSuper=user.role==="Super Admin";
  const TABS=[{id:"overview",label:"Overview"},{id:"formbuilder",label:"Form Builder"},{id:"ai",label:"AI Config"},{id:"categories",label:"Categories"},{id:"backup",label:"Backup"},{id:"audit",label:"Audit Log"}];
  return <div>
    <SHead title="Admin Settings" sub={`${user.role} — System Configuration & Management`}/>
    {!isSuper&&<div style={{padding:14,background:OBG,border:`1px solid ${ORG}35`,borderRadius:10,marginBottom:16,fontSize:13,color:ODK}}>🔒 Some settings require Super Admin access. You have view-only access to this section.</div>}
    <div style={{display:"flex",gap:16}}>
      <div style={{width:185,flexShrink:0}}>
        <Card noPad style={{overflow:"hidden"}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",padding:"11px 14px",border:"none",textAlign:"left",cursor:"pointer",background:tab===t.id?`${P}10`:"transparent",color:tab===t.id?P:T2,borderLeft:tab===t.id?`3px solid ${P}`:"3px solid transparent",fontSize:13,fontWeight:700,fontFamily:"inherit",transition:"all 0.2s"}}>{t.label}</button>)}
        </Card>
      </div>
      <div style={{flex:1}}>
        {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <StatCard label="Total Users" value="24" icon="👶" color={P}/>
            <StatCard label="Last Backup" value="Today" icon="🤝" color={GRN}/>
            <StatCard label="Portal Version" value="v2.1" icon="⚙️" color={BLU}/>
          </div>
          <Card title="System Health">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Database","Online",GRN],["API Server","Active",GRN],["AI (Claude)","Connected",GRN],["Redis Cache","Active",GRN],["Storage Used","23% / 10 GB",ORG],["Active Sessions","8 users",BLU],["Last Sync","5 min ago",BLU],["Backup","Scheduled 2am",GRN]].map(([k,v,c])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 12px",background:"#F9FAFB",borderRadius:8,fontSize:12}}><span style={{color:T2,fontWeight:500}}>{k}</span><Badge text={v} color={c}/></div>)}
            </div>
          </Card>
          <Card title="Quick Actions">
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Add New User","Export All Data","Force Backup","Clear Cache","View Audit Log","Test AI Connection","Add District","Manage Categories","Customise Forms","Download Logs"].map(a=><Btn key={a} variant="ghost" size="sm" disabled={!isSuper&&["Export All Data","Force Backup","Add District","Customise Forms"].includes(a)}>{a}</Btn>)}</div>
          </Card>
        </div>}

        {tab==="formbuilder"&&<Card title="Dynamic Form Builder" sub="Add, edit, reorder or remove any field in any module — no code needed">
          <div style={{padding:20,textAlign:"center",color:T3}}>
            <div style={{fontSize:40,marginBottom:12}}>✨</div>
            <p style={{fontWeight:700,color:T2,fontSize:14,margin:"0 0 8px"}}>No-code Form Builder</p>
            <p style={{fontSize:13,maxWidth:480,margin:"0 auto 16px"}}>Admin can add / edit / remove fields in any module section. Changes apply instantly across all forms, reports, and exports. Supports: text, number, date, select, multi-select, textarea, checkbox, file upload, and more.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16,textAlign:"left"}}>
              {["Children Registry","IEP Management","Assessments","Interventions","Assistive Devices","Reports","Locations","User Profiles"].map(m=><div key={m} style={{padding:10,background:"#F9FAFB",borderRadius:8,border:`1px solid ${BD}`,fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:6}}><span style={{color:GRN,fontSize:14}}>✨</span>{m}</div>)}
            </div>
            {isSuper?<Btn onClick={()=>setFormBuilderOpen(true)}>Open Form Builder</Btn>:<p style={{color:ORG,fontSize:12}}>Super Admin access required</p>}
          </div>
        </Card>}

        {tab==="ai"&&<Card title="AI Configuration" sub="Manage API keys and providers for IEP generation">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Inp label="Claude API Key (Anthropic)" value={aiKeys.claude} onChange={v=>setAiKeys(prev=>({...prev,claude:v}))} type="password" placeholder="sk-ant-..."/>
            <Inp label="GPT-4 API Key (OpenAI)" value={aiKeys.openai} onChange={v=>setAiKeys(prev=>({...prev,openai:v}))} type="password" placeholder="sk-..."/>
            <Inp label="Gemini API Key (Google)" value={aiKeys.gemini} onChange={v=>setAiKeys(prev=>({...prev,gemini:v}))} type="password" placeholder="AIza..."/>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <Btn onClick={()=>{
                localStorage.setItem("pragati_claude_key",aiKeys.claude);
                localStorage.setItem("pragati_openai_key",aiKeys.openai);
                localStorage.setItem("pragati_gemini_key",aiKeys.gemini);
                setSaved("AI settings saved successfully.");setTimeout(()=>setSaved(""),3000);
              }}>Save AI Config</Btn>
              {saved&&<span style={{color:GRN,fontSize:12,alignSelf:"center"}}>{saved}</span>}
            </div>
            <p style={{fontSize:12,color:T3}}>Keys are saved locally in browser storage for this session/device.</p>
          </div>
        </Card>}

        {tab==="categories"&&<Card title="Category & Dropdown Manager" sub="Edit all dropdown options across the portal">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Disability Types",DISABILITIES.slice(0,5)],["School Types",SCHOOL_TYPES.slice(0,5)],["Intervention Types",INT_TYPES],["Device Providers",PROVIDERS]].map(([cat,items])=><div key={cat} style={{background:"#F9FAFB",borderRadius:9,padding:12,border:`1px solid ${BD}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><p style={{fontSize:12,fontWeight:700,color:T1,margin:0}}>{cat}</p><Btn variant="ghost" size="sm" disabled={!isSuper}>Edit</Btn></div>
              {items.map(it=><div key={it} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px dashed ${BD}`,fontSize:11,color:T2}}>{it}<button style={{background:"none",border:"none",color:RED,cursor:isSuper?"pointer":"default",fontSize:12,opacity:isSuper?1:0.3}}>×</button></div>)}
              {isSuper&&<button style={{marginTop:6,fontSize:11,color:P,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>+ Add option</button>}
            </div>)}
          </div>
        </Card>}

        {tab==="backup"&&<Card title="Backup & Data Management">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["Last Backup","Today 2:00 AM",GRN],["Backup Size","847 MB",BLU],["Schedule","Daily 2:00 AM",GRN],["Retention","30 days",BLU],["Storage Used","23% of 10 GB",ORG],["Next Backup","Tomorrow 2:00 AM",GRN]].map(([l,v,c])=><div key={l} style={{padding:12,background:"#F9FAFB",borderRadius:8,border:`1px solid ${BD}`}}><p style={{fontSize:10,color:T3,fontWeight:700,textTransform:"uppercase",margin:"0 0 4px"}}>{l}</p><p style={{fontSize:14,fontWeight:700,color:c,margin:0}}>{v}</p></div>)}
            </div>
            <div style={{display:"flex",gap:8}}><Btn disabled={!isSuper}>💾 Backup Now</Btn><Btn variant="outline" disabled={!isSuper}>⬇️ Download Backup</Btn><Btn variant="ghost" disabled={!isSuper}>🔄 Restore from Backup</Btn></div>
            {!isSuper&&<p style={{fontSize:12,color:ORG}}>🔒 Super Admin access required for backup operations.</p>}
          </div>
        </Card>}

        {tab==="audit"&&<Card title="Audit Trail Log" sub="Every action tracked — who did what, when">
          <Table compact cols={["Time","User","Role","Action","Entity","Details"]}
            rows={[["2025-04-26 10:32","Sunita Bai","Field Worker","CREATE","Intervention","Logged session for Ravi Sharma"],["2025-04-26 09:15","Priya Singh","Dist. Coord.","UPDATE","IEP Goal","Updated achievement % for BB001"],["2025-04-26 08:45","Rajesh Kumar","Super Admin","CREATE","User","Added new Field Worker: Neha Verma"],["2025-04-25 18:22","Amit Sharma","Block Coord.","EXPORT","Report","Monthly report — Rajsamand April 2025"],["2025-04-25 17:10","Sunita Bai","Field Worker","CREATE","Child","Registered new child: Pooja Kumari"],["2025-04-25 16:05","Rajesh Kumar","Super Admin","UPDATE","Form Field","Added 'Blood Group' field to Children Registry"]].map(([t,u,r,a,e,d])=>[<span style={{fontSize:10,color:T3}}>{t}</span>,<span style={{fontWeight:700,fontSize:11}}>{u}</span>,<Badge text={r} color={ROLE_COLORS[r]||T3}/>,<Badge text={a} color={a==="CREATE"?GRN:a==="UPDATE"?BLU:a==="DELETE"?RED:ORG}/>,e,<span style={{fontSize:11,color:T2}}>{d}</span>])}/>
        </Card>}
      </div>
    </div>
    <Modal open={formBuilderOpen} onClose={()=>setFormBuilderOpen(false)} title="Form Builder Canvas">
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:12,maxHeight:"70vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
           <div><h4 style={{margin:0,fontSize:14,color:T1}}>Edit Registration Form</h4><p style={{margin:"2px 0 0",fontSize:11,color:T3}}>Dynamically add custom fields below.</p></div>
           <Btn size="sm" onClick={()=>setDynFields([...dynFields,{id:Date.now(),label:"New Field",type:"Text",req:false}])}>+ Add Field</Btn>
        </div>
        {dynFields.map((f)=><div key={f.id} style={{display:"flex",alignItems:"center",gap:10,background:"#F9FAFB",padding:"10px 14px",borderRadius:8,border:`1px solid ${BD}`,boxShadow:"0 1px 2px rgba(0,0,0,0.02)"}}>
          <div style={{cursor:"grab",color:T3,fontSize:16,marginRight:4}}>⋮⋮</div>
          <div style={{flex:1,display:"flex",gap:10}}>
             <input value={f.label} onChange={e=>setDynFields(prev=>prev.map(p=>p.id===f.id?{...p,label:e.target.value}:p))} style={{flex:1,border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}} placeholder="Field Label"/>
             <select value={f.type} onChange={e=>setDynFields(prev=>prev.map(p=>p.id===f.id?{...p,type:e.target.value}:p))} style={{border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",background:WH}}><option>Text</option><option>Number</option><option>Date</option></select>
          </div>
          <label style={{fontSize:12,display:"flex",alignItems:"center",gap:6,marginLeft:4,color:T2}}><input type="checkbox" checked={f.req} onChange={e=>setDynFields(prev=>prev.map(p=>p.id===f.id?{...p,req:e.target.checked}:p))} style={{accentColor:P}}/> Req.</label>
          <button onClick={()=>setDynFields(prev=>prev.filter(p=>p.id!==f.id))} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:18,marginLeft:8,opacity:0.7}}>×</button>
        </div>)}
        {dynFields.length===0&&<p style={{textAlign:"center",color:T3,fontSize:13,padding:20}}>No custom fields yet. Click + Add Field to start.</p>}
        <div style={{marginTop:16,display:"flex",justifyContent:"flex-end",gap:8,paddingTop:16,borderTop:`1px solid ${BD}`}}>
          <Btn variant="ghost" onClick={()=>setFormBuilderOpen(false)}>Cancel</Btn>
          <Btn onClick={()=>{localStorage.setItem("pragati_custom_fields",JSON.stringify(dynFields));setFormBuilderOpen(false);alert("Form layout saved! Changes are now live in the Children Registry.");}}>Save & Publish Form</Btn>
        </div>
      </div>
    </Modal>
  </div>;
}

// -- MAIN APP -----------------------------------------------------
export default function App() {
  const [user,setUser]=useState(null);
  const [sec,setSec]=useState("dashboard");
  const [open,setOpen]=useState(true);
  useEffect(()=>{
    const raw=localStorage.getItem("pragati_user");
    if(raw){try{setUser(mapSessionUser(JSON.parse(raw)));}catch{}}
    const handleLogout=()=>setUser(null);
    window.addEventListener("pragati:logout",handleLogout);
    return ()=>window.removeEventListener("pragati:logout",handleLogout);
  },[]);
  const logout=()=>{localStorage.removeItem("pragati_token");localStorage.removeItem("pragati_refresh");localStorage.removeItem("pragati_user");setUser(null);};
  if(!user)return <Login onLogin={setUser}/>;
  const GRPS=["Core","Tools","Admin"];
  const SECTIONS={dashboard:<Dashboard user={user}/>,children:<ChildrenReg user={user}/>,iep:<IEPMgmt user={user} onAI={()=>setSec("ai")}/>,assessments:<Assessments/>,interventions:<Interventions/>,devices:<AssistiveDevices/>,reports:<Reports/>,ai:<AIAssistant onSaveToIEP={()=>setSec("iep")}/>,locations:<Locations/>,users:<UserMgmt user={user}/>,admin:<AdminSettings user={user}/>};
  const canAccess=(id)=>{if(["dashboard","children","iep","assessments","interventions","devices"].includes(id))return true;if(id==="reports")return ["Super Admin","District Coordinator","Block Coordinator","Viewer"].includes(user.role);if(id==="ai")return true;if(id==="locations")return user.role!=="Viewer";if(["users","admin"].includes(id))return ["Super Admin","District Coordinator"].includes(user.role);return true;};
  return <div style={{display:"flex",height:"100vh",fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif",background:BG,overflow:"hidden"}}>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    {/* Sidebar */}
    <div style={{width:open?240:58,flexShrink:0,background:NAV,display:"flex",flexDirection:"column",transition:"width 0.28s ease",overflow:"hidden",boxShadow:"2px 0 12px rgba(0,0,0,0.18)"}}>
      <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,minHeight:64,flexShrink:0}}>
        <div style={{width:36,height:36,background:P,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0}}>P</div>
        {open&&<div style={{overflow:"hidden"}}><p style={{fontWeight:800,fontSize:14,margin:0,color:"#fff",whiteSpace:"nowrap",letterSpacing:"-0.3px"}}>PRAGATI</p><p style={{fontSize:9,margin:0,color:"rgba(255,255,255,0.45)",whiteSpace:"nowrap"}}>Bright Beginnings NGO</p></div>}
      </div>
      <nav style={{flex:1,padding:"8px 6px",overflowY:"auto",overflowX:"hidden"}}>
        {GRPS.map(grp=><div key={grp} style={{marginBottom:12}}>
          {open&&<p style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1.5px",padding:"0 8px 3px",margin:"6px 0 2px"}}>{grp}</p>}
          {NAV_ITEMS.filter(n=>n.grp===grp).map(item=>{const access=canAccess(item.id);return <button key={item.id} onClick={()=>access&&setSec(item.id)} style={{width:"100%",padding:open?"9px 10px":"9px",border:"none",cursor:access?"pointer":"not-allowed",borderRadius:8,display:"flex",alignItems:"center",gap:9,marginBottom:1,background:sec===item.id?P:"transparent",color:sec===item.id?"#fff":access?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.3)",textAlign:"left",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all 0.15s",justifyContent:open?"flex-start":"center",opacity:access?1:0.5}} onMouseEnter={e=>{if(sec!==item.id&&access)e.currentTarget.style.background=NAVA;}} onMouseLeave={e=>{if(sec!==item.id)e.currentTarget.style.background="transparent";}} title={!open?item.label:undefined}>
          <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
          {open&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>}
        </button>;})}
        </div>)}
      </nav>
      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{width:30,height:30,background:ROLE_COLORS[user.role],borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,flexShrink:0}}>{user.name.charAt(0)}</div>
        {open&&<div style={{flex:1,overflow:"hidden"}}><p style={{fontSize:11,fontWeight:700,margin:0,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</p><p style={{fontSize:9,margin:0,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap"}}>{user.role}</p></div>}
        {open&&<button onClick={logout} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:14,padding:"2px 4px",borderRadius:4,flexShrink:0}} title="Sign out">🚪</button>}
      </div>
    </div>
    {/* Main content */}
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
      {/* Topbar */}
      <div style={{background:WH,borderBottom:`1px solid ${BD}`,padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setOpen(!open)} style={{border:"none",background:"none",cursor:"pointer",fontSize:18,padding:"3px 5px",borderRadius:6,color:T3,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=T1} onMouseLeave={e=>e.currentTarget.style.color=T3}>🔔</button>
          <div><span style={{fontSize:14,fontWeight:700,color:T1}}>{NAV_ITEMS.find(n=>n.id===sec)?.label}</span><span style={{fontSize:12,color:T3,marginLeft:8}}>PRAGATI MIS Portal</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Badge text="🟢 Live" color={GRN}/>
          <Badge text={user.dist==="All"?"All Districts":user.dist} color={BLU}/>
          <Badge text={user.role} color={ROLE_COLORS[user.role]}/>
          <span style={{fontSize:11,color:T3}}>26 Apr 2025</span>
          <div style={{width:30,height:30,background:ROLE_COLORS[user.role],borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}} title={`${user.name} · ${user.role}`}>{user.name.charAt(0)}</div>
        </div>
      </div>
      {/* Page */}
      <div style={{flex:1,overflowY:"auto",padding:20}}>{SECTIONS[sec]||<Dashboard user={user}/>}</div>
    </div>
  </div>;
}


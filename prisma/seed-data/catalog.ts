/**
 * Inputs for the sample dataset. Every institution generated from this file is
 * fictional: names combine regional geography with generic institution types,
 * and none describe a real college. Cities, states and exam names are real so
 * the product behaves realistically.
 */
import type { Category, Exam } from "../../src/generated/prisma/enums";

export type Region = {
  state: string;
  /** Exam whose ranks most B.Tech seats in this group use. */
  primaryExam: Exam;
  collegeCount: number;
  cities: readonly string[];
  /** Geographic name stems used to build fictional institution names. */
  stems: readonly string[];
};

export const REGIONS: readonly Region[] = [
  {
    state: "Maharashtra",
    primaryExam: "MHT_CET",
    collegeCount: 28,
    cities: [
      "Mumbai",
      "Pune",
      "Nagpur",
      "Nashik",
      "Navi Mumbai",
      "Thane",
      "Kolhapur",
      "Chhatrapati Sambhajinagar",
      "Amravati",
      "Solapur",
    ],
    stems: [
      "Sahyadri Ridge",
      "Konkan Coast",
      "Deccan Plateau",
      "Godavari Valley",
      "Bhima River",
      "Satpura Range",
      "Tapi Basin",
      "Wainganga",
      "Kalsubai",
      "Western Ghats",
      "Krishna Valley",
      "Panchganga",
      "Lonar",
      "Purna Valley",
      "Mula-Mutha",
      "Vaitarna",
    ],
  },
  {
    state: "Karnataka",
    primaryExam: "KCET",
    collegeCount: 22,
    cities: [
      "Bengaluru",
      "Mysuru",
      "Mangaluru",
      "Hubballi",
      "Belagavi",
      "Davanagere",
      "Tumakuru",
      "Udupi",
    ],
    stems: [
      "Kaveri Valley",
      "Tungabhadra",
      "Malnad",
      "Kabini",
      "Sharavathi",
      "Hemavathi",
      "Netravati",
      "Chamundi Hills",
      "Kodachadri",
      "Varahi",
      "Arkavathi",
      "Ghataprabha",
    ],
  },
  {
    state: "West Bengal",
    primaryExam: "WBJEE",
    collegeCount: 16,
    cities: ["Kolkata", "Durgapur", "Siliguri", "Howrah", "Kalyani", "Asansol"],
    stems: [
      "Hooghly Riverside",
      "Damodar Valley",
      "Teesta",
      "Sundarban",
      "Ajay River",
      "Rupnarayan",
      "Mahananda",
      "Gangasagar",
      "Jaldhaka",
    ],
  },
  {
    state: "Delhi",
    primaryExam: "JEE_MAIN",
    collegeCount: 5,
    cities: ["New Delhi", "Dwarka", "Rohini"],
    stems: ["Yamuna Bank", "Aravali Ridge", "Najafgarh", "Sahibi River", "Ridge Valley"],
  },
  {
    state: "Uttar Pradesh",
    primaryExam: "JEE_MAIN",
    collegeCount: 6,
    cities: ["Noida", "Lucknow", "Prayagraj", "Kanpur", "Varanasi", "Greater Noida"],
    stems: ["Gomti", "Ganga Plains", "Doab", "Sarayu", "Varuna", "Rapti"],
  },
  {
    state: "Rajasthan",
    primaryExam: "JEE_MAIN",
    collegeCount: 4,
    cities: ["Jaipur", "Kota", "Jodhpur", "Udaipur"],
    stems: ["Thar", "Aravali Heights", "Luni", "Mewar Lakes"],
  },
  {
    state: "Madhya Pradesh",
    primaryExam: "JEE_MAIN",
    collegeCount: 4,
    cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
    stems: ["Narmada", "Vindhya", "Malwa Plateau", "Chambal"],
  },
  {
    state: "Tamil Nadu",
    primaryExam: "JEE_MAIN",
    collegeCount: 6,
    cities: ["Chennai", "Coimbatore", "Tiruchirappalli", "Madurai", "Vellore", "Salem"],
    stems: ["Coromandel", "Vaigai", "Palar", "Kongu Plains", "Thamirabarani", "Nilgiri Foothills"],
  },
  {
    state: "Telangana",
    primaryExam: "JEE_MAIN",
    collegeCount: 5,
    cities: ["Hyderabad", "Warangal", "Karimnagar", "Secunderabad"],
    stems: ["Musi", "Deccan Heights", "Manjira", "Pakhal Lake", "Pranhita"],
  },
  {
    state: "Gujarat",
    primaryExam: "JEE_MAIN",
    collegeCount: 5,
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    stems: ["Sabarmati", "Narmada Delta", "Saurashtra", "Mahi", "Kutch"],
  },
  {
    state: "Kerala",
    primaryExam: "JEE_MAIN",
    collegeCount: 4,
    cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
    stems: ["Malabar", "Periyar", "Vembanad", "Bharathapuzha"],
  },
  {
    state: "Punjab",
    primaryExam: "JEE_MAIN",
    collegeCount: 3,
    cities: ["Mohali", "Patiala", "Ludhiana"],
    stems: ["Sutlej", "Beas", "Doaba"],
  },
  {
    state: "Odisha",
    primaryExam: "JEE_MAIN",
    collegeCount: 3,
    cities: ["Bhubaneswar", "Cuttack", "Rourkela"],
    stems: ["Mahanadi", "Chilika", "Brahmani"],
  },
  {
    state: "Haryana",
    primaryExam: "JEE_MAIN",
    collegeCount: 3,
    cities: ["Gurugram", "Kurukshetra", "Faridabad"],
    stems: ["Saraswati Plains", "Ghaggar", "Markanda"],
  },
  {
    state: "Andhra Pradesh",
    primaryExam: "JEE_MAIN",
    collegeCount: 3,
    cities: ["Visakhapatnam", "Vijayawada", "Tirupati"],
    stems: ["Krishna Delta", "Eastern Ghats", "Pennar"],
  },
  {
    state: "Bihar",
    primaryExam: "JEE_MAIN",
    collegeCount: 2,
    cities: ["Patna", "Gaya"],
    stems: ["Gandak", "Son Valley"],
  },
  {
    state: "Assam",
    primaryExam: "JEE_MAIN",
    collegeCount: 2,
    cities: ["Guwahati", "Jorhat"],
    stems: ["Luit", "Manas"],
  },
  {
    state: "Uttarakhand",
    primaryExam: "JEE_MAIN",
    collegeCount: 2,
    cities: ["Dehradun", "Roorkee"],
    stems: ["Alaknanda", "Bhagirathi"],
  },
  {
    state: "Jharkhand",
    primaryExam: "JEE_MAIN",
    collegeCount: 2,
    cities: ["Ranchi", "Jamshedpur"],
    stems: ["Subarnarekha", "Chota Nagpur"],
  },
];

export const GOVERNMENT_NAME_TEMPLATES = [
  "{stem} Government Engineering College",
  "{stem} State Institute of Technology",
  "{stem} University College of Engineering",
] as const;

export const PRIVATE_NAME_TEMPLATES = [
  "{stem} Institute of Technology",
  "{stem} College of Engineering",
  "{stem} Institute of Engineering and Management",
  "{stem} School of Engineering and Technology",
  "{stem} Institute of Technology and Science",
] as const;

/**
 * Rough number of candidates on each exam's merit list who compete for these
 * seats. Scales the generated closing ranks to a believable range per exam.
 */
export const EXAM_RANK_POOL: Record<Exam, number> = {
  JEE_MAIN: 700_000,
  MHT_CET: 160_000,
  KCET: 140_000,
  WBJEE: 70_000,
};

/** Number of the last counselling round for each exam. */
export const FINAL_ROUND: Record<Exam, number> = {
  JEE_MAIN: 6,
  MHT_CET: 3,
  KCET: 3,
  WBJEE: 3,
};

/**
 * All ranks are common-merit-list positions, so reserved categories close at
 * larger (less competitive) overall ranks than General.
 */
export const CATEGORY_RANK_FACTOR: Record<Category, number> = {
  GENERAL: 1,
  EWS: 1.3,
  OBC: 1.6,
  SC: 4.5,
  ST: 6,
};

export type Branch = {
  name: string;
  shortName: string;
  /** Multiplier on the college's CSE closing rank. Higher means less competitive. */
  demand: number;
  offerChance: (quality: number) => number;
};

export const BTECH_BRANCHES: readonly Branch[] = [
  { name: "Computer Science and Engineering", shortName: "CSE", demand: 1, offerChance: () => 1 },
  {
    name: "Artificial Intelligence and Data Science",
    shortName: "AI & DS",
    demand: 1.12,
    offerChance: () => 0.5,
  },
  { name: "Information Technology", shortName: "IT", demand: 1.3, offerChance: () => 0.55 },
  {
    name: "Electronics and Communication Engineering",
    shortName: "ECE",
    demand: 1.6,
    offerChance: () => 0.9,
  },
  {
    name: "Electrical and Electronics Engineering",
    shortName: "EEE",
    demand: 2.2,
    offerChance: () => 0.7,
  },
  { name: "Mechanical Engineering", shortName: "Mechanical", demand: 3, offerChance: () => 0.85 },
  {
    name: "Chemical Engineering",
    shortName: "Chemical",
    demand: 3.3,
    offerChance: (q) => (q > 0.5 ? 0.5 : 0.1),
  },
  { name: "Biotechnology", shortName: "Biotech", demand: 3.5, offerChance: () => 0.2 },
  { name: "Civil Engineering", shortName: "Civil", demand: 3.8, offerChance: () => 0.75 },
];

export const MTECH_SPECIALISATIONS = [
  "Computer Science and Engineering",
  "VLSI Design",
  "Structural Engineering",
  "Thermal Engineering",
  "Power Systems",
  "Data Science",
] as const;

export const OVERVIEW_DETAILS = [
  "Students run active coding, robotics and entrepreneurship clubs.",
  "The institute hosts an annual technical festival that draws participants from nearby colleges.",
  "Industry projects and internships are encouraged from the third year onwards.",
  "The campus includes hostels, a central library and sports facilities.",
  "A dedicated training and placement cell coordinates campus recruitment.",
] as const;

export type Tone = "positive" | "mixed" | "negative";

export const REVIEW_TITLES: Record<Tone, readonly string[]> = {
  positive: [
    "Good choice for engineering",
    "Supportive faculty and active clubs",
    "Worth it overall",
    "Happy with my decision",
    "Learned a lot here",
  ],
  mixed: [
    "Decent, but depends on your branch",
    "Average experience",
    "Good in parts",
    "Mixed feelings after two years",
    "Okay if you are self-motivated",
  ],
  negative: [
    "Expected more",
    "Not worth the fees",
    "Needs serious improvement",
    "Disappointed with the administration",
    "Think twice before joining",
  ],
};

export const REVIEW_ASPECTS = [
  "placements",
  "faculty",
  "infrastructure",
  "hostel",
  "curriculum",
  "value",
] as const;

export type ReviewAspect = (typeof REVIEW_ASPECTS)[number];

export const REVIEW_SENTENCES: Record<ReviewAspect, Record<Tone, readonly string[]>> = {
  placements: {
    positive: [
      "Most students in my batch had an offer before the final semester, and the placement cell is well organised.",
      "Good companies visit for both core and software roles, and seniors help a lot with interview preparation.",
      "Internships start from the third year, which made final placements much easier.",
    ],
    mixed: [
      "Placements are good for CSE and IT, but core branches have to put in extra effort.",
      "A fair number of companies visit, though many offers are for service-based roles.",
      "The placement cell does its job, but you have to prepare on your own for better offers.",
    ],
    negative: [
      "Very few companies visit campus, and most students look for jobs off-campus.",
      "Placement support is weak; the training sessions felt like a formality.",
      "Core branch students struggle to get placed through the college.",
    ],
  },
  faculty: {
    positive: [
      "Most professors are approachable and happy to guide projects outside class hours.",
      "Faculty in the department are experienced and explain concepts clearly.",
      "Several professors encourage research and help students publish papers.",
    ],
    mixed: [
      "Some faculty members are excellent, while others just read from slides.",
      "Teaching quality varies a lot from subject to subject.",
      "Professors are knowledgeable but not always available after classes.",
    ],
    negative: [
      "Many classes are taken by new faculty who change every semester.",
      "Teaching is mostly focused on finishing the syllabus before exams.",
      "It is hard to get guidance from faculty for projects.",
    ],
  },
  infrastructure: {
    positive: [
      "Labs are well equipped and the library stays open late during exams.",
      "The campus is green and well maintained, with good sports facilities.",
      "Classrooms and labs were upgraded recently, and Wi-Fi works across campus.",
    ],
    mixed: [
      "The main building is fine, but some labs have outdated equipment.",
      "Campus facilities are adequate, although Wi-Fi is unreliable in places.",
      "Sports facilities are good, but the library could use more recent books.",
    ],
    negative: [
      "Lab equipment is old and often not working.",
      "The campus is cramped and the library has limited seating.",
      "Wi-Fi barely works, and basic maintenance is slow.",
    ],
  },
  hostel: {
    positive: [
      "Hostel rooms are clean and the mess food is better than expected.",
      "Hostel life is a highlight, with a friendly and diverse student community.",
    ],
    mixed: [
      "Hostels are okay, but the mess menu gets repetitive.",
      "Rooms are basic; many seniors prefer to rent flats nearby.",
    ],
    negative: [
      "Hostel rooms are overcrowded and the mess food is poor.",
      "Hostel rules are very strict and the facilities are not well maintained.",
    ],
  },
  curriculum: {
    positive: [
      "The curriculum includes recent electives, with room for hands-on projects.",
      "Coding clubs and technical fests make up for anything the syllabus misses.",
    ],
    mixed: [
      "The syllabus is a little dated, but final-year electives help.",
      "There is a heavy focus on exams, so practical learning depends on clubs.",
    ],
    negative: [
      "The syllabus is outdated and there is little scope for practical work.",
      "Attendance rules are strict, leaving little time for projects or internships.",
    ],
  },
  value: {
    positive: [
      "Considering the fees, the college offers good value.",
      "Scholarships are available and the fee structure is transparent.",
    ],
    mixed: [
      "Fees are reasonable, but there are extra charges during the year.",
      "Value for money depends a lot on which branch you get.",
    ],
    negative: [
      "Fees keep increasing every year without visible improvements.",
      "There are too many additional charges on top of tuition.",
    ],
  },
};

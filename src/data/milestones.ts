export interface Milestone {
  id: string;
  name: string;
  date: string; // Format: MM-DD
  color: string;
  category: 'awareness' | 'holiday' | 'observance' | 'cultural';
}

// ── Moveable feast helpers ────────────────────────────────────────────────────

/** Easter Sunday via the Anonymous Gregorian algorithm. */
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Returns the nth occurrence of a weekday in a given month (0=Sun … 6=Sat). */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1).getDay();
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, day);
}

function toMMDD(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Milestones whose date shifts every year — computed fresh for each year. */
function getMoveableMilestones(year: number): Milestone[] {
  const easter = computeEaster(year);
  const thanksgiving = nthWeekday(year, 10, 4, 4); // 4th Thursday of November
  return [
    { id: 'mv-bluemonday',    name: 'Blue Monday',          date: toMMDD(nthWeekday(year, 0, 1, 3)),   color: 'bg-blue-100 text-blue-700',    category: 'observance' },
    { id: 'mv-shrove',        name: 'Shrove Tuesday',       date: toMMDD(addDays(easter, -47)),         color: 'bg-yellow-100 text-yellow-700', category: 'observance' },
    { id: 'mv-goodfriday',    name: 'Good Friday',          date: toMMDD(addDays(easter, -2)),          color: 'bg-purple-100 text-purple-700', category: 'holiday'    },
    { id: 'mv-easter',        name: 'Easter Sunday',        date: toMMDD(easter),                       color: 'bg-pink-100 text-pink-700',    category: 'holiday'    },
    { id: 'mv-eastermon',     name: 'Easter Monday',        date: toMMDD(addDays(easter, 1)),           color: 'bg-pink-100 text-pink-700',    category: 'holiday'    },
    { id: 'mv-mothersday',    name: "Mother's Day (AU)",    date: toMMDD(nthWeekday(year, 4, 0, 2)),   color: 'bg-pink-100 text-pink-700',    category: 'holiday'    },
    { id: 'mv-kingsbirthday', name: "King's Birthday (AU)", date: toMMDD(nthWeekday(year, 5, 1, 2)),   color: 'bg-purple-100 text-purple-700', category: 'holiday'   },
    { id: 'mv-naidoc',        name: 'NAIDOC Week Starts',   date: toMMDD(nthWeekday(year, 6, 0, 1)),   color: 'bg-orange-100 text-orange-700', category: 'cultural'   },
    { id: 'mv-fathersday',    name: "Father's Day (AU)",    date: toMMDD(nthWeekday(year, 8, 0, 1)),   color: 'bg-blue-100 text-blue-700',    category: 'holiday'    },
    { id: 'mv-ruokday',       name: 'R U OK? Day',          date: toMMDD(nthWeekday(year, 8, 4, 2)),   color: 'bg-yellow-100 text-yellow-700', category: 'awareness'  },
    { id: 'mv-melbcup',       name: 'Melbourne Cup',        date: toMMDD(nthWeekday(year, 10, 2, 1)),  color: 'bg-yellow-100 text-yellow-700', category: 'cultural'   },
    { id: 'mv-blackfriday',   name: 'Black Friday',         date: toMMDD(addDays(thanksgiving, 1)),    color: 'bg-slate-100 text-slate-700',   category: 'observance' },
    { id: 'mv-cybermonday',   name: 'Cyber Monday',         date: toMMDD(addDays(thanksgiving, 4)),    color: 'bg-blue-100 text-blue-700',    category: 'observance' },
    { id: 'mv-givingtuesday', name: 'Giving Tuesday',       date: toMMDD(addDays(thanksgiving, 5)),    color: 'bg-green-100 text-green-700',   category: 'observance' },
  ];
}

// ── Static milestones (fixed MM-DD every year) ────────────────────────────────
// Removed from this list: Blue Monday, Shrove Tuesday, Good Friday, Easter Sunday,
// Easter Monday, Mother's Day AU, Father's Day AU, Melbourne Cup — all moveable.

export const milestones: Milestone[] = [
  // January
  { id: '1', name: 'New Year\'s Day', date: '01-01', color: 'bg-yellow-100 text-yellow-700', category: 'holiday' },
  { id: '2', name: 'World Braille Day', date: '01-04', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '3', name: 'National Technology Day', date: '01-06', color: 'bg-indigo-100 text-indigo-700', category: 'observance' },
  { id: '5', name: 'Australia Day', date: '01-26', color: 'bg-green-100 text-green-700', category: 'cultural' },

  // February
  { id: '6', name: 'World Cancer Day', date: '02-04', color: 'bg-pink-100 text-pink-700', category: 'awareness' },
  { id: '7', name: 'Safer Internet Day', date: '02-11', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '8', name: 'Valentine\'s Day', date: '02-14', color: 'bg-red-100 text-red-700', category: 'holiday' },
  { id: '9', name: 'Random Acts of Kindness Day', date: '02-17', color: 'bg-green-100 text-green-700', category: 'observance' },
  { id: '11', name: 'National Toast Day', date: '02-26', color: 'bg-orange-100 text-orange-700', category: 'observance' },

  // March
  { id: '12', name: 'Clean Up Australia Day', date: '03-01', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '13', name: 'Mardi Gras Sydney', date: '03-01', color: 'bg-purple-100 text-purple-700', category: 'cultural' },
  { id: '14', name: 'World Book Day', date: '03-06', color: 'bg-indigo-100 text-indigo-700', category: 'observance' },
  { id: '15', name: 'International Women\'s Day', date: '03-08', color: 'bg-purple-100 text-purple-700', category: 'observance' },
  { id: '16', name: 'World Plumbing Day', date: '03-11', color: 'bg-blue-100 text-blue-700', category: 'observance' },
  { id: '17', name: 'Pi Day', date: '03-14', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '18', name: 'World Sleep Day', date: '03-15', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '19', name: 'Harmony Day', date: '03-21', color: 'bg-orange-100 text-orange-700', category: 'cultural' },
  { id: '20', name: 'World Water Day', date: '03-22', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '21', name: 'Earth Hour', date: '03-29', color: 'bg-green-100 text-green-700', category: 'awareness' },

  // April
  { id: '22', name: 'April Fools\' Day', date: '04-01', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '23', name: 'National Safe Work Month', date: '04-01', color: 'bg-yellow-100 text-yellow-700', category: 'awareness' },
  { id: '24', name: 'World Autism Awareness Day', date: '04-02', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '25', name: 'World Health Day', date: '04-07', color: 'bg-red-100 text-red-700', category: 'awareness' },
  { id: '29', name: 'Earth Day', date: '04-22', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '30', name: 'ANZAC Day', date: '04-25', color: 'bg-red-100 text-red-700', category: 'cultural' },
  { id: '31', name: 'Workers Memorial Day', date: '04-28', color: 'bg-orange-100 text-orange-700', category: 'observance' },

  // May
  { id: '32', name: 'International Workers\' Day', date: '05-01', color: 'bg-red-100 text-red-700', category: 'observance' },
  { id: '33', name: 'Star Wars Day', date: '05-04', color: 'bg-slate-100 text-slate-700', category: 'observance' },
  { id: '34', name: 'World Password Day', date: '05-01', color: 'bg-indigo-100 text-indigo-700', category: 'observance' },
  { id: '36', name: 'International Day Against Homophobia', date: '05-17', color: 'bg-purple-100 text-purple-700', category: 'awareness' },
  { id: '37', name: 'World Bee Day', date: '05-20', color: 'bg-yellow-100 text-yellow-700', category: 'awareness' },
  { id: '38', name: 'International Tea Day', date: '05-21', color: 'bg-green-100 text-green-700', category: 'observance' },
  { id: '39', name: 'National Sorry Day', date: '05-26', color: 'bg-purple-100 text-purple-700', category: 'cultural' },
  { id: '40', name: 'Reconciliation Week Starts', date: '05-27', color: 'bg-yellow-100 text-yellow-700', category: 'cultural' },
  
  // June
  { id: '41', name: 'Reconciliation Week Ends', date: '06-03', color: 'bg-yellow-100 text-yellow-700', category: 'cultural' },
  { id: '42', name: 'World Environment Day', date: '06-05', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '43', name: 'World Ocean Day', date: '06-08', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '45', name: 'World Refugee Day', date: '06-20', color: 'bg-orange-100 text-orange-700', category: 'awareness' },
  { id: '46', name: 'World Music Day', date: '06-21', color: 'bg-purple-100 text-purple-700', category: 'observance' },
  { id: '47', name: 'Pride Month', date: '06-01', color: 'bg-purple-100 text-purple-700', category: 'awareness' },
  { id: '48', name: 'Global Wellness Day', date: '06-14', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '49', name: 'International Yoga Day', date: '06-21', color: 'bg-blue-100 text-blue-700', category: 'observance' },
  
  // July
  { id: '50', name: 'Dry July (Month)', date: '07-01', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '51', name: 'Plastic Free July', date: '07-01', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '52', name: 'International Day of Cooperatives', date: '07-06', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '54', name: 'World Chocolate Day', date: '07-07', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '55', name: 'World Population Day', date: '07-11', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '56', name: 'World Emoji Day', date: '07-17', color: 'bg-yellow-100 text-yellow-700', category: 'observance' },
  { id: '57', name: 'National Tree Day', date: '07-27', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '58', name: 'International Friendship Day', date: '07-30', color: 'bg-pink-100 text-pink-700', category: 'observance' },
  
  // August
  { id: '59', name: 'World Architecture Day', date: '08-01', color: 'bg-slate-100 text-slate-700', category: 'observance' },
  { id: '60', name: 'National Home Improvement Month', date: '08-01', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '61', name: 'International Beer Day', date: '08-01', color: 'bg-yellow-100 text-yellow-700', category: 'observance' },
  { id: '62', name: 'International Cat Day', date: '08-08', color: 'bg-purple-100 text-purple-700', category: 'observance' },
  { id: '63', name: 'International Youth Day', date: '08-12', color: 'bg-purple-100 text-purple-700', category: 'observance' },
  { id: '64', name: 'World Humanitarian Day', date: '08-19', color: 'bg-red-100 text-red-700', category: 'awareness' },
  { id: '65', name: 'World Photography Day', date: '08-19', color: 'bg-indigo-100 text-indigo-700', category: 'observance' },
  { id: '66', name: 'International Dog Day', date: '08-26', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '67', name: 'Wear It Purple Day', date: '08-29', color: 'bg-purple-100 text-purple-700', category: 'awareness' },
  
  // September
  { id: '69', name: 'Wattle Day', date: '09-01', color: 'bg-yellow-100 text-yellow-700', category: 'cultural' },
  { id: '70', name: 'International Literacy Day', date: '09-08', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '72', name: 'International Day of Democracy', date: '09-15', color: 'bg-blue-100 text-blue-700', category: 'observance' },
  { id: '73', name: 'International Day of Peace', date: '09-21', color: 'bg-green-100 text-green-700', category: 'observance' },
  { id: '74', name: 'World Tourism Day', date: '09-27', color: 'bg-indigo-100 text-indigo-700', category: 'observance' },
  { id: '75', name: 'International Coffee Day', date: '09-29', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  
  // October
  { id: '76', name: 'International Coffee Day', date: '10-01', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '77', name: 'Breast Cancer Awareness Month', date: '10-01', color: 'bg-pink-100 text-pink-700', category: 'awareness' },
  { id: '78', name: 'World Vegetarian Day', date: '10-01', color: 'bg-green-100 text-green-700', category: 'observance' },
  { id: '79', name: 'International Day of Older Persons', date: '10-01', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '80', name: 'World Animal Day', date: '10-04', color: 'bg-orange-100 text-orange-700', category: 'awareness' },
  { id: '81', name: 'World Teachers Day', date: '10-05', color: 'bg-purple-100 text-purple-700', category: 'observance' },
  { id: '82', name: 'World Habitat Day', date: '10-07', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '83', name: 'World Architecture Day', date: '10-07', color: 'bg-slate-100 text-slate-700', category: 'observance' },
  { id: '84', name: 'World Mental Health Day', date: '10-10', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '85', name: 'World Egg Day', date: '10-11', color: 'bg-yellow-100 text-yellow-700', category: 'observance' },
  { id: '86', name: 'World Food Day', date: '10-16', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '87', name: 'International Chefs Day', date: '10-20', color: 'bg-orange-100 text-orange-700', category: 'observance' },
  { id: '88', name: 'Pink Ribbon Day', date: '10-23', color: 'bg-pink-100 text-pink-700', category: 'awareness' },
  { id: '89', name: 'National Fire Safety Week', date: '10-27', color: 'bg-red-100 text-red-700', category: 'awareness' },
  { id: '90', name: 'World Pasta Day', date: '10-25', color: 'bg-yellow-100 text-yellow-700', category: 'observance' },
  { id: '91', name: 'Halloween', date: '10-31', color: 'bg-orange-100 text-orange-700', category: 'holiday' },
  
  // November
  { id: '92', name: 'Movember (Month)', date: '11-01', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '93', name: 'World Vegan Day', date: '11-01', color: 'bg-green-100 text-green-700', category: 'observance' },
  { id: '95', name: 'World Urbanism Day', date: '11-08', color: 'bg-slate-100 text-slate-700', category: 'observance' },
  { id: '96', name: 'Remembrance Day', date: '11-11', color: 'bg-red-100 text-red-700', category: 'observance' },
  { id: '97', name: 'World Kindness Day', date: '11-13', color: 'bg-pink-100 text-pink-700', category: 'observance' },
  { id: '98', name: 'World Toilet Day', date: '11-19', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '99', name: 'International Men\'s Day', date: '11-19', color: 'bg-blue-100 text-blue-700', category: 'observance' },
  { id: '100', name: 'Universal Children\'s Day', date: '11-20', color: 'bg-yellow-100 text-yellow-700', category: 'observance' },
  { id: '101', name: 'White Ribbon Day', date: '11-25', color: 'bg-slate-100 text-slate-700', category: 'awareness' },
  
  // December
  { id: '105', name: 'World AIDS Day', date: '12-01', color: 'bg-red-100 text-red-700', category: 'awareness' },
  { id: '106', name: 'International Day of People with Disability', date: '12-03', color: 'bg-blue-100 text-blue-700', category: 'awareness' },
  { id: '107', name: 'International Volunteer Day', date: '12-05', color: 'bg-purple-100 text-purple-700', category: 'observance' },
  { id: '108', name: 'Human Rights Day', date: '12-10', color: 'bg-blue-100 text-blue-700', category: 'observance' },
  { id: '109', name: 'National Tree Day', date: '12-15', color: 'bg-green-100 text-green-700', category: 'awareness' },
  { id: '110', name: 'Christmas Eve', date: '12-24', color: 'bg-red-100 text-red-700', category: 'holiday' },
  { id: '111', name: 'Christmas Day', date: '12-25', color: 'bg-red-100 text-red-700', category: 'holiday' },
  { id: '112', name: 'Boxing Day', date: '12-26', color: 'bg-green-100 text-green-700', category: 'holiday' },
  { id: '113', name: 'New Year\'s Eve', date: '12-31', color: 'bg-purple-100 text-purple-700', category: 'holiday' },
];

/** All milestones (static + moveable) for a given year. */
export function getAllMilestones(year: number): Milestone[] {
  return [...milestones, ...getMoveableMilestones(year)];
}

export function getMilestonesForDate(date: Date): Milestone[] {
  const mmdd = toMMDD(date);
  const year = date.getFullYear();
  const all = [...milestones, ...getMoveableMilestones(year)];
  return all.filter(m => m.date === mmdd);
}

export function getMilestonesForMonth(year: number, month: number): Map<number, Milestone[]> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const all = [...milestones, ...getMoveableMilestones(year)];
  const milestoneMap = new Map<number, Milestone[]>();

  for (let day = 1; day <= daysInMonth; day++) {
    const mmdd = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayMilestones = all.filter(m => m.date === mmdd);
    if (dayMilestones.length > 0) {
      milestoneMap.set(day, dayMilestones);
    }
  }

  return milestoneMap;
}
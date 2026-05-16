/**
 * Seed script — populates PredictMate with 50 markets and 5,000+ votes
 * Run: npx tsx scripts/seed.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import { Redis } from '@upstash/redis'
import { faker } from '@faker-js/faker'

// ── Load .env.local ────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=')
    if (eq === -1 || line.trimStart().startsWith('#')) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    if (k) process.env[k] = v
  }
}

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ── Types ──────────────────────────────────────────────────────────────────────
type Vote = { userId: string; name: string; side: 'yes' | 'no'; createdAt: number }
type Market = {
  id: string; question: string; creatorName: string; context?: string
  imageUrl?: string; expiresAt: number; votes: Vote[]
  upvoters: string[]; downvoters: string[]
  outcome?: 'yes' | 'no'; resolvedAt?: number; createdAt: number
}

// ── 600 fake users (enough for the most-voted market) ─────────────────────────
console.log('Generating users...')
const USERS = Array.from({ length: 600 }, () => ({
  userId: crypto.randomUUID(),
  name: faker.person.fullName(),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────
const NOW = Date.now()
const DAY = 86_400_000

function pickUsers(n: number) {
  return [...USERS].sort(() => Math.random() - 0.5).slice(0, Math.min(n, USERS.length))
}

function makeVotes(count: number, yesRatio: number, start: number, end: number): Vote[] {
  const voters = pickUsers(count)
  const span = Math.max(end - start, 1)
  return voters.map((u, i) => ({
    userId: u.userId,
    name: u.name,
    side: Math.random() < yesRatio ? 'yes' : 'no',
    createdAt: start + Math.floor((i / voters.length) * span),
  }))
}

function makeUpvoterIds(n: number) {
  return pickUsers(n).map(u => u.userId)
}

// ── Market definitions ─────────────────────────────────────────────────────────
// createdDaysAgo: how long ago the market was created
// expiryDays: days from NOW (negative = already expired)
interface Def {
  question: string; creator: string; context?: string
  votes: number; yesRatio: number
  createdDaysAgo: number; expiryDays: number
  up?: number; down?: number
  outcome?: 'yes' | 'no'; resolvedDaysAgo?: number
}

const DEFS: Def[] = [
  // ── RELATIONSHIPS ─────────────────────────────────────────────────────────
  {
    question: "Will Jake finally ask Sarah out before she loses interest?",
    creator: "Priya Sharma",
    context: "Jake has had a crush on Sarah for 8 months. She's leaving for grad school in September. We're all watching this unfold in real time.",
    votes: 412, yesRatio: 0.68, createdDaysAgo: 45, expiryDays: 30,
    up: 89, down: 12,
  },
  {
    question: "Will Emma and Chris get back together for the 4th time this year?",
    creator: "Destiny Clarke",
    context: "They broke up two weeks ago. Again. Everyone in the group chat has a personal bet going.",
    votes: 287, yesRatio: 0.72, createdDaysAgo: 20, expiryDays: 40,
    up: 67, down: 8, outcome: 'yes', resolvedDaysAgo: 5,
  },
  {
    question: "Is my roommate ever going to confess her feelings to her coworker?",
    creator: "Kenji Tanaka",
    votes: 195, yesRatio: 0.61, createdDaysAgo: 30, expiryDays: 30,
    up: 44, down: 5,
  },
  {
    question: "Will Tyler propose to his girlfriend before the Paris trip in August?",
    creator: "Aaliyah Brooks",
    context: "He's been carrying the ring for 3 months. I have seen the ring. The man is simply terrified.",
    votes: 380, yesRatio: 0.84, createdDaysAgo: 60, expiryDays: 75,
    up: 103, down: 7,
  },
  {
    question: "Are Mia and Ben actually going to survive long distance?",
    creator: "Lucas Ferreira",
    votes: 220, yesRatio: 0.31, createdDaysAgo: 10, expiryDays: 170,
    up: 38, down: 14,
  },
  {
    question: "Will Kevin stop ghosting his Hinge matches and actually go on a date this month?",
    creator: "Zara Ahmed",
    context: "He has 12 active conversations and has been 'too busy' for 6 months straight.",
    votes: 165, yesRatio: 0.26, createdDaysAgo: 15, expiryDays: 15,
    up: 55, down: 9,
  },
  {
    question: "Will my friend group survive the drama that happened at the ski trip?",
    creator: "Noah Okonkwo",
    context: "Three couples. One cabin. Someone said something they cannot take back. Details TBD.",
    votes: 90, yesRatio: 0.19, createdDaysAgo: 10, expiryDays: -2,
    up: 29, down: 3, outcome: 'no', resolvedDaysAgo: 2,
  },
  {
    question: "Is my situationship going to turn into an actual relationship by summer?",
    creator: "Sienna Walsh",
    votes: 150, yesRatio: 0.44, createdDaysAgo: 25, expiryDays: 45,
    up: 47, down: 11,
  },
  {
    question: "Will Jess slide into her coworker's DMs before the company retreat?",
    creator: "Dmitri Volkov",
    votes: 72, yesRatio: 0.64, createdDaysAgo: 5, expiryDays: 15,
    up: 18, down: 2,
  },
  {
    question: "Will the couple in apartment 4B stop fighting loud enough for the whole building to hear?",
    creator: "Amara Diallo",
    votes: 48, yesRatio: 0.14, createdDaysAgo: 12, expiryDays: 18,
    up: 22, down: 6,
  },

  // ── SCHOOL / WORK ─────────────────────────────────────────────────────────
  {
    question: "Will I actually study the night before my organic chemistry final?",
    creator: "Ryan Kowalski",
    votes: 498, yesRatio: 0.11, createdDaysAgo: 8, expiryDays: -1,
    up: 145, down: 4, outcome: 'no', resolvedDaysAgo: 1,
  },
  {
    question: "Is the professor going to curve the midterm after the class average was a 54?",
    creator: "Fatima Al-Hassan",
    context: "Hardest exam I've ever taken. The curve has to come. It just has to.",
    votes: 334, yesRatio: 0.89, createdDaysAgo: 14, expiryDays: -3,
    up: 112, down: 3, outcome: 'yes', resolvedDaysAgo: 3,
  },
  {
    question: "Will our group project partner do literally anything before the 11pm deadline?",
    creator: "Jorge Mendoza",
    context: "He hasn't been to a single meeting. His entire section is due tonight. We've been covering for him for 3 weeks.",
    votes: 305, yesRatio: 0.09, createdDaysAgo: 6, expiryDays: -1,
    up: 98, down: 1, outcome: 'no', resolvedDaysAgo: 1,
  },
  {
    question: "Will the new intern survive their 90-day performance review?",
    creator: "Yuki Nakamura",
    votes: 130, yesRatio: 0.71, createdDaysAgo: 40, expiryDays: 50,
    up: 34, down: 5,
  },
  {
    question: "Is Marcus actually getting promoted before end of Q2?",
    creator: "Isabelle Dupont",
    context: "He's been passed over twice already. Morale is at an all-time low. Everyone is rooting for him.",
    votes: 88, yesRatio: 0.63, createdDaysAgo: 20, expiryDays: 25,
    up: 27, down: 3,
  },
  {
    question: "Will my manager approve my PTO request for Coachella?",
    creator: "Brandon Pierce",
    votes: 178, yesRatio: 0.28, createdDaysAgo: 18, expiryDays: -4,
    up: 41, down: 8, outcome: 'no', resolvedDaysAgo: 4,
  },
  {
    question: "Will anyone in the office actually use the standing desk after the ergonomics seminar?",
    creator: "Chloe Martin",
    votes: 215, yesRatio: 0.07, createdDaysAgo: 8, expiryDays: 22,
    up: 77, down: 4,
  },
  {
    question: "Is the company going to announce layoffs before end of Q3?",
    creator: "Samuel Osei",
    context: "They said the restructuring was 'complete' last quarter. Then they hired a new CFO. We all know what that means.",
    votes: 170, yesRatio: 0.58, createdDaysAgo: 15, expiryDays: 75,
    up: 52, down: 7,
  },
  {
    question: "Will I finish my thesis draft before my advisor stops responding to emails?",
    creator: "Anna Korhonen",
    votes: 92, yesRatio: 0.28, createdDaysAgo: 30, expiryDays: 30,
    up: 31, down: 4,
  },
  {
    question: "Will the IT department fix the office printer before we start photographing documents?",
    creator: "Tobias Bauer",
    votes: 118, yesRatio: 0.44, createdDaysAgo: 5, expiryDays: -1,
    up: 36, down: 3, outcome: 'no', resolvedDaysAgo: 1,
  },

  // ── FITNESS / HEALTH ──────────────────────────────────────────────────────
  {
    question: "Will I actually go to the gym 4 times this week without making excuses?",
    creator: "Darius Thompson",
    votes: 345, yesRatio: 0.16, createdDaysAgo: 4, expiryDays: -1,
    up: 89, down: 6, outcome: 'no', resolvedDaysAgo: 1,
  },
  {
    question: "Will Jordan complete the entire Whole30 challenge without cheating once?",
    creator: "Talia Reeves",
    context: "Jordan lasted 4 days last time. Has already identified 'emergency exceptions' for a birthday dinner and a work happy hour.",
    votes: 265, yesRatio: 0.17, createdDaysAgo: 3, expiryDays: 27,
    up: 82, down: 5,
  },
  {
    question: "Is anyone in our friend group still keeping their New Year's fitness resolution?",
    creator: "Leo Santos",
    votes: 450, yesRatio: 0.08, createdDaysAgo: 105, expiryDays: -15,
    up: 134, down: 3, outcome: 'no', resolvedDaysAgo: 15,
  },
  {
    question: "Will Marcus finish his first triathlon without stopping to walk the run?",
    creator: "Nadia Petrov",
    context: "He signed up on a dare and has been training for 6 weeks. The triathlon is in 3 weeks. I believe in him.",
    votes: 158, yesRatio: 0.76, createdDaysAgo: 15, expiryDays: 21,
    up: 45, down: 4,
  },
  {
    question: "Will Riley walk to work every day this week instead of ubering?",
    creator: "Cameron Obi",
    votes: 77, yesRatio: 0.35, createdDaysAgo: 3, expiryDays: -1,
    up: 19, down: 2, outcome: 'no', resolvedDaysAgo: 1,
  },
  {
    question: "Will the new 'green juice every morning' phase last more than 10 days?",
    creator: "Vanessa Laurent",
    votes: 148, yesRatio: 0.14, createdDaysAgo: 4, expiryDays: 6,
    up: 52, down: 3,
  },
  {
    question: "Will my dad finally listen to his doctor and cut back on salt?",
    creator: "Hiroshi Yamamoto",
    votes: 62, yesRatio: 0.24, createdDaysAgo: 7, expiryDays: 53,
    up: 21, down: 5,
  },

  // ── BAD HABITS ────────────────────────────────────────────────────────────
  {
    question: "Will I stop doom-scrolling past midnight every night this week?",
    creator: "Olivia Chen",
    context: "It's 2am right now and I'm making this prediction. This is fine. I'm fine.",
    votes: 501, yesRatio: 0.06, createdDaysAgo: 2, expiryDays: 5,
    up: 178, down: 2,
  },
  {
    question: "Will Jordan delete TikTok and actually keep it deleted for a full month?",
    creator: "Elijah Carter",
    context: "Third attempt this year. The longest streak so far was 11 days before he reinstalled it 'just to see one thing.'",
    votes: 384, yesRatio: 0.19, createdDaysAgo: 4, expiryDays: 26,
    up: 121, down: 4,
  },
  {
    question: "Is Kevin going to survive a full week without ordering DoorDash?",
    creator: "Sofia Rodrigues",
    context: "He spent $680 on DoorDash last month. He knows. He is ashamed. He is ordering DoorDash tonight.",
    votes: 295, yesRatio: 0.21, createdDaysAgo: 2, expiryDays: 5,
    up: 94, down: 3,
  },
  {
    question: "Will I stop checking my ex's Instagram stories for the rest of this month?",
    creator: "Harper Quinn",
    votes: 370, yesRatio: 0.12, createdDaysAgo: 6, expiryDays: 24,
    up: 131, down: 5,
  },
  {
    question: "Will Drew actually read any of the 47 books he bought and never opened?",
    creator: "Marcus Webb",
    context: "The books are organized by color on a shelf for aesthetics. They have never been touched. This is a decorative bookshelf.",
    votes: 160, yesRatio: 0.05, createdDaysAgo: 20, expiryDays: 40,
    up: 67, down: 2,
  },
  {
    question: "Will anyone at the party actually stick to 'just one drink'?",
    creator: "Aaliyah Brooks",
    votes: 238, yesRatio: 0.11, createdDaysAgo: 2, expiryDays: -1,
    up: 76, down: 4, outcome: 'no', resolvedDaysAgo: 0,
  },
  {
    question: "Will I go a full 7 days without buying overpriced coffee?",
    creator: "Finn O'Brien",
    context: "My banking app sent me a notification that I spent $214 at coffee shops in April. I am doing this.",
    votes: 178, yesRatio: 0.24, createdDaysAgo: 3, expiryDays: 4,
    up: 63, down: 3,
  },
  {
    question: "Will my roommate wake up before noon on any single weekday this month?",
    creator: "Kenji Tanaka",
    votes: 102, yesRatio: 0.29, createdDaysAgo: 13, expiryDays: -3,
    up: 37, down: 5, outcome: 'no', resolvedDaysAgo: 3,
  },

  // ── SOCIAL / RANDOM ───────────────────────────────────────────────────────
  {
    question: "Will the group chat stay dead or get resurrected within the next 7 days?",
    creator: "Priya Sharma",
    context: "Every 6 weeks someone posts a meme and 3 hours of absolute chaos follows. We're at day 41 of silence. I can feel it coming.",
    votes: 428, yesRatio: 0.82, createdDaysAgo: 9, expiryDays: -2,
    up: 143, down: 2, outcome: 'yes', resolvedDaysAgo: 2,
  },
  {
    question: "Will anyone actually show up on time for the 7pm dinner reservation?",
    creator: "Destiny Clarke",
    context: "8 people. 7pm reservation. History suggests we'll all be 'just leaving' at 7:15.",
    votes: 362, yesRatio: 0.13, createdDaysAgo: 2, expiryDays: -1,
    up: 97, down: 5, outcome: 'no', resolvedDaysAgo: 0,
  },
  {
    question: "Will we watch something new on Netflix or just rewatch The Office for the 8th time?",
    creator: "Lucas Ferreira",
    votes: 285, yesRatio: 0.21, createdDaysAgo: 2, expiryDays: -1,
    up: 84, down: 7, outcome: 'no', resolvedDaysAgo: 0,
  },
  {
    question: "Will the entire friend group make it to Vegas for the birthday trip with zero cancellations?",
    creator: "Zara Ahmed",
    context: "12 people committed. Flights booked. Three people have already texted to 'just check' about refund policies.",
    votes: 240, yesRatio: 0.22, createdDaysAgo: 30, expiryDays: 30,
    up: 71, down: 8,
  },
  {
    question: "Will someone actually finish the leftover birthday cake before it goes bad?",
    creator: "Noah Okonkwo",
    votes: 168, yesRatio: 0.86, createdDaysAgo: 2, expiryDays: 1,
    up: 43, down: 1, outcome: 'yes', resolvedDaysAgo: 0,
  },
  {
    question: "Is the holiday Secret Santa going to get awkward again this year?",
    creator: "Sienna Walsh",
    context: "Last year someone got their ex. The year before someone spent $200 when the limit was $30. Every single year.",
    votes: 148, yesRatio: 0.77, createdDaysAgo: 30, expiryDays: 60,
    up: 55, down: 4,
  },
  {
    question: "Will we all actually agree on a restaurant within 10 minutes for once?",
    creator: "Amara Diallo",
    votes: 290, yesRatio: 0.09, createdDaysAgo: 3, expiryDays: -1,
    up: 95, down: 6, outcome: 'no', resolvedDaysAgo: 1,
  },
  {
    question: "Will the neighborhood BBQ actually happen or get cancelled for the 3rd year in a row?",
    creator: "Tobias Bauer",
    votes: 88, yesRatio: 0.29, createdDaysAgo: 14, expiryDays: 16,
    up: 26, down: 3,
  },
  {
    question: "Will anyone remember to bring the aux cable to the road trip?",
    creator: "Cameron Obi",
    context: "Someone forgets every single time. We end up listening to one person's phone on speaker from the cupholder.",
    votes: 55, yesRatio: 0.38, createdDaysAgo: 3, expiryDays: 4,
    up: 17, down: 2,
  },
  {
    question: "Will I finally clean my room before someone comes over this weekend?",
    creator: "Harper Quinn",
    votes: 195, yesRatio: 0.33, createdDaysAgo: 2, expiryDays: 3,
    up: 58, down: 4,
  },

  // ── FINANCE / LIFE ────────────────────────────────────────────────────────
  {
    question: "Will I actually stick to my budget this month without any 'emergency' exceptions?",
    creator: "Ryan Kowalski",
    context: "Already bought a $60 candle. It's the 3rd. The month just started.",
    votes: 315, yesRatio: 0.14, createdDaysAgo: 4, expiryDays: 24,
    up: 89, down: 5,
  },
  {
    question: "Is Zach going to pay back the $40 before I have to bring it up myself?",
    creator: "Fatima Al-Hassan",
    context: "It's been 6 weeks. He's bought three rounds of drinks for other people since then. I am watching.",
    votes: 198, yesRatio: 0.17, createdDaysAgo: 49, expiryDays: -7,
    up: 74, down: 6, outcome: 'no', resolvedDaysAgo: 7,
  },
  {
    question: "Will my side hustle make more than $500 in the next 3 months?",
    creator: "Jorge Mendoza",
    votes: 145, yesRatio: 0.53, createdDaysAgo: 10, expiryDays: 80,
    up: 48, down: 7,
  },
  {
    question: "Will housing prices in my city actually drop before I give up on buying?",
    creator: "Yuki Nakamura",
    context: "I've been 'almost ready to buy' for 3 years. My realtor has stopped calling back.",
    votes: 382, yesRatio: 0.16, createdDaysAgo: 20, expiryDays: 160,
    up: 117, down: 9,
  },
  {
    question: "Will I spend under $100 on Uber Eats this month?",
    creator: "Anna Korhonen",
    context: "January: $340. February: $287. March: $412. Something is wrong with me.",
    votes: 296, yesRatio: 0.18, createdDaysAgo: 4, expiryDays: 24,
    up: 92, down: 4,
  },
  {
    question: "Is my crypto portfolio ever coming back to where it was?",
    creator: "Dmitri Volkov",
    context: "I'm down 78%. I have not told my partner. I check the app 40 times a day. Please vote yes.",
    votes: 463, yesRatio: 0.38, createdDaysAgo: 90, expiryDays: 275,
    up: 156, down: 8,
  },
  {
    question: "Will I actually use the gym membership I've been paying $45/month for since January?",
    creator: "Darius Thompson",
    context: "I have been 3 times. It's May.",
    votes: 340, yesRatio: 0.09, createdDaysAgo: 7, expiryDays: 23,
    up: 108, down: 3,
  },

  // ── GLOBAL EVENTS — GEOPOLITICS ───────────────────────────────────────────
  {
    question: "Will Ukraine and Russia reach a formal ceasefire agreement before January 2026?",
    creator: "PredictBot",
    context: "Ongoing mediation efforts by Turkey and the UAE. NATO has ruled out direct involvement but is funding reconstruction talks.",
    votes: 487, yesRatio: 0.28, createdDaysAgo: 30, expiryDays: 220,
    up: 189, down: 14,
  },
  {
    question: "Will NATO formally invite a new member state to join before the end of 2025?",
    creator: "PredictBot",
    context: "Georgia and Ukraine remain candidates. The 2025 Hague summit is the key decision point.",
    votes: 312, yesRatio: 0.41, createdDaysAgo: 20, expiryDays: 200,
    up: 97, down: 8,
  },
  {
    question: "Will the UN Security Council pass a binding resolution on Gaza before July 2025?",
    creator: "PredictBot",
    context: "US veto history makes this difficult. Current draft has 11 supporting votes.",
    votes: 274, yesRatio: 0.19, createdDaysAgo: 15, expiryDays: 45,
    up: 83, down: 11,
  },
  {
    question: "Will China's official GDP growth rate fall below 4.5% in 2025?",
    creator: "PredictBot",
    context: "Property sector stress, deflation risk, and youth unemployment remain key headwinds. IMF projects 4.2%.",
    votes: 395, yesRatio: 0.52, createdDaysAgo: 45, expiryDays: 230,
    up: 134, down: 9,
  },

  // ── GLOBAL EVENTS — ECONOMY & FINANCE ────────────────────────────────────
  {
    question: "Will the US Federal Reserve cut rates by a cumulative 100+ basis points before December 2025?",
    creator: "PredictBot",
    context: "Current fed funds rate: 4.25-4.5%. Markets pricing in 3 cuts. Inflation at 2.4% and declining.",
    votes: 543, yesRatio: 0.47, createdDaysAgo: 25, expiryDays: 195,
    up: 201, down: 12,
  },
  {
    question: "Will Bitcoin's price exceed $150,000 at any point in 2025?",
    creator: "PredictBot",
    context: "Post-halving supply shock, ETF inflows, and institutional adoption driving demand. Previous cycle peak was $69K.",
    votes: 602, yesRatio: 0.58, createdDaysAgo: 60, expiryDays: 240,
    up: 223, down: 18,
  },
  {
    question: "Will the S&P 500 close above 6,500 at least once before end of 2025?",
    creator: "PredictBot",
    context: "AI earnings tailwind, resilient labor market, Fed pivot narrative supporting equities.",
    votes: 448, yesRatio: 0.63, createdDaysAgo: 35, expiryDays: 210,
    up: 167, down: 7,
  },
  {
    question: "Will global EV sales exceed 20% of total new car sales in 2025?",
    creator: "PredictBot",
    context: "2024 share was 17.4%. China is already at 40%+ but drags up the global figure. Europe subsidies reinstated.",
    votes: 367, yesRatio: 0.61, createdDaysAgo: 28, expiryDays: 230,
    up: 129, down: 6,
  },

  // ── GLOBAL EVENTS — AI & TECHNOLOGY ──────────────────────────────────────
  {
    question: "Will any AI model score above 90% on the ARC-AGI benchmark by end of 2025?",
    creator: "PredictBot",
    context: "Current SOTA is ~75%. OpenAI o3 scored 87.5% in informal tests. The benchmark tests novel reasoning.",
    votes: 489, yesRatio: 0.54, createdDaysAgo: 18, expiryDays: 215,
    up: 187, down: 10,
  },
  {
    question: "Will the EU enforce its first major AI Act fine (€1M+) before end of 2025?",
    creator: "PredictBot",
    context: "AI Act entered into force August 2024. High-risk AI system rules apply from August 2026 — but prohibited practices rules already apply.",
    votes: 298, yesRatio: 0.38, createdDaysAgo: 22, expiryDays: 205,
    up: 108, down: 9,
  },
  {
    question: "Will Nvidia's market cap surpass $4 trillion before end of 2025?",
    creator: "PredictBot",
    context: "Current market cap ~$3.3T. Blackwell GPU demand remains constrained by supply. H2 2025 delivery ramp is key.",
    votes: 421, yesRatio: 0.44, createdDaysAgo: 12, expiryDays: 225,
    up: 153, down: 8,
  },
  {
    question: "Will Apple release a generative AI feature that meaningfully changes iPhone usage patterns in 2025?",
    creator: "PredictBot",
    context: "Apple Intelligence launched with underwhelming reviews. WWDC 2025 is the next major reveal.",
    votes: 356, yesRatio: 0.49, createdDaysAgo: 20, expiryDays: 180,
    up: 118, down: 7,
  },

  // ── GLOBAL EVENTS — CLIMATE & SCIENCE ────────────────────────────────────
  {
    question: "Will 2025 set a new annual global average temperature record?",
    creator: "PredictBot",
    context: "2024 was the hottest year on record at 1.5°C above pre-industrial average. La Niña cooling expected in 2025.",
    votes: 534, yesRatio: 0.62, createdDaysAgo: 40, expiryDays: 240,
    up: 195, down: 11,
  },
  {
    question: "Will SpaceX successfully land a Starship with humans on the Moon before 2027?",
    creator: "PredictBot",
    context: "NASA Artemis III is targeting 2027. Starship uncrewed lunar landing test required first. Five Starship flights completed.",
    votes: 467, yesRatio: 0.33, createdDaysAgo: 55, expiryDays: 700,
    up: 172, down: 13,
  },

  // ── GLOBAL EVENTS — POLITICS ──────────────────────────────────────────────
  {
    question: "Will the 2026 US midterm elections flip control of the Senate to Democrats?",
    creator: "PredictBot",
    context: "34 Senate seats up. Republicans defending 22. Polling shows tight races in Arizona, Nevada, Maine.",
    votes: 512, yesRatio: 0.46, createdDaysAgo: 50, expiryDays: 390,
    up: 184, down: 15,
  },
  {
    question: "Will France hold a snap election before the end of 2025?",
    creator: "PredictBot",
    context: "Macron's coalition holds a fragile majority. Marine Le Pen's trial verdict could trigger a constitutional crisis.",
    votes: 278, yesRatio: 0.35, createdDaysAgo: 8, expiryDays: 200,
    up: 91, down: 6,
  },

  // ── GLOBAL EVENTS — CULTURE ───────────────────────────────────────────────
  {
    question: "Will a non-English-language film win Best Picture at the 2026 Oscars?",
    creator: "PredictBot",
    context: "CODA (2022) and Parasite (2020) broke the pattern. Global streaming platforms financing more international award contenders.",
    votes: 334, yesRatio: 0.31, createdDaysAgo: 30, expiryDays: 310,
    up: 112, down: 7,
  },
  {
    question: "Will the 2026 FIFA World Cup be won by a team outside Europe or South America?",
    creator: "PredictBot",
    context: "US, Canada, Mexico co-host. African and Asian teams have never won. Morocco 2022 was a watershed semifinal run.",
    votes: 445, yesRatio: 0.17, createdDaysAgo: 45, expiryDays: 400,
    up: 158, down: 10,
  },
  {
    question: "Will any country fully ban TikTok at the federal level before end of 2025?",
    creator: "PredictBot",
    context: "US ban law signed but implementation blocked by courts. India already banned it in 2020. EU investigating.",
    votes: 389, yesRatio: 0.42, createdDaysAgo: 35, expiryDays: 215,
    up: 143, down: 9,
  },
]

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱  Seeding PredictMate with ${DEFS.length} markets (personal life + global events)...\n`)

  // Clear old demo data
  process.stdout.write('  Clearing old data... ')
  await kv.del('markets:index')
  const demoKeys = Array.from({ length: 12 }, (_, i) => `market:demo${(i + 1).toString().padStart(2, '0')}`)
  for (const k of demoKeys) await kv.del(k)
  console.log('done\n')

  const marketIds: string[] = []
  let totalVotes = 0

  for (let i = 0; i < DEFS.length; i++) {
    const d = DEFS[i]
    const id = `s${(i + 1).toString().padStart(3, '0')}`
    const createdAt = NOW - d.createdDaysAgo * DAY
    const expiresAt = NOW + d.expiryDays * DAY
    const voteEnd = Math.min(expiresAt, NOW)

    const votes = makeVotes(d.votes, d.yesRatio, createdAt, voteEnd)
    const up = d.up ?? Math.floor(Math.random() * 30) + 5
    const down = d.down ?? Math.floor(Math.random() * 10) + 1

    const market: Market = {
      id,
      question: d.question,
      creatorName: d.creator,
      ...(d.context ? { context: d.context } : {}),
      expiresAt,
      votes,
      upvoters: makeUpvoterIds(up),
      downvoters: makeUpvoterIds(down),
      createdAt,
      ...(d.outcome
        ? {
            outcome: d.outcome,
            resolvedAt: d.resolvedDaysAgo !== undefined ? NOW - d.resolvedDaysAgo * DAY : NOW,
          }
        : {}),
    }

    await kv.set(`market:${id}`, market)
    marketIds.push(id)
    totalVotes += votes.length

    const bar = '█'.repeat(Math.round((votes.length / 501) * 20)).padEnd(20)
    const yes = Math.round((votes.filter(v => v.side === 'yes').length / votes.length) * 100)
    process.stdout.write(
      `  [${String(i + 1).padStart(2)}/${DEFS.length}] ${id}  ${bar}  ${String(votes.length).padStart(3)} votes  ${String(yes).padStart(3)}% YES  ${d.question.slice(0, 45)}\n`,
    )
  }

  // Rebuild index — lpush adds to front, so reverse to keep creation order (newest last = s050 at front)
  await kv.lpush('markets:index', ...[...marketIds].reverse())

  console.log(`\n✅  Done!`)
  console.log(`   Markets : ${DEFS.length}`)
  console.log(`   Votes   : ${totalVotes.toLocaleString()}`)
  console.log(`   Users   : ${USERS.length}`)
  console.log()
  process.exit(0)
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1) })

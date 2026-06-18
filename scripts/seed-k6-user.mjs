import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const POOL_SIZE = parseInt(process.env.K6_POOL_SIZE || "100", 10);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// pgcrypto: one bcrypt hash, reused for all test users (same password)
await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
const { rows: [{ hash }] } = await pool.query(
  "SELECT crypt($1, gen_salt('bf', 10)) AS hash",
  ["K6TestUser123!"]
);

const characterData = (idx) => ({
  edition: "2014",
  mode: "player",
  identity: {
    name: `K6 Stress Tester ${idx}`,
    race: "Human", subrace: "", background: "Soldier", deity: "",
    alignment: "True Neutral", level: 10,
    classes: [{ classId: null, name: "Fighter", subclass: "", subclassId: null, level: 10, hitDie: "d10", ignoreAutomation: false }],
    classLabels: "Fighter",
  },
  attributes: {
    str: { base: 18, stack: [], override: null }, dex: { base: 14, stack: [], override: null },
    con: { base: 16, stack: [], override: null }, int: { base: 10, stack: [], override: null },
    wis: { base: 12, stack: [], override: null }, cha: { base: 8,  stack: [], override: null },
  },
  combat: {
    ac:         { base: 18, stack: [], override: null },
    initiative: { stack: [], override: null },
    speed:      { base: 30, stack: [], override: null },
    hp:         { max: 94, current: 94, temp: 0 },
  },
  saves: {
    str: { proficient: true,  stack: [], override: null }, dex: { proficient: false, stack: [], override: null },
    con: { proficient: true,  stack: [], override: null }, int: { proficient: false, stack: [], override: null },
    wis: { proficient: false, stack: [], override: null }, cha: { proficient: false, stack: [], override: null },
  },
  skills: {
    athletics:     { state: "proficient", stack: [], override: null },
    acrobatics:    { state: "none",       stack: [], override: null },
    sleightOfHand: { state: "none",       stack: [], override: null },
    stealth:       { state: "none",       stack: [], override: null },
    arcana:        { state: "none",       stack: [], override: null },
    history:       { state: "none",       stack: [], override: null },
    investigation: { state: "none",       stack: [], override: null },
    nature:        { state: "none",       stack: [], override: null },
    religion:      { state: "none",       stack: [], override: null },
    animalHandling:{ state: "none",       stack: [], override: null },
    insight:       { state: "none",       stack: [], override: null },
    medicine:      { state: "none",       stack: [], override: null },
    perception:    { state: "proficient", stack: [], override: null },
    survival:      { state: "none",       stack: [], override: null },
    deception:     { state: "none",       stack: [], override: null },
    intimidation:  { state: "proficient", stack: [], override: null },
    performance:   { state: "none",       stack: [], override: null },
    persuasion:    { state: "none",       stack: [], override: null },
  },
  inventory: [
    { id: "inv-01", name: "Longsword",       quantity: 1,   weight: 3,   category: "Weapon",     equipped: true,  modifiers: [], sourceId: null },
    { id: "inv-02", name: "Shield",          quantity: 1,   weight: 6,   category: "Armor",      equipped: true,  modifiers: [], sourceId: null },
    { id: "inv-03", name: "Plate Armor",     quantity: 1,   weight: 65,  category: "Armor",      equipped: true,  modifiers: [], sourceId: null },
    { id: "inv-04", name: "Handaxe",         quantity: 2,   weight: 2,   category: "Weapon",     equipped: false, modifiers: [], sourceId: null },
    { id: "inv-05", name: "Explorer's Pack", quantity: 1,   weight: 59,  category: "Mundane",    equipped: false, modifiers: [], sourceId: null },
    { id: "inv-06", name: "Rope (50ft)",     quantity: 1,   weight: 10,  category: "Mundane",    equipped: false, modifiers: [], sourceId: null },
    { id: "inv-07", name: "Healing Potion",  quantity: 4,   weight: 0.5, category: "Consumable", equipped: false, modifiers: [], sourceId: null },
    { id: "inv-08", name: "Torch",           quantity: 10,  weight: 1,   category: "Mundane",    equipped: false, modifiers: [], sourceId: null },
    { id: "inv-09", name: "Rations (1 day)", quantity: 5,   weight: 2,   category: "Mundane",    equipped: false, modifiers: [], sourceId: null },
    { id: "inv-10", name: "Gold Pieces",     quantity: 150, weight: 0,   category: "Currency",   equipped: false, modifiers: [], sourceId: null },
  ],
  actions: [
    { id: "act-01", name: "Longsword",        type: "MeleeWeapon",  attackStat: "str", damageStack: [{ dice: "1d8", type: "Slashing", stat: "str" }], description: "A versatile melee weapon.", sourceId: null },
    { id: "act-02", name: "Handaxe (thrown)", type: "RangedWeapon", attackStat: "str", damageStack: [{ dice: "1d6", type: "Slashing", stat: "str" }], description: "Thrown 20/60 ft.", sourceId: null },
    { id: "act-03", name: "Second Wind",      type: "Feature", attackStat: null, damageStack: [], description: "Regain 1d10 + fighter level HP as a bonus action.", sourceId: null },
    { id: "act-04", name: "Action Surge",     type: "Feature", attackStat: null, damageStack: [], description: "Take one additional action on your turn.", sourceId: null },
    { id: "act-05", name: "Indomitable",      type: "Feature", attackStat: null, damageStack: [], description: "Reroll a saving throw you fail. Must use the new result.", sourceId: null },
  ],
  features: [
    { id: "feat-01", name: "Fighting Style: Defense",   description: "+1 AC while wearing armor.", sourceId: null },
    { id: "feat-02", name: "Extra Attack",              description: "Attack twice instead of once when you take the Attack action.", sourceId: null },
    { id: "feat-03", name: "Martial Archetype: Champion", description: "Improved Critical — attacks score a critical hit on a 19 or 20.", sourceId: null },
    { id: "feat-04", name: "Improved Critical",         description: "Your weapon attacks score a critical hit on a roll of 19 or 20.", sourceId: null },
    { id: "feat-05", name: "Remarkable Athlete",        description: "Add half your proficiency bonus to Strength, Dexterity, or Constitution checks that don't already use your proficiency bonus.", sourceId: null },
    { id: "feat-06", name: "Additional Fighting Style", description: "At 10th level, you can choose a second option from the Fighting Style class feature.", sourceId: null },
    { id: "feat-07", name: "Military Rank",             description: "Soldiers loyal to your former military organization still recognize your authority and defer to you if they are of a lower rank.", sourceId: null },
  ],
  spells: {
    globalCastingStat: null, attackStack: [], dcStack: [],
    slots: { 1:{base:0,used:0},2:{base:0,used:0},3:{base:0,used:0},4:{base:0,used:0},5:{base:0,used:0},6:{base:0,used:0},7:{base:0,used:0},8:{base:0,used:0},9:{base:0,used:0} },
    list: [],
  },
  trackers: [
    { id: "trk-01", name: "Hit Dice (d10)", current: 10, max: 10, color: "default" },
    { id: "trk-02", name: "Second Wind",   current: 1,  max: 1,  color: "default" },
    { id: "trk-03", name: "Action Surge",  current: 1,  max: 1,  color: "default" },
    { id: "trk-04", name: "Indomitable",   current: 2,  max: 2,  color: "default" },
  ],
  otherProficiencies: [
    { id: "prof-01", name: "All armor",      category: "Armor",    training: "Proficient", stat: null, override: null, sourceId: null },
    { id: "prof-02", name: "Shields",        category: "Armor",    training: "Proficient", stat: null, override: null, sourceId: null },
    { id: "prof-03", name: "Simple weapons", category: "Weapon",   training: "Proficient", stat: null, override: null, sourceId: null },
    { id: "prof-04", name: "Martial weapons",category: "Weapon",   training: "Proficient", stat: null, override: null, sourceId: null },
    { id: "prof-05", name: "Common",         category: "Language", training: "Proficient", stat: null, override: null, sourceId: null },
  ],
  passivePerception: { stack: [], override: null },
  saveGlobalStack: [], skillGlobalStack: [],
  jackOfAllTrades: false, jackOfAllTradesSaves: false,
  statBoxes: [],
  characteristics: { personalityTraits: "I face problems head-on.", ideals: "Responsibility.", bonds: "Those who served with me.", flaws: "I made a terrible mistake that haunts me." },
  bio: { appearance: "Tall and broad-shouldered with battle scars.", backstory: "A veteran of many campaigns.", allies: "My old regiment.", organizations: "The Iron Circle mercenary company." },
  canvas: { pages: [{ id: "page-01", cols: 3, widgets: [] }] },
  automationKeys: {},
  selectionIgnores: { race: false, background: false },
  dismissedClassChoiceKeys: [], dismissedRaceChoiceKeys: [],
  dismissedEquipmentChoiceKeys: [], dismissedBackgroundChoiceKeys: [],
  portraitImage: null, classChoices: [], raceChoices: [], backgroundChoices: [],
  languageChoices: [], toolChoices: [], equipmentChoicesMade: [],
});

console.log(`Seeding ${POOL_SIZE} k6 test users and characters...`);

for (let i = 1; i <= POOL_SIZE; i++) {
  const idx    = String(i).padStart(3, "0");
  const email  = `k6_${idx}@stress.test`;
  const uname  = `k6user_${idx}`;
  const charId = `k6-char-${idx}`;

  const { rows: [{ id: userId }] } = await pool.query(
    `INSERT INTO users (id, email, username, name, password_hash, role, email_verified, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, 'user', NOW(), NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET email_verified = NOW(), password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [email, uname, uname, hash]
  );

  await pool.query(
    `INSERT INTO characters (id, user_id, name, auto_save, data, created_at, updated_at)
     VALUES ($1, $2, $3, true, $4::jsonb, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [charId, userId, `K6 Stress Tester ${idx}`, JSON.stringify(characterData(idx))]
  );

  if (i % 10 === 0) process.stdout.write(`  ${i}/${POOL_SIZE}\n`);
}

await pool.end();

console.log(`Done. Pool of ${POOL_SIZE} users ready.`);
console.log(`  Username pattern : k6user_001 … k6user_${String(POOL_SIZE).padStart(3, "0")}`);
console.log(`  Password         : K6TestUser123!`);
console.log(`  Character IDs    : k6-char-001 … k6-char-${String(POOL_SIZE).padStart(3, "0")}`);

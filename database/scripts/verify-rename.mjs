import { createClient } from "@libsql/client";

const client = createClient({ url: "file:dev.db" });

// Check migrations table
const mig = await client.execute("SELECT * FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 5");
console.log("Recent migrations:");
mig.rows.forEach((r) => console.log(" -", r.hash, r.created_at));

// Check specific crossbow items
const cross = await client.execute(
  "SELECT id, name FROM items WHERE name LIKE '%crossbow%' OR name LIKE '%Crossbow%'"
);
console.log("\nCrossbow items:");
cross.rows.forEach((r) => console.log(" ", r.id, "|", r.name));

// Count renamed vs remaining
const renamed = await client.execute(
  "SELECT COUNT(*) as n FROM items WHERE name LIKE '% - %'"
);
const remaining = await client.execute(
  "SELECT COUNT(*) as n FROM items WHERE name LIKE '%,%'"
);
console.log("\nRenamed items (has ' - '):", renamed.rows[0].n);
console.log("Remaining comma items:", remaining.rows[0].n);

// Show remaining
const rem = await client.execute(
  "SELECT name FROM items WHERE name LIKE '%,%' ORDER BY name LIMIT 40"
);
rem.rows.forEach((r) => console.log(" ,", r.name));

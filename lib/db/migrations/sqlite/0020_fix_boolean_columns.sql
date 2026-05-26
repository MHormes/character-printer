-- Fix boolean columns stored as "t"/"f" text by libsql — convert to integers
UPDATE items SET ac_dex_bonus = 1 WHERE ac_dex_bonus = 't';
UPDATE items SET ac_dex_bonus = 0 WHERE ac_dex_bonus = 'f';
UPDATE items SET stealth_disadvantage = 1 WHERE stealth_disadvantage = 't';
UPDATE items SET stealth_disadvantage = 0 WHERE stealth_disadvantage = 'f';

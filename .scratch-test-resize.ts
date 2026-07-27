import { slimAttacksSvgH, slimAttacksHasWrap } from "./components/canvas/widgets/slim-attacks-widget";
import { roundForWrap } from "./lib/canvas/widget-heights";

const cols = 28, rows = 40, w = 9;

function ideal(actions: any[]) {
  const raw = (slimAttacksSvgH(actions) * w * rows * 210) / (cols * 297 * 176);
  return Math.max(2, roundForWrap(raw, slimAttacksHasWrap(actions)));
}

const base = [
  { id: "1", name: "Longsword", damageStack: [{ diceCount: 1, dieType: "d8", stat: "str", flatBonus: 0, type: "Slashing", active: true, orGroup: null }] },
  { id: "2", name: "Shortbow", damageStack: [{ diceCount: 1, dieType: "d6", stat: "dex", flatBonus: 0, type: "Piercing", active: true, orGroup: null }] },
  { id: "3", name: "Dagger", damageStack: [{ diceCount: 1, dieType: "d4", stat: "dex", flatBonus: 0, type: "Piercing", active: true, orGroup: null }] },
] as any;

console.log("before wrap, ideal h =", ideal(base));

const withWrap = base.map((a: any, i: number) =>
  i === 2
    ? { ...a, damageStack: [...a.damageStack, { diceCount: 2, dieType: "d6", stat: null, flatBonus: 0, type: "Poison", active: true, orGroup: null }] }
    : a
);
console.log("after wrap,  ideal h =", ideal(withWrap));

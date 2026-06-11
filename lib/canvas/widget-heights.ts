import { slimToolSvgH } from "@/components/canvas/widgets/slim-tool-prof-widget";
import { slimOtherSvgH } from "@/components/canvas/widgets/slim-other-prof-widget";
import { attacksSvgH } from "@/components/canvas/widgets/attacks-widget";
import { slimAttacksSvgH } from "@/components/canvas/widgets/slim-attacks-widget";
import { equipmentSvgH } from "@/components/canvas/widgets/equipment-widget";
import { trackerSvgH } from "@/components/canvas/widgets/tracker-widget";
import { featuresSvgH } from "@/components/canvas/widgets/features-widget";
import { characteristicsSvgH } from "@/components/canvas/widgets/characteristics-widget";
import { bioTextSvgH } from "@/components/canvas/widgets/bio-text-widget";
import { featureCardGridH } from "@/components/canvas/widgets/feature-card-widget";
import { spellLevelSvgH } from "@/components/canvas/widgets/spell-level-widget";
import { otherProfSvgH } from "@/components/canvas/widgets/other-proficiencies-widget";
import { toolProfSvgH } from "@/components/canvas/widgets/tool-proficiencies-widget";
import { characteristicCardSvgH } from "@/components/canvas/widgets/characteristic-card-widget";
import type { CanvasWidget } from "@/lib/types/canvas";
import type { CharacterData } from "@/lib/types/character";

export function computeIdealWidgetH(
  widget: CanvasWidget,
  character: CharacterData | null,
  cols: number,
  rows: number,
): number | null {
  const toolCount = character?.otherProficiencies.filter((p) => p.category === "Tool").length ?? 0;
  const otherCount = character?.otherProficiencies.filter((p) => p.category !== "Tool").length ?? 0;
  const actionsCount = character?.actions.length ?? 0;
  const inventoryCount = character?.inventory.length ?? 0;
  const trackersCount = character?.trackers.length ?? 0;
  const featuresCount = character?.features.length ?? 0;

  switch (widget.type) {
    case "ToolProficiencies":
      return Math.max(2, Math.round((toolProfSvgH(toolCount) * widget.w * rows * 210) / (cols * 297 * 164)));
    case "OtherProficiencies":
      return Math.max(2, Math.round((otherProfSvgH(otherCount) * widget.w * rows * 210) / (cols * 297 * 185)));
    case "SlimToolProf":
      return Math.max(2, Math.round((slimToolSvgH(toolCount) * widget.w * rows * 210) / (cols * 297 * 164)));
    case "SlimOtherProf":
      return Math.max(2, Math.round((slimOtherSvgH(otherCount) * widget.w * rows * 210) / (cols * 297 * 185)));
    case "Attacks":
      return Math.max(2, Math.round((attacksSvgH(actionsCount) * widget.w * rows * 210) / (cols * 297 * 176)));
    case "SlimAttacks":
      return Math.max(2, Math.round((slimAttacksSvgH(actionsCount) * widget.w * rows * 210) / (cols * 297 * 176)));
    case "Equipment":
      return Math.max(4, Math.round((equipmentSvgH(inventoryCount) * widget.w * rows * 210) / (cols * 297 * 132)));
    case "Trackers":
      return Math.max(
        trackersCount <= 2 ? 4 : 2,
        Math.round((trackerSvgH(trackersCount) * widget.w * rows * 210) / (cols * 297 * 171)),
      );
    case "Features":
      return Math.max(2, Math.round((featuresSvgH(featuresCount) * widget.w * rows * 210) / (cols * 297 * 96)));
    case "Characteristics":
      return Math.max(
        4,
        Math.round((characteristicsSvgH(character?.characteristics) * widget.w * rows * 210) / (cols * 297 * 96)),
      );
    case "SpellLevel0":
    case "SpellLevel1":
    case "SpellLevel2":
    case "SpellLevel3":
    case "SpellLevel4":
    case "SpellLevel5":
    case "SpellLevel6":
    case "SpellLevel7":
    case "SpellLevel8":
    case "SpellLevel9": {
      const level = parseInt(widget.type.replace("SpellLevel", ""), 10);
      const count = character?.spells.list.filter((s) => s.level === level).length ?? 0;
      return Math.max(
        count > 0 ? 3 : 2,
        Math.round((spellLevelSvgH(count) * widget.w * rows * 210) / (cols * 297 * 120)),
      );
    }
    case "FeatureCard": {
      const feature = character?.features.find((f) => f.id === widget.featureId);
      if (!feature) return null;
      return Math.min(rows, featureCardGridH(feature.description, widget.w, cols, rows));
    }
    case "CharacteristicCard": {
      if (!widget.textSource) return null;
      const text = (character?.characteristics as Record<string, string> | undefined)?.[widget.textSource] ?? "";
      return Math.min(
        rows,
        Math.max(2, Math.round((characteristicCardSvgH(text) * widget.w * rows * 210) / (cols * 297 * 96))),
      );
    }
    case "BioText": {
      if (!widget.textSource) return null;
      const text = (character?.bio as Record<string, string> | undefined)?.[widget.textSource] ?? "";
      return Math.min(
        rows,
        Math.max(3, Math.round((bioTextSvgH(text) * widget.w * rows * 210) / (cols * 297 * 96))),
      );
    }
    default:
      return null;
  }
}

import { motion } from "motion/react";
import type { BuildConfig, ScentStrength } from "@/data/types";
import {
  DRIZZLES,
  SCENTS,
  SCENT_FAMILIES,
  TOPPINGS,
  VESSELS,
  WHIP_COLORS,
} from "@/data/ingredients";
import { toppingLoad, validWaxColors } from "@/data/build";
import { SelectTile } from "@/components/ui/SelectTile";
import { Chip } from "@/components/ui/Chip";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import type { StepId } from "./useCandleBuild";

interface StepProps {
  config: BuildConfig;
  update: (patch: Partial<BuildConfig>) => void;
}

export function StepContent({ step, ...p }: StepProps & { step: StepId }) {
  switch (step) {
    case "vessel":
      return <VesselStep {...p} />;
    case "wax":
      return <WaxStep {...p} />;
    case "scent":
      return <ScentStep {...p} />;
    case "whip":
      return <WhipStep {...p} />;
    case "drizzle":
      return <DrizzleStep {...p} />;
    case "toppings":
      return <ToppingsStep {...p} />;
    case "finish":
      return <FinishStep {...p} />;
  }
}

function StepHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-2xl text-espresso">{title}</h3>
      <p className="mt-0.5 text-sm text-muted">{hint}</p>
    </div>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span
      className="mb-2 block h-9 w-9 rounded-full border border-white/60 shadow-inner"
      style={{ backgroundColor: hex }}
    />
  );
}

function VesselStep({ config, update }: StepProps) {
  return (
    <div>
      <StepHeading title="Choose your vessel" hint="The shape it's poured into." />
      <div className="grid grid-cols-2 gap-3">
        {VESSELS.map((v) => (
          <SelectTile
            key={v.id}
            groupId="vessel-sel"
            selected={config.vesselId === v.id}
            onSelect={() => update({ vesselId: v.id })}
            ariaLabel={v.name}
          >
            <span className="block font-display text-base text-espresso">{v.name}</span>
            <span className="label-caps !text-[0.55rem]">
              {v.gel ? "Gel · drink" : "Soy blend"}
            </span>
          </SelectTile>
        ))}
      </div>
    </div>
  );
}

function WaxStep({ config, update }: StepProps) {
  const colors = validWaxColors(config.vesselId);
  return (
    <div>
      <StepHeading title="Pour the wax" hint="Tint the base — the photos bring the warmth." />
      <div className="grid grid-cols-3 gap-3">
        {colors.map((w) => (
          <SelectTile
            key={w.id}
            groupId="wax-sel"
            selected={config.waxColorId === w.id}
            onSelect={() => update({ waxColorId: w.id })}
            ariaLabel={w.name}
          >
            <Swatch hex={w.hex} />
            <span className="text-xs text-cocoa">{w.name}</span>
          </SelectTile>
        ))}
      </div>
    </div>
  );
}

const STRENGTHS: ScentStrength[] = ["light", "medium", "strong"];

/* Color-coded scent families — makes the invisible legible & premium. */
const FAMILY_META: Record<string, { hex: string; note: string }> = {
  Dessert: { hex: "#D99FA6", note: "sweet, whipped, indulgent" },
  Bakery: { hex: "#C89B62", note: "warm, fresh-baked" },
  Fruity: { hex: "#E0904B", note: "bright & juicy" },
  Fresh: { hex: "#9CC3B0", note: "clean & airy" },
  Woody: { hex: "#8A5A33", note: "smooth & grounding" },
  Boozy: { hex: "#7A1F3D", note: "bold & spirited" },
};

function ScentStep({ config, update }: StepProps) {
  const selected = config.scents.map((s) => s.scentId);

  function toggle(id: string) {
    const has = selected.includes(id);
    let next = has ? selected.filter((s) => s !== id) : [...selected, id].slice(0, 3);
    if (next.length === 0) next = [id]; // always keep at least one
    const ratio = Math.round(100 / next.length);
    update({ scents: next.map((scentId) => ({ scentId, ratio })) });
  }

  return (
    <div>
      <StepHeading title="Layer the scent" hint="Blend up to three. Set the strength." />

      <div className="mb-5">
        <span className="label-caps">Strength</span>
        <div className="mt-2 flex gap-2">
          {STRENGTHS.map((s) => (
            <Chip
              key={s}
              active={config.strength === s}
              onClick={() => update({ strength: s })}
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>

      {SCENT_FAMILIES.map((fam) => {
        const inFam = SCENTS.filter((s) => s.family === fam);
        if (inFam.length === 0) return null;
        const meta = FAMILY_META[fam];
        return (
          <div key={fam} className="mb-4">
            <div className="flex items-baseline gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-full"
                style={{ background: meta?.hex }}
                aria-hidden
              />
              <span className="label-caps">{fam}</span>
              {meta && (
                <span className="text-[0.65rem] lowercase tracking-normal text-muted">
                  · {meta.note}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {inFam.map((s) => (
                <Chip
                  key={s.id}
                  active={selected.includes(s.id)}
                  disabled={!selected.includes(s.id) && selected.length >= 3}
                  onClick={() => toggle(s.id)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
      {selected.length >= 2 && (
        <p className="mt-1 text-xs text-rose">A custom blend — beautifully you.</p>
      )}
    </div>
  );
}

function WhipStep({ config, update }: StepProps) {
  return (
    <div>
      <StepHeading title="Pipe the whip" hint="Whipped 'ice cream' on top — or skip it." />
      <div className="grid grid-cols-3 gap-3">
        <SelectTile
          groupId="whip-sel"
          selected={!config.whipId}
          onSelect={() => update({ whipId: null })}
          ariaLabel="No whip"
        >
          <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border hairline text-muted">
            ∅
          </span>
          <span className="text-xs text-cocoa">None</span>
        </SelectTile>
        {WHIP_COLORS.map((w) => (
          <SelectTile
            key={w.id}
            groupId="whip-sel"
            selected={config.whipId === w.id}
            onSelect={() => update({ whipId: w.id })}
            ariaLabel={w.name}
          >
            <Swatch hex={w.hex} />
            <span className="text-xs text-cocoa">{w.name}</span>
          </SelectTile>
        ))}
      </div>
    </div>
  );
}

function DrizzleStep({ config, update }: StepProps) {
  return (
    <div>
      <StepHeading title="Add a drizzle" hint="Glossy ribbons over the top." />
      <div className="grid grid-cols-3 gap-3">
        <SelectTile
          groupId="drizzle-sel"
          selected={!config.drizzleId}
          onSelect={() => update({ drizzleId: null })}
          ariaLabel="No drizzle"
        >
          <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border hairline text-muted">
            ∅
          </span>
          <span className="text-xs text-cocoa">None</span>
        </SelectTile>
        {DRIZZLES.map((d) => (
          <SelectTile
            key={d.id}
            groupId="drizzle-sel"
            selected={config.drizzleId === d.id}
            onSelect={() => update({ drizzleId: d.id })}
            ariaLabel={d.name}
          >
            <Swatch hex={d.hex} />
            <span className="text-xs text-cocoa">{d.name}</span>
          </SelectTile>
        ))}
      </div>
    </div>
  );
}

function ToppingsStep({ config, update }: StepProps) {
  const load = toppingLoad(config);

  function toggle(id: string) {
    const has = config.toppingIds.includes(id);
    if (!has && load.full) {
      haptic([6, 30, 6]); // gentle "that's plenty" buzz
      return;
    }
    update({
      toppingIds: has
        ? config.toppingIds.filter((t) => t !== id)
        : [...config.toppingIds, id],
    });
  }

  return (
    <div>
      <StepHeading
        title="Finish with toppings"
        hint={load.full ? "Looking delicious — that's a full one!" : "Tap to drop them on."}
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {TOPPINGS.map((t) => {
          const on = config.toppingIds.includes(t.id);
          const locked = !on && load.full;
          return (
            <SelectTile
              key={t.id}
              groupId={`top-${t.id}`}
              selected={on}
              disabled={locked}
              onSelect={() => toggle(t.id)}
              ariaLabel={t.name}
            >
              <Swatch hex={t.hex} />
              <span className="text-xs text-cocoa">{t.name}</span>
              <span className="ml-1 text-[0.6rem] text-muted">+${t.price}</span>
            </SelectTile>
          );
        })}
      </div>
    </div>
  );
}

function FinishStep({ config, update }: StepProps) {
  return (
    <div>
      <StepHeading title="The finishing touch" hint="Name it, choose a wick, wrap it up." />

      <label className="mb-5 block">
        <span className="label-caps">Name your candle</span>
        <input
          type="text"
          value={config.name}
          maxLength={40}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Sunday Morning"
          className="mt-2 w-full rounded-2xl border hairline bg-porcelain/70 px-4 py-3 font-serif text-lg text-espresso outline-none focus:border-gold"
        />
      </label>

      <div className="mb-5">
        <span className="label-caps">Wick</span>
        <div className="mt-2 flex gap-2">
          <Chip active={config.wick === "cotton"} onClick={() => update({ wick: "cotton" })}>
            Cotton · silent
          </Chip>
          <Chip active={config.wick === "wood"} onClick={() => update({ wick: "wood" })}>
            Wood · crackle +$1.50
          </Chip>
        </div>
      </div>

      <button
        type="button"
        onClick={() => update({ giftBox: !config.giftBox })}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
          config.giftBox ? "border-gold bg-blush-soft/40" : "hairline bg-porcelain/60",
        )}
      >
        <span>
          <span className="block font-display text-base text-espresso">Gift box</span>
          <span className="text-xs text-muted">Ribboned & ready to give · +$5</span>
        </span>
        <motion.span
          animate={{ backgroundColor: config.giftBox ? "var(--color-gold)" : "transparent" }}
          className="flex h-6 w-6 items-center justify-center rounded-full border hairline text-canvas"
        >
          {config.giftBox && "✓"}
        </motion.span>
      </button>
    </div>
  );
}

import { motion } from "motion/react";
import { useState } from "react";
import type { BuildConfig, ScentStrength } from "@/data/types";
import {
  DRIZZLES,
  DRIZZLE_BY_ID,
  MAX_LAYERS,
  SCENTS,
  SCENT_BY_ID,
  SCENT_FAMILIES,
  TOPPINGS,
  TOPPING_BY_ID,
  VESSELS,
  WAX_BY_ID,
  WHIP_BY_ID,
  WHIP_COLORS,
} from "@/data/ingredients";
import { DEFAULT_SCENT, toppingLoad, validWaxColors } from "@/data/build";
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
      className="mb-2 block h-11 w-11 rounded-full border-2 border-white/70 shadow-inner"
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

const STRENGTHS: ScentStrength[] = ["light", "medium", "strong"];

function WaxStep({ config, update }: StepProps) {
  const colors = validWaxColors(config.vesselId);
  const layers = [config.waxColorId, ...config.extraLayers]; // [bottom...top]
  const [sel, setSel] = useState(0);
  const cur = Math.min(sel, layers.length - 1);
  const canAdd = layers.length < MAX_LAYERS;

  function setLayerColor(id: string) {
    if (cur === 0) update({ waxColorId: id });
    else {
      const e = [...config.extraLayers];
      e[cur - 1] = id;
      update({ extraLayers: e });
    }
  }
  function setLayerScent(i: number, id: string) {
    const s = [...config.layerScents];
    s[i] = id;
    update({ layerScents: s });
  }
  function addLayer() {
    update({ extraLayers: [...config.extraLayers, config.waxColorId] });
    setSel(layers.length); // select the new top layer
  }
  function removeLayer(i: number) {
    const e = [...config.extraLayers];
    e.splice(i - 1, 1);
    const s = [...config.layerScents];
    s.splice(i, 1); // layerScents is index-aligned to [base, ...extraLayers]
    update({ extraLayers: e, layerScents: s });
    setSel(0);
  }

  const layerName = (i: number) =>
    i === 0 ? "Base" : i === layers.length - 1 ? "Top" : `Layer ${i + 1}`;
  const curColor = WAX_BY_ID[layers[cur]];
  const curScent = config.layerScents[cur] ?? DEFAULT_SCENT;

  return (
    <div>
      <StepHeading
        title="Pour & scent the wax"
        hint={
          layers.length > 1
            ? "Each layer gets its own color and scent — tap a layer to set it."
            : "Pick this layer's color and the scent it's poured with. Add layers for a parfait."
        }
      />

      {/* layer selector (top shown first) — shows each layer's color + scent */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {layers
          .map((id, i) => ({ id, i }))
          .reverse()
          .map(({ id, i }) => (
            <button
              key={i}
              type="button"
              onClick={() => setSel(i)}
              className={cn(
                "flex items-center gap-2 rounded-2xl border py-1.5 pl-2 pr-3 text-left text-xs transition-colors",
                cur === i ? "border-gold bg-blush-soft/50" : "hairline bg-porcelain/60",
              )}
            >
              <span className="h-7 w-7 shrink-0 rounded-full border border-white/60" style={{ background: WAX_BY_ID[id]?.hex }} />
              <span className="leading-tight">
                <span className="block text-espresso">{layerName(i)}</span>
                <span className="block text-[0.6rem] text-muted">
                  {SCENT_BY_ID[config.layerScents[i] ?? DEFAULT_SCENT]?.name}
                </span>
              </span>
              {i > 0 && (
                <span
                  role="button"
                  aria-label={`Remove ${layerName(i)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(i);
                  }}
                  className="ml-0.5 text-muted hover:text-rose"
                >
                  ✕
                </span>
              )}
            </button>
          ))}
        {canAdd && (
          <button
            type="button"
            onClick={addLayer}
            className="rounded-2xl border border-dashed hairline px-3 py-2 text-xs text-cocoa hover:bg-porcelain"
          >
            + Add layer <span className="text-muted">+$3</span>
          </button>
        )}
      </div>

      {/* color grid for the selected layer */}
      <span className="label-caps">{layerName(cur)} color</span>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {colors.map((w) => (
          <SelectTile
            key={w.id}
            groupId="wax-sel"
            selected={layers[cur] === w.id}
            onSelect={() => setLayerColor(w.id)}
            ariaLabel={w.name}
          >
            <Swatch hex={w.hex} />
            <span className="text-xs text-cocoa">{w.name}</span>
          </SelectTile>
        ))}
      </div>

      {/* scent for THIS wax color — chosen right where you pick the color */}
      <div className="mt-5 rounded-2xl border hairline bg-porcelain/50 p-4">
        <label className="label-caps" htmlFor="layer-scent">
          Scent for the {layerName(cur).toLowerCase()} {curColor?.name ?? "wax"}
        </label>
        <p className="mb-2 mt-0.5 text-xs text-muted">
          What this wax color smells like.
        </p>
        <ScentSelect
          value={curScent}
          onChange={(id) => setLayerScent(cur, id)}
          label={`${layerName(cur)} wax`}
          full
        />
        {layers.length > 1 && (
          <button
            type="button"
            onClick={() => update({ layerScents: layers.map(() => curScent) })}
            className="mt-3 rounded-full border border-dashed hairline px-3 py-1.5 text-xs text-cocoa hover:bg-porcelain"
          >
            ✦ Use this scent for every layer
          </button>
        )}
      </div>

      {/* scent strength — one setting for the whole candle */}
      <div className="mt-5">
        <span className="label-caps">Scent strength</span>
        <span className="ml-2 text-[0.65rem] lowercase tracking-normal text-muted">
          · for the whole candle
        </span>
        <div className="mt-2 flex gap-2">
          {STRENGTHS.map((s) => (
            <Chip key={s} active={config.strength === s} onClick={() => update({ strength: s })}>
              {s}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Accessible scent picker — native select grouped by family (big tap target). */
function ScentSelect({
  value,
  onChange,
  label,
  full,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  full?: boolean;
}) {
  return (
    <select
      value={value}
      aria-label={`Scent for ${label}`}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-xl border hairline bg-porcelain px-3 py-2.5 text-sm text-espresso outline-none focus:border-gold",
        full ? "w-full" : "w-full max-w-[12rem] shrink-0",
      )}
    >
      {SCENT_FAMILIES.map((fam) => {
        const inFam = SCENTS.filter((s) => s.family === fam);
        if (inFam.length === 0) return null;
        return (
          <optgroup key={fam} label={fam}>
            {inFam.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

/** One row: what the part is + a swatch + its scent picker. */
function ScentRow({
  label,
  sub,
  hex,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  hex?: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b hairline py-3 last:border-0">
      {hex && (
        <span
          className="h-7 w-7 shrink-0 rounded-full border-2 border-white/70 shadow-inner"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-espresso">{label}</span>
        {sub && <span className="block text-[0.65rem] uppercase tracking-[0.12em] text-muted">{sub}</span>}
      </span>
      <ScentSelect value={value} onChange={onChange} label={label} />
    </div>
  );
}

function WhipStep({ config, update }: StepProps) {
  return (
    <div>
      <StepHeading title="Pipe & scent the whip" hint="Whipped 'ice cream' on top — pick its color and scent, or skip it." />
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
      {config.whipId && (
        <div className="mt-4 rounded-2xl border hairline bg-porcelain/50 px-4">
          <ScentRow
            label="Whipped cream scent"
            sub={WHIP_BY_ID[config.whipId]?.name}
            hex={WHIP_BY_ID[config.whipId]?.hex}
            value={config.whipScentId ?? DEFAULT_SCENT}
            onChange={(id) => update({ whipScentId: id })}
          />
        </div>
      )}
    </div>
  );
}

function DrizzleStep({ config, update }: StepProps) {
  return (
    <div>
      <StepHeading title="Drizzle & scent it" hint="Glossy ribbons over the top — choose the drizzle and its scent." />
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
      {config.drizzleId && (
        <div className="mt-4 rounded-2xl border hairline bg-porcelain/50 px-4">
          <ScentRow
            label="Drizzle scent"
            sub={DRIZZLE_BY_ID[config.drizzleId]?.name}
            hex={DRIZZLE_BY_ID[config.drizzleId]?.hex}
            value={config.drizzleScentId ?? DEFAULT_SCENT}
            onChange={(id) => update({ drizzleScentId: id })}
          />
        </div>
      )}
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

      {/* scent each topping you added (sprinkles, fruit, embeds…) */}
      {config.toppingIds.length > 0 && (
        <div className="mt-5">
          <span className="label-caps">Scent your toppings</span>
          <div className="mt-2 rounded-2xl border hairline bg-porcelain/50 px-4">
            {config.toppingIds.map((t) => (
              <ScentRow
                key={`topscent-${t}`}
                label={TOPPING_BY_ID[t]?.name ?? "Topping"}
                hex={TOPPING_BY_ID[t]?.hex}
                value={config.toppingScents[t] ?? DEFAULT_SCENT}
                onChange={(id) =>
                  update({ toppingScents: { ...config.toppingScents, [t]: id } })
                }
              />
            ))}
          </div>
        </div>
      )}
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

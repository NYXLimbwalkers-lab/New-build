import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/db";
import { PRODUCTS } from "@/data/products";
import { describeBuild, formatUSD } from "@/data/build";
import { useOverrides, setOverride } from "@/features/admin/overrides";
import { BuildRecipe } from "@/features/builder/BuildRecipe";
import { cn } from "@/lib/cn";
import { useDocumentTitle } from "@/lib/useTitle";

/*
  No-code admin. Reads REAL local data (orders, events, builds) and writes REAL
  catalog overrides. Built so it points at the same data the storefront/kiosk/
  party write — a Phase-2 commerce adapter swaps the local store for WooCommerce/
  Square without changing this screen.
*/
type Tab = "orders" | "analytics" | "leads" | "catalog";

export function AdminPage() {
  useDocumentTitle("Owner Dashboard");
  const [tab, setTab] = useState<Tab>("orders");
  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 pt-8">
      <p className="label-caps">DéLa Já · Owner</p>
      <h1 className="font-display text-4xl text-espresso">Dashboard</h1>
      <div className="my-5 flex gap-2">
        {(["orders", "analytics", "leads", "catalog"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] capitalize",
              tab === t ? "bg-cocoa text-canvas" : "border hairline bg-porcelain/60 text-cocoa",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "orders" && <Orders />}
      {tab === "analytics" && <Analytics />}
      {tab === "leads" && <Leads />}
      {tab === "catalog" && <Catalog />}
    </section>
  );
}

function Orders() {
  const orders = useLiveQuery(() => db.orders.orderBy("createdAt").reverse().toArray(), [], []);
  if (orders.length === 0)
    return <p className="py-10 text-center font-serif text-plum">No orders yet.</p>;

  function exportCsv() {
    const rows = [
      ["date", "mode", "fulfillment", "pickup", "total", "name", "contact", "address", "items"],
      ...orders.map((o) => [
        new Date(o.createdAt).toISOString(),
        o.mode,
        o.fulfillment ?? "",
        o.pickupNumber != null ? `#${o.pickupNumber}` : "",
        String(o.total),
        o.contact?.name ?? "",
        o.contact?.email ?? o.contact?.phone ?? "",
        o.contact?.address ?? "",
        o.items
          .map((i) =>
            i.kind === "build" && i.config
              ? `${i.qty}× ${i.name} [${describeBuild(i.config).map(([k, v]) => `${k}: ${v}`).join("; ")}]`
              : `${i.qty}× ${i.name}`,
          )
          .join(" | "),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `delaja-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{orders.length} order{orders.length === 1 ? "" : "s"}</span>
        <button
          onClick={exportCsv}
          className="rounded-full border hairline bg-porcelain/60 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-cocoa hover:bg-porcelain"
        >
          ↓ Export CSV
        </button>
      </div>
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border hairline bg-porcelain/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-blush-soft/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-plum">
                {o.mode}
              </span>
              {o.pickupNumber != null && (
                <span className="text-sm text-cocoa">Pickup #{o.pickupNumber}</span>
              )}
              <span className="text-xs text-muted">
                {new Date(o.createdAt).toLocaleString()}
              </span>
            </span>
            <span className="price text-lg text-espresso">{formatUSD(o.total)}</span>
          </div>
          <div className="mt-1 space-y-1.5">
            {o.items.map((i) => (
              <div key={i.id} className="text-sm text-cocoa">
                <span>
                  {i.qty}× {i.name}
                </span>
                {i.kind === "build" && i.config && (
                  <BuildRecipe
                    config={i.config}
                    className="mt-1 rounded-xl border hairline bg-porcelain/50 px-3 py-2"
                  />
                )}
              </div>
            ))}
          </div>
          {o.contact && (
            <p className="mt-1 text-sm text-plum">
              {o.contact.name}
              {(o.contact.email || o.contact.phone) && (
                <>
                  {" · "}
                  <a
                    href={
                      o.contact.email
                        ? `mailto:${o.contact.email}`
                        : `tel:${o.contact.phone}`
                    }
                    className="text-cocoa underline decoration-gold/50 underline-offset-2"
                  >
                    {o.contact.email ?? o.contact.phone}
                  </a>
                </>
              )}
            </p>
          )}
          {o.contact?.address && (
            <p className="mt-0.5 whitespace-pre-line text-xs text-muted">
              {o.contact.address}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted">
            {o.fulfillment && <span>{o.fulfillment === "ship" ? "Ship" : "Pickup"}</span>}
            {o.gift && <span>🎁 Gift{o.gift.recipient ? ` for ${o.gift.recipient}` : ""}</span>}
            {o.gift?.receipt && <span>gift receipt</span>}
            <button onClick={() => db.orders.delete(o.id)} className="ml-auto hover:text-rose">
              Mark done / remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border hairline bg-porcelain/60 p-4 text-center">
      <p className="price text-2xl text-espresso">{value}</p>
      <p className="label-caps mt-1 !text-[0.6rem]">{label}</p>
    </div>
  );
}

function Analytics() {
  const orders = useLiveQuery(() => db.orders.toArray(), [], []);
  const events = useLiveQuery(() => db.events.toArray(), [], []);
  const builds = useLiveQuery(() => db.builds.count(), [], 0);
  const reviews = useLiveQuery(() => db.userReviews.count(), [], 0);
  const parties = useLiveQuery(() => db.parties.count(), [], 0);
  const clubLeads = useLiveQuery(
    () => db.leads.where("kind").equals("club").count(),
    [],
    0,
  );

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const byMode = (m: string) => orders.filter((o) => o.mode === m);
  const evCount = (t: string) => events.filter((e) => e.type === t).length;
  const starts = evCount("builder_step");
  const reveals = evCount("builder_reveal");
  const carts = evCount("add_to_cart");

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Revenue" value={formatUSD(revenue)} />
        <Stat label="Avg order" value={formatUSD(Math.round(aov * 100) / 100)} />
        <Stat label="Email signups" value={String(evCount("email_signup"))} />
        <Stat label="Saved builds" value={String(builds)} />
        <Stat label="Reviews" value={String(reviews)} />
        <Stat label="Parties booked" value={String(parties)} />
        <Stat label="Add-to-carts" value={String(carts)} />
        <Stat label="Club interest" value={String(clubLeads)} />
      </div>

      <h3 className="mt-8 mb-2 font-display text-xl text-espresso">AOV by channel</h3>
      <div className="space-y-1 text-sm">
        {(["storefront", "kiosk", "party"] as const).map((m) => {
          const list = byMode(m);
          const rev = list.reduce((s, o) => s + o.total, 0);
          return (
            <div key={m} className="flex justify-between border-b hairline py-1.5">
              <span className="capitalize text-cocoa">{m}</span>
              <span className="text-muted">
                {list.length} orders · {formatUSD(rev)} ·{" "}
                {formatUSD(list.length ? Math.round((rev / list.length) * 100) / 100 : 0)} avg
              </span>
            </div>
          );
        })}
      </div>

      <h3 className="mt-8 mb-2 font-display text-xl text-espresso">Builder funnel</h3>
      <p className="text-sm text-muted">
        Step views: {starts} · Reveals: {reveals} · Add-to-cart: {carts}
        {reveals > 0 && carts > 0 && (
          <> · {Math.round((carts / reveals) * 100)}% of reveals add to cart</>
        )}
      </p>
      <p className="mt-6 text-xs text-muted">
        Live, privacy-light data from this device. Aggregates across devices once the
        commerce adapter is connected.
      </p>
    </div>
  );
}

function Leads() {
  const leads = useLiveQuery(() => db.leads.orderBy("at").reverse().toArray(), [], []);
  const [filter, setFilter] = useState<"all" | "club" | "newsletter">("all");

  const shown = leads.filter((l) => filter === "all" || l.kind === filter);

  function exportCsv() {
    const rows = [
      ["email", "kind", "plan", "date"],
      ...shown.map((l) => [
        l.email,
        l.kind,
        l.plan ?? "",
        new Date(l.at).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `delaja-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "club", "newsletter"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em] capitalize",
              filter === f ? "bg-cocoa text-canvas" : "border hairline bg-porcelain/60 text-cocoa",
            )}
          >
            {f}
          </button>
        ))}
        <button
          onClick={exportCsv}
          disabled={shown.length === 0}
          className="ml-auto rounded-full border hairline bg-porcelain/60 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-cocoa hover:bg-porcelain disabled:opacity-40"
        >
          ↓ Export CSV
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center font-serif text-plum">No leads yet.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border hairline bg-porcelain/60 p-3"
            >
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]",
                  l.kind === "club"
                    ? "bg-gold/20 text-cocoa"
                    : "bg-blush-soft/60 text-plum",
                )}
              >
                {l.kind === "club" ? "Club" : "List"}
              </span>
              <span className="text-sm text-espresso">{l.email}</span>
              {l.plan && <span className="text-xs text-cocoa">· {l.plan}</span>}
              <span className="ml-auto text-xs text-muted">
                {new Date(l.at).toLocaleDateString()}
              </span>
              <button
                onClick={() => db.leads.delete(l.id)}
                className="text-xs text-muted hover:text-rose"
                aria-label="Remove lead"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">
        Real interest captured on this device. Export to import into your email tool,
        or connect the subscription adapter at launch to convert these to members.
      </p>
    </div>
  );
}

function Catalog() {
  const overrides = useOverrides();
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Edit prices or hide items. Changes apply to the shop immediately and sync to
        your store at launch.
      </p>
      <div className="space-y-2">
        {PRODUCTS.map((p) => {
          const o = overrides.get(p.id);
          const price = o?.price ?? p.price;
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border hairline bg-porcelain/60 p-3">
              <span className="flex-1 text-sm text-espresso">{p.name}</span>
              <span className="text-xs text-muted">$</span>
              <input
                type="number"
                defaultValue={price}
                step="0.01"
                onBlur={(e) => setOverride(p.id, { price: Number(e.target.value) })}
                className="w-20 rounded-xl border hairline bg-porcelain px-2 py-1.5 text-sm outline-none focus:border-gold"
              />
              <label className="flex items-center gap-1.5 text-xs text-cocoa">
                <input
                  type="checkbox"
                  checked={!!o?.hidden}
                  onChange={(e) => setOverride(p.id, { hidden: e.target.checked })}
                  className="accent-gold"
                />
                Hide
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

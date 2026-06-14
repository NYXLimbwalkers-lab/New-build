/*
  Mobile candle-party packages (mirrors the real market: per-person tiers, group
  minimum, non-refundable deposit, travel fee). Tunable by the owner.
*/
export interface PartyPackage {
  id: string;
  name: string;
  blurb: string;
  perPerson: number;
  minGuests: number;
  includes: string[];
}

export const PARTY_PACKAGES: PartyPackage[] = [
  {
    id: "classic",
    name: "Classic Pour",
    blurb: "Everyone builds + takes home one custom candle.",
    perPerson: 50,
    minGuests: 8,
    includes: ["1 custom candle each", "All scents & toppings", "Make & Take recipe card"],
  },
  {
    id: "premium",
    name: "Premium Soirée",
    blurb: "A bigger candle, a drink candle, and a little extra magic.",
    perPerson: 65,
    minGuests: 6,
    includes: ["1 large + 1 drink candle each", "Premium scent library", '"While it sets" games'],
  },
  {
    id: "bridal",
    name: "Bridal / Girls' Night",
    blurb: "The full experience for a special celebration.",
    perPerson: 75,
    minGuests: 6,
    includes: ["Everything in Premium", "Custom labels", "Group photo moment"],
  },
];

export const DEPOSIT = 100; // non-refundable booking deposit
export const TRAVEL_FEE = 35; // flat travel fee (within radius)

export const PKG_BY_ID = Object.fromEntries(PARTY_PACKAGES.map((p) => [p.id, p]));

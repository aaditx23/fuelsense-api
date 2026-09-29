export type MileageRecord = {
  userBikeId: number;
  entryType: string;
  odometerAtReserve: number | null;
  fuelLiter: number | null;
  createdAt: Date;
};

export type MileageTotals = { distance: number; fuel: number };

/**
 * Reserve-to-reserve totals per user bike.
 *
 * Between two reserve hits the tank goes from reserve level back to reserve
 * level, so the fuel added after the first hit (its refuel plus any top-ups)
 * is exactly what was burned over the odometer distance between the two hits.
 * The trip meter is never used: riders reset it at different times, so it is
 * not a distance. Bikes with fewer than two completed reserve entries yield
 * nothing.
 */
export function reserveCycleTotals(records: MileageRecord[]): Map<number, MileageTotals> {
  const byBike = new Map<number, MileageRecord[]>();
  for (const record of records) {
    const list = byBike.get(record.userBikeId) ?? [];
    list.push(record);
    byBike.set(record.userBikeId, list);
  }

  const totals = new Map<number, MileageTotals>();
  for (const [userBikeId, list] of byBike) {
    const sorted = [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const reserves = sorted.filter((r) => r.entryType === 'RESERVE_COMPLETE');

    let distance = 0;
    let fuel = 0;
    for (let i = 1; i < reserves.length; i++) {
      const previous = reserves[i - 1];
      const next = reserves[i];
      if (previous.odometerAtReserve == null || next.odometerAtReserve == null) continue;

      const cycleDistance = next.odometerAtReserve - previous.odometerAtReserve;
      let cycleFuel = previous.fuelLiter ?? 0;
      for (const r of sorted) {
        if (
          r.entryType === 'TOPUP' &&
          r.createdAt > previous.createdAt &&
          r.createdAt < next.createdAt
        ) {
          cycleFuel += r.fuelLiter ?? 0;
        }
      }

      if (cycleDistance <= 0 || cycleFuel <= 0) continue;
      distance += cycleDistance;
      fuel += cycleFuel;
    }

    if (fuel > 0) totals.set(userBikeId, { distance, fuel });
  }
  return totals;
}

/** One measured km/L per bike that has at least one full reserve cycle. */
export function perBikeMileages(records: MileageRecord[]): number[] {
  return [...reserveCycleTotals(records).values()].map((t) => t.distance / t.fuel);
}

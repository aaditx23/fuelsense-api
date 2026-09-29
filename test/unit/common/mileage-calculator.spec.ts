import {
  MileageRecord,
  reserveCycleTotals,
} from '../../../src/common/fuel/mileage-calculator';

const at = (day: number) => new Date(Date.UTC(2026, 0, day));
const rec = (over: Partial<MileageRecord>): MileageRecord => ({
  userBikeId: 1,
  entryType: 'TOPUP',
  odometerAtReserve: null,
  fuelLiter: null,
  createdAt: at(1),
  ...over,
});

describe('reserveCycleTotals', () => {
  it('yields nothing for a single reserve entry', () => {
    const result = reserveCycleTotals([
      rec({ entryType: 'RESERVE_COMPLETE', odometerAtReserve: 1000, fuelLiter: 5 }),
    ]);
    expect(result.size).toBe(0);
  });

  it('uses odometer distance and the refuel plus top-ups between reserve hits', () => {
    const result = reserveCycleTotals([
      rec({ entryType: 'RESERVE_COMPLETE', odometerAtReserve: 1000, fuelLiter: 5, createdAt: at(1) }),
      rec({ entryType: 'TOPUP', fuelLiter: 1, createdAt: at(5) }),
      rec({ entryType: 'RESERVE_COMPLETE', odometerAtReserve: 1300, fuelLiter: 5, createdAt: at(10) }),
    ]);
    expect(result.get(1)).toEqual({ distance: 300, fuel: 6 });
  });

  it('ignores markers, unordered input and cycles without odometer data', () => {
    const result = reserveCycleTotals([
      rec({ entryType: 'RESERVE_COMPLETE', odometerAtReserve: 1300, fuelLiter: 5, createdAt: at(10) }),
      rec({ entryType: 'RESERVE_INCOMPLETE', odometerAtReserve: 1500, createdAt: at(12) }),
      rec({ entryType: 'RESERVE_COMPLETE', odometerAtReserve: 1000, fuelLiter: 4, createdAt: at(1) }),
      rec({ entryType: 'RESERVE_COMPLETE', odometerAtReserve: null, fuelLiter: 4, createdAt: at(20) }),
    ]);
    expect(result.get(1)).toEqual({ distance: 300, fuel: 4 });
  });

  it('keeps bikes separate', () => {
    const result = reserveCycleTotals([
      rec({ userBikeId: 1, entryType: 'RESERVE_COMPLETE', odometerAtReserve: 0, fuelLiter: 2, createdAt: at(1) }),
      rec({ userBikeId: 1, entryType: 'RESERVE_COMPLETE', odometerAtReserve: 100, fuelLiter: 2, createdAt: at(2) }),
      rec({ userBikeId: 2, entryType: 'RESERVE_COMPLETE', odometerAtReserve: 0, fuelLiter: 4, createdAt: at(1) }),
      rec({ userBikeId: 2, entryType: 'RESERVE_COMPLETE', odometerAtReserve: 100, fuelLiter: 4, createdAt: at(2) }),
    ]);
    expect(result.get(1)).toEqual({ distance: 100, fuel: 2 });
    expect(result.get(2)).toEqual({ distance: 100, fuel: 4 });
  });
});

/**
 * Points calculation strategies.
 *
 * Partners and promotions can need different points rules, so the calculation sits behind
 * a strategy interface. To add a rule, implement PointsStrategy and register it in the factory.
 */

export interface PointsCalculationContext {
  amount: number;
  storeId: string;
}

export interface PointsStrategy {
  readonly name: string;
  calculate(context: PointsCalculationContext): number;
}

/** One point for each whole dollar spent. */
export class StandardPointsStrategy implements PointsStrategy {
  readonly name = "standard";

  calculate(context: PointsCalculationContext): number {
    return Math.floor(context.amount);
  }
}

export type PointsStrategyName = "standard";

export class PointsStrategyFactory {
  private static readonly strategies = new Map<PointsStrategyName, () => PointsStrategy>([
    ["standard", () => new StandardPointsStrategy()],
  ]);

  static create(name: PointsStrategyName = "standard"): PointsStrategy {
    const build = PointsStrategyFactory.strategies.get(name);
    if (!build) {
      throw new Error(`Unknown points strategy: ${name}`);
    }
    return build();
  }
}

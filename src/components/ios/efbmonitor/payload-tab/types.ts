export interface PayloadState {
  pax: Record<string, number>;
  cargo: { h1: number; h2: number; h3: number; h4: number; bulk: number };
  fuel: { uplift: number; left: number; center: number; right: number; finalOrder: number };
}
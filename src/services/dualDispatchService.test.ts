import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/data/melToPmdgMap', () => ({
  MEL_TO_PMDG_MAP: {
    'TEST-WITH-MACRO': { pmdgId: 'FAKE_MACRO', pmdgTitle: 'Fake Macro Failure' },
    'TEST-PENDING': { pmdgId: 'FAKE_PENDING', pmdgTitle: 'Fake Pending Failure' },
  },
}));

vi.mock('@/data/pmdgCommands', () => ({
  getFailureByPmdgId: (id: string) =>
    id === 'FAKE_MACRO' ? { id, name: 'x', macroSequence: [1] } :
    id === 'FAKE_PENDING' ? { id, name: 'y' } :
    undefined,
}));

describe('executeDualDispatch', () => {
  let sendToFSUIPC: (payload: any) => void;

  beforeEach(() => {
    sendToFSUIPC = vi.fn((_payload: any) => {});
    vi.useRealTimers();
  });

  it('returns dispatchedToSim: false with no pmdgTitle for an unmapped MEL code', async () => {
    const { executeDualDispatch } = await import('./dualDispatchService');
    const result = await executeDualDispatch('NO-SUCH-MEL', sendToFSUIPC);
    expect(result).toEqual({ dispatchedToSim: false });
    expect(sendToFSUIPC).not.toHaveBeenCalled();
  });

  it('fires the real macro and reports success when one is authored', async () => {
    const { executeDualDispatch } = await import('./dualDispatchService');
    const result = await executeDualDispatch('TEST-WITH-MACRO', sendToFSUIPC);
    expect(result).toEqual({ dispatchedToSim: true, pmdgTitle: 'Fake Macro Failure' });
    expect(sendToFSUIPC).toHaveBeenCalled();
  });

  it('does NOT fire anything and honestly reports macroPending when mapped but no macro exists', async () => {
    const { executeDualDispatch } = await import('./dualDispatchService');
    const result = await executeDualDispatch('TEST-PENDING', sendToFSUIPC);
    expect(result).toEqual({ dispatchedToSim: false, macroPending: true, pmdgTitle: 'Fake Pending Failure' });
    expect(sendToFSUIPC).not.toHaveBeenCalled();
  });

  it('trims whitespace around the MEL code before lookup', async () => {
    const { executeDualDispatch } = await import('./dualDispatchService');
    const result = await executeDualDispatch('  TEST-WITH-MACRO  ', sendToFSUIPC);
    expect(result.dispatchedToSim).toBe(true);
  });
});

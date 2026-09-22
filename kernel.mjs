// kernel.mjs
// PulseDebounce — pure kernel: thin a sequence of timestamped pulses down to
// the ones at least `gap` apart, keeping the earliest of each cluster.
// Total: bad input returns {ok:false, why:...} instead of throwing.

export function debounce(pulses, gap) {
  if (!Array.isArray(pulses)) {
    return { ok: false, why: 'pulses must be an array' };
  }
  if (!Number.isInteger(gap) || gap <= 0) {
    return { ok: false, why: 'gap must be a positive integer' };
  }
  for (let i = 0; i < pulses.length; i++) {
    if (!Number.isInteger(pulses[i])) {
      return { ok: false, why: `pulses[${i}] must be an integer` };
    }
  }

  // Non-decreasing check via a derived diff array — no manual index-bound
  // loop here on purpose. A manual `for (i=1; i<pulses.length; i++)` has an
  // out-of-range read at the mutated `<=` bound that compares against
  // `undefined` (always NaN, always false) — an EQUIVALENT mutant no test
  // can kill without lying about behavior. Deriving the diffs up front
  // removes that boundary from the source entirely instead of dodging it.
  const diffs = pulses.slice(1).map((p, i) => p - pulses[i]);
  const badIdx = diffs.findIndex((d) => d < 0);
  if (badIdx !== -1) {
    const i = badIdx + 1;
    return { ok: false, why: `pulses must be non-decreasing (pulses[${i}] < pulses[${i - 1}])` };
  }

  const kept = [];
  let last = null;
  for (const p of pulses) {
    if (last === null || p - last >= gap) {
      kept.push(p);
      last = p;
    }
  }
  return { ok: true, value: kept };
}

export function isValidResult(pulses, gap, result) {
  if (!Array.isArray(result) || result.length > pulses.length) return false;
  const diffs = result.slice(1).map((p, i) => p - result[i]);
  return diffs.every((d) => d >= gap);
}

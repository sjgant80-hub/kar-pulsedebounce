import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from './kernel.mjs';

test('clusters within gap collapse to earliest, gap boundary keeps', () => {
  const r = K.debounce([0, 1, 2, 10, 11, 20], 5);
  assert.deepEqual(r, { ok: true, value: [0, 10, 20] });
});

test('gap of 1 keeps first of each run of exact duplicates', () => {
  const r = K.debounce([5, 5, 5, 6, 7], 1);
  assert.deepEqual(r, { ok: true, value: [5, 6, 7] });
});

test('empty input yields empty output', () => {
  const r = K.debounce([], 3);
  assert.deepEqual(r, { ok: true, value: [] });
});

test('non-positive gap is rejected, not thrown', () => {
  const r = K.debounce([1, 2, 3], 0);
  assert.equal(r.ok, false);
  assert.equal(typeof r.why, 'string');
});

test('non-integer gap is rejected', () => {
  const r = K.debounce([1, 2, 3], 2.5);
  assert.equal(r.ok, false);
});

test('non-monotonic input is rejected with the exact pinpointed reason', () => {
  const r = K.debounce([3, 1, 2], 1);
  assert.equal(r.ok, false);
  assert.equal(r.why, 'pulses must be non-decreasing (pulses[1] < pulses[0])');
});

test('non-monotonic violation later in the run is pinned at its own index', () => {
  const r = K.debounce([1, 2, 3, 2], 1);
  assert.equal(r.ok, false);
  assert.equal(r.why, 'pulses must be non-decreasing (pulses[3] < pulses[2])');
});

test('isValidResult: equal-length result with diffs exactly at the gap boundary is valid', () => {
  // pins result.length > pulses.length as strict (equal lengths must PASS,
  // kills the >= swap) and result[i]-result[i-1] >= gap as inclusive
  // (exact-gap diff must PASS, kills the > swap).
  assert.equal(K.isValidResult([0, 5, 10], 5, [0, 5, 10]), true);
});

test('isValidResult: result longer than pulses is invalid', () => {
  // forces the guard's true branch, pinning return false (kills the
  // return-false-to-return-true swap on that statement).
  assert.equal(K.isValidResult([1, 2, 3], 1, [1, 2, 3, 4]), false);
});

test('isValidResult: a diff just under the required gap is invalid', () => {
  assert.equal(K.isValidResult([0, 4, 10], 5, [0, 4, 10]), false);
});

test('isValidResult: a non-array result is rejected through Array.isArray, not length', () => {
  // "abc".length (3) is NOT > pulses.length (5), so this only stays false
  // via the Array.isArray half of the guard — proves it is `||`, not `&&`
  // (the `&&` mutant would fall through to .slice()/.map() on a string
  // and throw, failing this assertion).
  assert.equal(K.isValidResult([1, 2, 3, 4, 5], 1, 'abc'), false);
});

test('isValidResult: agrees with a real debounce output', () => {
  const r = K.debounce([0, 1, 2, 10, 11, 20], 5);
  assert.equal(K.isValidResult([0, 1, 2, 10, 11, 20], 5, r.value), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { correctMeetingTerms } from '../portable/neural/caption-terms.js';
test('reviewed equipment spelling retains recognition source and correction metadata', () => {
  const raw = '멀티텝도 챙겨주세요. 장비를 못 켰거든요.';
  const result = correctMeetingTerms(raw);
  assert.equal(result.text, '멀티탭도 챙겨주세요. 장비를 못 켰거든요.');
  assert.equal(result.raw, raw);
  assert.deepEqual(result.changes, [{ from: '멀티텝', to: '멀티탭' }]);
});
test('correct terms, unknown text, numbers and negation are not rewritten', () => {
  for (const raw of ['멀티탭은 필요 없어요.', '멀티템플릿', '전혀 다른 회의 내용입니다.', '5 후 2시에 만납니다.']) {
    const result = correctMeetingTerms(raw); assert.equal(result.text, raw); assert.equal(result.changes.length, 0);
  }
});

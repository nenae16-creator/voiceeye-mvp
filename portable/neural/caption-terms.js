// Only reviewed meeting-equipment terms. Never replace a full sentence with the scenario.
export function correctMeetingTerms(raw) {
  const changes = [];
  const text = raw.replace(/(^|[\s.,!?])멀티(?:템|텝)(?=도|을|이|은|\s|[.,!?]|$)/gu, (match, prefix) => {
    changes.push({ from: match.slice(prefix.length), to: '멀티탭' });
    return prefix + '멀티탭';
  });
  return { raw, text, changes };
}

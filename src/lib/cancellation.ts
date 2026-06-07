export interface CancellationRule {
  hours_before: number; // hours before trek start
  refund_percent: number; // 0-100
}

export const DEFAULT_CANCELLATION_RULES: CancellationRule[] = [
  { hours_before: 48, refund_percent: 100 },
  { hours_before: 24, refund_percent: 50 },
  { hours_before: 0, refund_percent: 0 },
];

/**
 * Calculate refund amount based on cancellation rules.
 * Rules are sorted by hours_before DESC — first matching rule wins.
 */
export function calculateRefund(
  rules: CancellationRule[],
  eventDate: string,
  eventTime: string, // "HH:MM" reporting time
  totalAmount: number,
): { refundPercent: number; refundAmount: number; reason: string } {
  // Combine event date + reporting time into a Date
  const eventDateTime = new Date(`${eventDate}T${eventTime}:00`);

  // Guard against invalid dates — give full refund if we can't determine the time
  if (!eventDate || isNaN(eventDateTime.getTime())) {
    return { refundPercent: 100, refundAmount: totalAmount, reason: "Full refund — event date not available" };
  }

  const now = new Date();
  const hoursUntilTrek = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // If trek already started
  if (hoursUntilTrek <= 0) {
    return { refundPercent: 0, refundAmount: 0, reason: "Trek has already started" };
  }

  // Sort rules by hours_before descending (most generous first)
  const sorted = [...rules].sort((a, b) => b.hours_before - a.hours_before);

  for (const rule of sorted) {
    if (hoursUntilTrek >= rule.hours_before) {
      const refundAmount = Math.round((totalAmount * rule.refund_percent) / 100);
      const reason = rule.refund_percent === 100
        ? `Full refund — cancelled more than ${rule.hours_before} hours before trek`
        : rule.refund_percent === 0
        ? (rule.hours_before === 0
          ? "No refund — cancelled too close to trek start"
          : `No refund — cancelled less than ${rule.hours_before} hours before trek`)
        : `${rule.refund_percent}% refund — cancelled ${Math.round(hoursUntilTrek)} hours before trek`;
      return { refundPercent: rule.refund_percent, refundAmount, reason };
    }
  }

  // If no rule matched (shouldn't happen with hours_before: 0), no refund
  return { refundPercent: 0, refundAmount: 0, reason: "No refund available" };
}

/**
 * Format rules for display: "More than 48hrs: 100% refund"
 */
export function formatRulesForDisplay(rules: CancellationRule[]): string[] {
  const sorted = [...rules].sort((a, b) => b.hours_before - a.hours_before);
  return sorted.map((rule, i) => {
    if (i === sorted.length - 1 && rule.hours_before === 0) {
      return `Less than ${sorted[i - 1]?.hours_before ?? 0} hours before: ${rule.refund_percent}% refund`;
    }
    const nextRule = sorted[i + 1];
    if (nextRule) {
      return `${nextRule.hours_before}–${rule.hours_before} hours before: ${rule.refund_percent}% refund`;
    }
    return `More than ${rule.hours_before} hours before: ${rule.refund_percent}% refund`;
  });
}

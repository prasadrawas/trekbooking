"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, AlertTriangle, Clock, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CancellationRule {
  hours_before: number;
  refund_percent: number;
}

interface Props {
  rules: CancellationRule[];
  onChange: (rules: CancellationRule[]) => void;
}

export function CancellationRulesBuilder({ rules, onChange }: Props) {
  const [addingRule, setAddingRule] = useState(false);
  const [newHours, setNewHours] = useState("");
  const [newPercent, setNewPercent] = useState("");

  // Sort rules by hours_before descending for display
  const sorted = [...rules].sort((a, b) => b.hours_before - a.hours_before);

  function addRule() {
    const hours = parseInt(newHours);
    const percent = parseInt(newPercent);
    if (isNaN(hours) || isNaN(percent) || hours < 0 || percent < 0 || percent > 100) return;
    // Don't allow duplicate hours_before
    if (rules.some((r) => r.hours_before === hours)) return;
    onChange([...rules, { hours_before: hours, refund_percent: percent }]);
    setNewHours("");
    setNewPercent("");
    setAddingRule(false);
  }

  function removeRule(hoursBefore: number) {
    onChange(rules.filter((r) => r.hours_before !== hoursBefore));
  }

  // Generate human-readable labels for display
  function getRuleLabel(rule: CancellationRule, index: number): string {
    const nextRule = sorted[index + 1];
    if (index === 0) {
      return `More than ${rule.hours_before} hours before`;
    }
    if (!nextRule || nextRule.hours_before === 0) {
      return `Less than ${sorted[index - 1]?.hours_before ?? rule.hours_before} hours before`;
    }
    return `${nextRule.hours_before}–${rule.hours_before} hours before`;
  }

  function getRefundColor(percent: number): string {
    if (percent === 100) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (percent >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    if (percent > 0) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  }

  return (
    <div className="space-y-3">
      {/* Rules list */}
      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((rule, i) => (
            <motion.div
              key={rule.hours_before}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{getRuleLabel(rule, i)}</p>
                  <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${getRefundColor(rule.refund_percent)}`}>
                    <Percent className="h-3 w-3" />
                    {rule.refund_percent}% refund
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRule(rule.hours_before)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && !addingRule && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-amber-700">No cancellation rules defined. Trekkers won't be eligible for refunds.</p>
        </div>
      )}

      {/* Add rule form */}
      <AnimatePresence>
        {addingRule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Add Cancellation Rule</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hours before trek
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={720}
                    placeholder="e.g., 48"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Refund percentage
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g., 100"
                    value={newPercent}
                    onChange={(e) => setNewPercent(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddingRule(false)}>Cancel</Button>
                <Button size="sm" onClick={addRule} disabled={!newHours || !newPercent}>Add Rule</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!addingRule && (
        <button
          type="button"
          onClick={() => setAddingRule(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Cancellation Rule
        </button>
      )}

      {/* Summary */}
      {sorted.length > 0 && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600 mb-1">Policy Preview:</p>
          {sorted.map((rule, i) => (
            <p key={rule.hours_before}>• {getRuleLabel(rule, i)}: <span className="font-semibold">{rule.refund_percent}% refund</span></p>
          ))}
        </div>
      )}
    </div>
  );
}

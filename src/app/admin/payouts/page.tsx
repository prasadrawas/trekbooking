"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Receipt,
  Banknote,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type PayoutStatus = "pending" | "processing" | "completed" | "failed";

interface Payout {
  id: string;
  organizer: string;
  trek: string;
  eventDate: string;
  collected: number;
  commission: number;
  payoutAmount: number;
  status: PayoutStatus;
  receiptNo?: string;
  processedAt?: string;
}

const INITIAL_PAYOUTS: Payout[] = [
  { id: "pay-1", organizer: "WildWander Adventures", trek: "Rajmachi Trek", eventDate: "Jun 08, 2025", collected: 44000, commission: 4400, payoutAmount: 39600, status: "pending" },
  { id: "pay-2", organizer: "Sahyadri Hikers Club", trek: "Harishchandragad", eventDate: "Jun 07, 2025", collected: 70000, commission: 7000, payoutAmount: 63000, status: "pending" },
  { id: "pay-3", organizer: "Peak Explorers", trek: "Lonavala Day Hike", eventDate: "Jun 05, 2025", collected: 26400, commission: 2640, payoutAmount: 23760, status: "pending" },
  { id: "pay-4", organizer: "Nature Nomads", trek: "Bhimashankar Trek", eventDate: "Jun 04, 2025", collected: 19600, commission: 1960, payoutAmount: 17640, status: "pending" },
  { id: "pay-5", organizer: "Altitude Addicts", trek: "Tamhini Night Trek", eventDate: "May 31, 2025", collected: 32000, commission: 2880, payoutAmount: 29120, status: "processing" },
  { id: "pay-6", organizer: "WildWander Adventures", trek: "Mulshi Sunrise", eventDate: "May 28, 2025", collected: 21000, commission: 2100, payoutAmount: 18900, status: "completed", receiptNo: "RCT-0612", processedAt: "Jun 01, 2025" },
  { id: "pay-7", organizer: "Sahyadri Hikers Club", trek: "Tamhini Night Trek", eventDate: "May 25, 2025", collected: 48000, commission: 4800, payoutAmount: 43200, status: "completed", receiptNo: "RCT-0608", processedAt: "May 28, 2025" },
  { id: "pay-8", organizer: "Trek Masters India", trek: "Rajgad Fort", eventDate: "May 20, 2025", collected: 15200, commission: 1520, payoutAmount: 13680, status: "failed" },
  { id: "pay-9", organizer: "Altitude Addicts", trek: "Kalsubai Summit", eventDate: "May 18, 2025", collected: 27000, commission: 2430, payoutAmount: 24570, status: "completed", receiptNo: "RCT-0601", processedAt: "May 21, 2025" },
  { id: "pay-10", organizer: "Peak Explorers", trek: "Rajgad Fort", eventDate: "May 15, 2025", collected: 19000, commission: 1900, payoutAmount: 17100, status: "completed", receiptNo: "RCT-0598", processedAt: "May 18, 2025" },
];

const PAGE_SIZE = 7;

const STATUS_CONFIG: Record<PayoutStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  processing: { label: "Processing", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Loader2 },
  completed: { label: "Completed", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Failed", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>(INITIAL_PAYOUTS);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/payouts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.payouts?.length) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPayouts(data.payouts.map((p: any): Payout => ({
          id: String(p.id ?? ""),
          organizer: p.organizer_name ?? p.organizers?.org_name ?? "—",
          trek: p.trek_title ?? p.treks?.title ?? "—",
          eventDate: p.event_date
            ? new Date(p.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—",
          collected: Number(p.total_collected ?? p.collected ?? 0),
          commission: Number(p.commission ?? 0),
          payoutAmount: Number(p.payout_amount ?? 0),
          status: (["pending","processing","completed","failed"].includes(p.status) ? p.status : "pending") as PayoutStatus,
          receiptNo: p.receipt_no ?? undefined,
          processedAt: p.processed_at
            ? new Date(p.processed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : undefined,
        })));
      })
      .catch(() => { /* keep mock */ })
      .finally(() => setLoadingData(false));
  }, []);
  const [confirmTarget, setConfirmTarget] = useState<Payout | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<Payout | null>(null);
  const [processing, setProcessing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const pendingPayouts = payouts.filter((p) => p.status === "pending");
  const completedThisMonth = payouts.filter((p) => p.status === "completed");
  const totalPending = pendingPayouts.reduce((s, p) => s + p.payoutAmount, 0);
  const totalProcessedMonth = completedThisMonth.reduce((s, p) => s + p.payoutAmount, 0);

  const totalPages = Math.ceil(payouts.length / PAGE_SIZE);
  const paginated = payouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function markProcessed(id: string) {
    const receipt = `RCT-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "completed", receiptNo: receipt, processedAt: "Jun 06, 2025" }
          : p
      )
    );
    setConfirmTarget(null);
  }

  function processAllPending() {
    setProcessing(true);
    timerRef.current = setTimeout(() => {
      setPayouts((prev) =>
        prev.map((p) =>
          p.status === "pending"
            ? {
                ...p,
                status: "completed",
                receiptNo: `RCT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                processedAt: "Jun 06, 2025",
              }
            : p
        )
      );
      setProcessing(false);
      setBulkConfirmOpen(false);
    }, 1200);
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Payouts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage organizer disbursements</p>
        </div>
        <Button
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={pendingPayouts.length === 0}
          onClick={() => setBulkConfirmOpen(true)}
        >
          <Banknote className="size-4" />
          Process All Pending
          {pendingPayouts.length > 0 && (
            <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {pendingPayouts.length}
            </span>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700">Total Pending</p>
              <p className="mt-1.5 text-2xl font-bold text-amber-900">{formatPrice(totalPending)}</p>
              <p className="mt-1 text-xs text-amber-600">{pendingPayouts.length} payouts awaiting action</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="size-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700">Processed This Month</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-900">{formatPrice(totalProcessedMonth)}</p>
              <p className="mt-1 text-xs text-emerald-600">{completedThisMonth.length} payouts completed</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Organizer", "Trek", "Event Date", "Collected", "Commission", "Payout Amount", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                      ["Collected", "Commission", "Payout Amount"].includes(h) ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No payouts found.
                  </td>
                </tr>
              ) : (
                paginated.map((payout) => {
                  const config = STATUS_CONFIG[payout.status];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={payout.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{payout.organizer}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[160px]">
                        <span className="truncate block">{payout.trek}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {payout.eventDate}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                        {formatPrice(payout.collected)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-rose-600">
                        -{formatPrice(payout.commission)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-800">
                        {formatPrice(payout.payoutAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            config.className
                          )}
                        >
                          <StatusIcon
                            className={cn(
                              "size-3",
                              payout.status === "processing" && "animate-spin"
                            )}
                          />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {payout.status === "pending" && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => setConfirmTarget(payout)}
                            >
                              <CheckCircle2 className="size-3.5" />
                              Process
                            </Button>
                          )}
                          {payout.status === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setConfirmTarget(payout)}
                            >
                              <AlertTriangle className="size-3.5" />
                              Retry
                            </Button>
                          )}
                          {payout.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1.5"
                              onClick={() => setReceiptTarget(payout)}
                            >
                              <Receipt className="size-3.5" />
                              Receipt
                            </Button>
                          )}
                          {payout.status === "processing" && (
                            <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
                              <Loader2 className="size-3 animate-spin" /> In progress
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {payouts.length} payouts
            </p>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Process Single Payout Dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.status === "failed" ? "Retry Payout" : "Confirm Payout"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.status === "failed"
                ? `Retry the failed payout of `
                : `Process a payout of `}
              <strong>{confirmTarget && formatPrice(confirmTarget.payoutAmount)}</strong> to{" "}
              <strong>{confirmTarget?.organizer}</strong> for the{" "}
              <strong>{confirmTarget?.trek}</strong> trek on {confirmTarget?.eventDate}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Collected</span>
              <span className="font-medium">{confirmTarget && formatPrice(confirmTarget.collected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Commission (deducted)</span>
              <span className="font-medium text-rose-600">-{confirmTarget && formatPrice(confirmTarget.commission)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
              <span>Payout to organizer</span>
              <span className="text-emerald-700">{confirmTarget && formatPrice(confirmTarget.payoutAmount)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => confirmTarget && markProcessed(confirmTarget.id)}
            >
              <CheckCircle2 className="size-4" />
              Mark as Processed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Process Dialog */}
      <Dialog open={bulkConfirmOpen} onOpenChange={(o) => !o && !processing && setBulkConfirmOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process All Pending Payouts</DialogTitle>
            <DialogDescription>
              This will mark all <strong>{pendingPayouts.length}</strong> pending payouts as processed,
              disbursing a total of <strong>{formatPrice(totalPending)}</strong> to organizers.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
            {pendingPayouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-700 text-xs">{p.organizer}</p>
                  <p className="text-slate-400 text-[11px]">{p.trek}</p>
                </div>
                <span className="font-semibold text-emerald-700 text-xs">{formatPrice(p.payoutAmount)}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={processing}
              onClick={() => setBulkConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={processing}
              onClick={processAllPending}
            >
              {processing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Banknote className="size-4" />
                  Confirm & Process All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptTarget} onOpenChange={(o) => !o && setReceiptTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Receipt</DialogTitle>
            <DialogDescription>Receipt #{receiptTarget?.receiptNo}</DialogDescription>
          </DialogHeader>
          {receiptTarget && (
            <div className="mt-3 space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">Payout Completed</span>
                </div>
                <dl className="space-y-2 text-sm">
                  {[
                    ["Receipt No.", receiptTarget.receiptNo],
                    ["Organizer", receiptTarget.organizer],
                    ["Trek", receiptTarget.trek],
                    ["Event Date", receiptTarget.eventDate],
                    ["Processed On", receiptTarget.processedAt],
                    ["Collected", formatPrice(receiptTarget.collected)],
                    ["Commission Deducted", `-${formatPrice(receiptTarget.commission)}`],
                    ["Amount Disbursed", formatPrice(receiptTarget.payoutAmount)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className={cn(
                        "font-medium",
                        label === "Amount Disbursed" ? "text-emerald-700 text-base font-bold" :
                        label === "Commission Deducted" ? "text-rose-600" : "text-slate-700"
                      )}>{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

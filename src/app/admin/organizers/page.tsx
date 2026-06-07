"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type OrganizerStatus = "pending" | "active" | "suspended";

interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: OrganizerStatus;
  treks: number;
  rating: number;
  commissionRate: number;
  joined: string;
}

const MOCK_ORGANIZERS: Organizer[] = [
  { id: "org-1", name: "WildWander Adventures", email: "contact@wildwander.in", phone: "+91 98201 11234", status: "active", treks: 24, rating: 4.7, commissionRate: 10, joined: "Jan 15, 2024" },
  { id: "org-2", name: "Summit Trails Pvt Ltd", email: "info@summittrails.com", phone: "+91 99870 22345", status: "pending", treks: 0, rating: 0, commissionRate: 10, joined: "May 30, 2025" },
  { id: "org-3", name: "Sahyadri Hikers Club", email: "team@sahyadrihikers.com", phone: "+91 91234 33456", status: "active", treks: 41, rating: 4.9, commissionRate: 8, joined: "Sep 03, 2023" },
  { id: "org-4", name: "Peak Explorers", email: "hello@peakexplorers.in", phone: "+91 70451 44567", status: "active", treks: 15, rating: 4.5, commissionRate: 10, joined: "Mar 22, 2024" },
  { id: "org-5", name: "Monsoon Trekkers", email: "support@monsoontrekkers.com", phone: "+91 88765 55678", status: "suspended", treks: 8, rating: 3.1, commissionRate: 10, joined: "Nov 10, 2023" },
  { id: "org-6", name: "Trek Masters India", email: "admin@trekmasters.in", phone: "+91 77654 66789", status: "pending", treks: 0, rating: 0, commissionRate: 10, joined: "Jun 02, 2025" },
  { id: "org-7", name: "Nature Nomads", email: "hello@naturenomads.co", phone: "+91 93241 77890", status: "active", treks: 9, rating: 4.2, commissionRate: 10, joined: "Feb 14, 2025" },
  { id: "org-8", name: "Altitude Addicts", email: "team@altitudeaddicts.com", phone: "+91 82341 88901", status: "active", treks: 32, rating: 4.6, commissionRate: 9, joined: "Jul 19, 2023" },
];

const PAGE_SIZE = 6;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<OrganizerStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
};

const STATUS_CLASS: Record<OrganizerStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>(MOCK_ORGANIZERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrganizerStatus>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/organizers")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.organizers?.length) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOrganizers(data.organizers.map((o: any): Organizer => ({
          id: String(o.id ?? o.slug ?? ""),
          name: o.org_name ?? o.name ?? "",
          email: o.email ?? "",
          phone: o.phone ?? "",
          status: (["pending","active","suspended"].includes(o.status) ? o.status : "pending") as OrganizerStatus,
          treks: Number(o.treks_count ?? o.treks?.length ?? 0),
          rating: Number(o.avg_rating ?? 0),
          commissionRate: Number(o.commission_rate ?? 10),
          joined: o.created_at
            ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—",
        })));
      })
      .catch(() => { /* keep mock */ })
      .finally(() => setLoading(false));
  }, []);

  // Dialogs
  const [approveTarget, setApproveTarget] = useState<Organizer | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Organizer | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [editCommTarget, setEditCommTarget] = useState<Organizer | null>(null);
  const [editCommRate, setEditCommRate] = useState("");
  const [viewTarget, setViewTarget] = useState<Organizer | null>(null);

  // Filtering
  const filtered = organizers.filter((o) => {
    const matchSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Actions
  function approveOrganizer(id: string) {
    setOrganizers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "active" } : o))
    );
    setApproveTarget(null);
  }

  function suspendOrganizer(id: string) {
    setOrganizers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "suspended" } : o))
    );
    setSuspendTarget(null);
    setSuspendReason("");
  }

  function activateOrganizer(id: string) {
    setOrganizers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "active" } : o))
    );
  }

  function saveCommissionRate(id: string, rate: number) {
    setOrganizers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, commissionRate: rate } : o))
    );
    setEditCommTarget(null);
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Organizers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${organizers.length} organizers on platform`}
          </p>
        </div>
        {loading && <Loader2 className="size-4 animate-spin text-slate-400" />}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
          className="w-full sm:w-44"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Treks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Commission</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No organizers found.
                  </td>
                </tr>
              ) : (
                paginated.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{org.name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-600 text-xs">{org.email}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{org.phone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          STATUS_CLASS[org.status]
                        )}
                      >
                        {STATUS_LABEL[org.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                      {org.treks}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {org.rating > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {org.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                      {org.commissionRate}%
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{org.joined}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {org.status === "pending" && (
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setApproveTarget(org)}
                          >
                            <CheckCircle className="size-3.5" />
                            Approve
                          </Button>
                        )}
                        {org.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => { setSuspendTarget(org); setSuspendReason(""); }}
                          >
                            <XCircle className="size-3.5" />
                            Suspend
                          </Button>
                        )}
                        {org.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => activateOrganizer(org.id)}
                          >
                            <CheckCircle className="size-3.5" />
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-500"
                          onClick={() => { setEditCommTarget(org); setEditCommRate(String(org.commissionRate)); }}
                          title="Edit commission rate"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-500"
                          onClick={() => setViewTarget(org)}
                          title="View details"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {filtered.length} results
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

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Organizer</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve{" "}
              <strong>{approveTarget?.name}</strong>? They will be able to list treks immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => approveTarget && approveOrganizer(approveTarget.id)}
            >
              <CheckCircle className="size-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Organizer</DialogTitle>
            <DialogDescription>
              Suspending <strong>{suspendTarget?.name}</strong> will hide all their treks. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <textarea
              rows={3}
              placeholder="Reason for suspension…"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!suspendReason.trim()}
              onClick={() => suspendTarget && suspendOrganizer(suspendTarget.id)}
            >
              <XCircle className="size-4" /> Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Commission Dialog */}
      <Dialog open={!!editCommTarget} onOpenChange={(o) => !o && setEditCommTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Commission Rate</DialogTitle>
            <DialogDescription>
              Set the platform commission % for <strong>{editCommTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={editCommRate}
              onChange={(e) => setEditCommRate(e.target.value)}
              className="w-28"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCommTarget(null)}>Cancel</Button>
            <Button
              onClick={() =>
                editCommTarget && saveCommissionRate(editCommTarget.id, parseFloat(editCommRate))
              }
              disabled={!editCommRate || isNaN(parseFloat(editCommRate))}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTarget?.name}</DialogTitle>
            <DialogDescription>Organizer profile details</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Email", viewTarget.email],
                ["Phone", viewTarget.phone],
                ["Status", STATUS_LABEL[viewTarget.status]],
                ["Joined", viewTarget.joined],
                ["Total Treks", viewTarget.treks],
                ["Rating", viewTarget.rating > 0 ? viewTarget.rating.toFixed(1) + " / 5" : "Not rated"],
                ["Commission Rate", viewTarget.commissionRate + "%"],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <dt className="text-xs text-slate-400 font-medium">{label}</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{val}</dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

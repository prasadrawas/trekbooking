"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mountain, Building2, Phone, Mail, FileText, ArrowRight, Loader2 } from "lucide-react";
import { createOrganizer } from "@/actions/organizer";

export default function OrgOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createOrganizer(formData);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/org");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4">
            <Mountain className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Organization</h1>
          <p className="text-gray-500 mt-2">
            Tell us about your trek business to get started on SahyadriBook.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Org Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organization Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="org_name"
                type="text"
                required
                placeholder="e.g., Sahyadri Explorers"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Phone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-400">+91</span>
              <input
                name="phone"
                type="tel"
                required
                placeholder="9876543210"
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full pl-20 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                placeholder="contact@sahyadriexplorers.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              About Your Organization
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                name="description"
                rows={3}
                placeholder="Tell trekkers about your experience, specializations, and what makes your treks unique..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            You can add bank details, logo, and more in Settings later.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

"use client";

import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import type {
  ReportConfig,
  ReportResponse,
  ReportMetric,
  AggregateFunction,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ReportBuilderPage() {
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report configuration state
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetric[]>([]);
  const [aggregateFunction, setAggregateFunction] =
    useState<AggregateFunction>("Count");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [injuryTypeFilter, setInjuryTypeFilter] = useState<string[]>([]);
  const [bodyPartFilter, setBodyPartFilter] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [includeTestData, setIncludeTestData] = useState(false);
  const [exportFormat, _setExportFormat] = useState<"json" | "csv">("json");

  // Available options
  const availableMetrics: ReportMetric[] = [
    "Injury Count",
    "Active Injuries",
    "Recovered Injuries",
    "Chronic Injuries",
    "Average Recovery Days",
    "Total Recovery Days",
    "Minor Injuries Count",
    "Moderate Injuries Count",
    "Severe Injuries Count",
    "Critical Injuries Count",
    "Injuries by Body Part",
    "Injuries by Type",
    "Players Affected",
    "Re-injury Rate",
  ];

  const aggregateFunctions: AggregateFunction[] = [
    "Total",
    "Minimum",
    "Maximum",
    "Average",
    "Count",
  ];

  const statusOptions = [
    "Active",
    "Recovering",
    "Recovered",
    "Chronic",
    "Re-injured",
  ];
  const severityOptions = ["Minor", "Moderate", "Severe", "Critical"];
  const injuryTypeOptions = [
    "Muscle Strain",
    "Ligament Sprain",
    "Tendon Injury",
    "Fracture",
    "Dislocation",
    "Concussion",
    "Contusion",
    "Laceration",
    "Overuse Injury",
  ];
  const bodyPartOptions = [
    "Knee",
    "Ankle",
    "Shoulder",
    "Hip",
    "Lower Back",
    "Hamstring",
    "Wrist",
    "Elbow",
  ];

  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, router]);

  const handleGenerateReport = async () => {
    if (selectedMetrics.length === 0) {
      setError("Please select at least one metric");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: ReportConfig = {
        metrics: selectedMetrics,
        aggregateFunction,
        statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
        severityFilter: severityFilter.length > 0 ? severityFilter : undefined,
        injuryTypeFilter:
          injuryTypeFilter.length > 0 ? injuryTypeFilter : undefined,
        bodyPartFilter: bodyPartFilter.length > 0 ? bodyPartFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        includeTestData,
        exportFormat,
      };

      const report = await apiClient.buildReport(config);
      setReportData(report);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
      console.error("Report generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!reportData) return;

    try {
      const config: ReportConfig = {
        metrics: selectedMetrics,
        aggregateFunction,
        statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
        severityFilter: severityFilter.length > 0 ? severityFilter : undefined,
        injuryTypeFilter:
          injuryTypeFilter.length > 0 ? injuryTypeFilter : undefined,
        bodyPartFilter: bodyPartFilter.length > 0 ? bodyPartFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        includeTestData,
        exportFormat: "csv",
      };

      const csvReport = await apiClient.buildReport(config);

      // Create a blob and download
      const blob = new Blob([csvReport.data as any], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `injury-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export CSV");
    }
  };

  const toggleArrayValue = (
    array: string[],
    value: string,
    setter: (arr: string[]) => void,
  ) => {
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  const toggleMetric = (metric: ReportMetric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const displayName = user.email.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Report Builder</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              ← Back to Dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Status Filter */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">STATUS</h2>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      toggleArrayValue(statusFilter, status, setStatusFilter)
                    }
                    className={`px-3 py-1.5 rounded-md text-sm transition ${
                      statusFilter.includes(status)
                        ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                        : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">SEVERITY</h2>
              <div className="flex flex-wrap gap-2">
                {severityOptions.map((severity) => (
                  <button
                    key={severity}
                    onClick={() =>
                      toggleArrayValue(
                        severityFilter,
                        severity,
                        setSeverityFilter,
                      )
                    }
                    className={`px-3 py-1.5 rounded-md text-sm transition ${
                      severityFilter.includes(severity)
                        ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                        : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            {/* Injury Type Filter */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">INJURY TYPE</h2>
              <div className="flex flex-wrap gap-2">
                {injuryTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      toggleArrayValue(
                        injuryTypeFilter,
                        type,
                        setInjuryTypeFilter,
                      )
                    }
                    className={`px-3 py-1.5 rounded-md text-sm transition ${
                      injuryTypeFilter.includes(type)
                        ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                        : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Part Filter */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">BODY PART</h2>
              <div className="flex flex-wrap gap-2">
                {bodyPartOptions.map((part) => (
                  <button
                    key={part}
                    onClick={() =>
                      toggleArrayValue(bodyPartFilter, part, setBodyPartFilter)
                    }
                    className={`px-3 py-1.5 rounded-md text-sm transition ${
                      bodyPartFilter.includes(part)
                        ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                        : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">DATE RANGE</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">OPTIONS</h2>
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTestData}
                  onChange={(e) => setIncludeTestData(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                />
                <span>Include Test Data</span>
              </label>
            </div>

            {/* Aggregate Function */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">FUNCTION</h2>
              <div className="space-y-2">
                {aggregateFunctions.map((func) => (
                  <label
                    key={func}
                    className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white transition"
                  >
                    <input
                      type="radio"
                      name="function"
                      checked={aggregateFunction === func}
                      onChange={() => setAggregateFunction(func)}
                      className="w-4 h-4"
                    />
                    <span>{func}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">SHOW</h2>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableMetrics.map((metric) => (
                  <label
                    key={metric}
                    className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={() => toggleMetric(metric)}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                    />
                    <span className="text-sm">{metric}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={loading || selectedMetrics.length === 0}
              className="w-full py-3 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-lg transition"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Report Results</h2>
              {reportData && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {!reportData && !error && (
              <div className="text-center py-12 text-gray-500">
                <p>The report did not contain any data</p>
                <p className="text-sm mt-2">
                  Select filters and metrics, then click Generate Report
                </p>
              </div>
            )}

            {reportData && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Records:</span>
                      <span className="text-white ml-2 font-semibold">
                        {reportData.totalRecords}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Generated:</span>
                      <span className="text-white ml-2 font-semibold">
                        {new Date(reportData.generatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Function:</span>
                      <span className="text-lime-400 ml-2 font-semibold">
                        {reportData.aggregateFunction}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Metrics:</span>
                      <span className="text-white ml-2 font-semibold">
                        {reportData.data.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {reportData.data.map((item, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-semibold">
                          {item.metric}
                        </h3>
                        <span className="text-lime-400 text-xl font-bold">
                          {item.value}
                        </span>
                      </div>

                      {item.breakdown && (
                        <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
                          <p className="text-gray-400 text-sm mb-2">
                            Breakdown:
                          </p>
                          {Object.entries(item.breakdown).map(([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-300">{key}</span>
                              <span className="text-white font-semibold">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

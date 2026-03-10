"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import type {
  ReportConfig,
  ReportResponse,
  ReportMetric,
  AggregateFunction,
} from "@/lib/api";

interface ReportBuilderProps {
  entityType: "injuries" | "players" | "coaches" | "parents";
  additionalFilters?: {
    playerId?: string;
    teamId?: string;
    coachId?: string;
    parentId?: string;
  };
}

interface FilterConfig {
  label: string;
  key: string;
  options: string[];
}

// Entity-specific metrics based on the data in each table
const ENTITY_METRICS: Record<string, ReportMetric[]> = {
  injuries: [
    "Injury Count",
    "Active Injuries",
    "Recovered Injuries",
    "Chronic Injuries",
    "Average Recovery Days",
    "Total Recovery Days",
    "Minimum Recovery Days",
    "Maximum Recovery Days",
    "Minor Injuries Count",
    "Moderate Injuries Count",
    "Severe Injuries Count",
    "Critical Injuries Count",
    "Injuries by Body Part",
    "Injuries by Type",
    "Players Affected",
    "Re-injury Rate",
  ],
  players: [
    "Injury Count",
    "Active Injuries",
    "Average Recovery Days",
    "Injuries by Type",
    "Injuries by Body Part",
  ],
  coaches: [
    "Injury Count",
    "Players Affected",
    "Injuries by Type",
    "Injuries by Body Part",
  ],
  parents: ["Injury Count", "Active Injuries", "Injuries by Type"],
};

// Entity-specific filters based on the columns in each table
const ENTITY_FILTERS: Record<string, FilterConfig[]> = {
  injuries: [
    {
      label: "STATUS",
      key: "statusFilter",
      options: ["Active", "Recovering", "Recovered", "Chronic", "Re-injured"],
    },
    {
      label: "SEVERITY",
      key: "severityFilter",
      options: ["Minor", "Moderate", "Severe", "Critical"],
    },
    {
      label: "INJURY TYPE",
      key: "injuryTypeFilter",
      options: [
        "Muscle Strain",
        "Ligament Sprain",
        "Tendon Injury",
        "Fracture",
        "Dislocation",
        "Concussion",
        "Contusion",
        "Laceration",
        "Overuse Injury",
      ],
    },
    {
      label: "BODY PART",
      key: "bodyPartFilter",
      options: [
        "Knee",
        "Ankle",
        "Shoulder",
        "Hip",
        "Lower Back",
        "Hamstring",
        "Wrist",
        "Elbow",
      ],
    },
  ],
  players: [
    {
      label: "STATUS",
      key: "statusFilter",
      options: ["Active", "Inactive"],
    },
    {
      label: "INJURY STATUS",
      key: "injuryStatusFilter",
      options: ["Active", "Recovering", "Recovered", "Chronic"],
    },
    {
      label: "INJURY TYPE",
      key: "injuryTypeFilter",
      options: ["Muscle Strain", "Ligament Sprain", "Fracture", "Concussion"],
    },
  ],
  coaches: [
    {
      label: "STATUS",
      key: "statusFilter",
      options: ["Active", "Inactive"],
    },
    {
      label: "TEAM INJURY STATUS",
      key: "injuryStatusFilter",
      options: ["Active", "Recovering", "Recovered"],
    },
  ],
  parents: [
    {
      label: "STATUS",
      key: "statusFilter",
      options: ["Active", "Inactive"],
    },
    {
      label: "CHILD INJURY STATUS",
      key: "injuryStatusFilter",
      options: ["Active", "Recovering", "Recovered"],
    },
  ],
};

export default function ReportBuilder({
  entityType,
  additionalFilters,
}: ReportBuilderProps) {
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Report configuration state
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetric[]>([]);
  const [aggregateFunction, setAggregateFunction] =
    useState<AggregateFunction>("Count");

  // Dynamic filters based on entity type
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [includeTestData, setIncludeTestData] = useState(false);

  const availableMetrics = ENTITY_METRICS[entityType] || [];
  const availableFilters = ENTITY_FILTERS[entityType] || [];

  const aggregateFunctions: AggregateFunction[] = [
    "Total",
    "Minimum",
    "Maximum",
    "Average",
    "Count",
  ];

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
        statusFilter:
          filters.statusFilter?.length > 0 ? filters.statusFilter : undefined,
        severityFilter:
          filters.severityFilter?.length > 0
            ? filters.severityFilter
            : undefined,
        injuryTypeFilter:
          filters.injuryTypeFilter?.length > 0
            ? filters.injuryTypeFilter
            : undefined,
        bodyPartFilter:
          filters.bodyPartFilter?.length > 0
            ? filters.bodyPartFilter
            : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        includeTestData,
        exportFormat: "json",
        ...additionalFilters,
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
        statusFilter:
          filters.statusFilter?.length > 0 ? filters.statusFilter : undefined,
        severityFilter:
          filters.severityFilter?.length > 0
            ? filters.severityFilter
            : undefined,
        injuryTypeFilter:
          filters.injuryTypeFilter?.length > 0
            ? filters.injuryTypeFilter
            : undefined,
        bodyPartFilter:
          filters.bodyPartFilter?.length > 0
            ? filters.bodyPartFilter
            : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        includeTestData,
        exportFormat: "csv",
        ...additionalFilters,
      };

      const csvReport = await apiClient.buildReport(config);

      const blob = new Blob([csvReport.data as any], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityType}-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export CSV");
    }
  };

  const toggleFilterValue = (filterKey: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterKey] || [];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [filterKey]: currentValues.filter((v) => v !== value),
        };
      } else {
        return {
          ...prev,
          [filterKey]: [...currentValues, value],
        };
      }
    });
  };

  const toggleMetric = (metric: ReportMetric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header with Expand/Collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">Report Builder</h2>
            <p className="text-sm text-gray-400">
              Generate custom reports and analytics
            </p>
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-4">
              {/* Dynamic Filters */}
              {availableFilters.map((filterConfig) => (
                <div key={filterConfig.key}>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {filterConfig.label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {filterConfig.options.map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          toggleFilterValue(filterConfig.key, option)
                        }
                        className={`px-3 py-1.5 rounded-md text-sm transition ${
                          (filters[filterConfig.key] || []).includes(option)
                            ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                            : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Date Range */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  DATE RANGE
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Aggregate Function */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  FUNCTION
                </h3>
                <div className="space-y-1">
                  {aggregateFunctions.map((func) => (
                    <label
                      key={func}
                      className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition"
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
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">SHOW</h3>
                <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-800 rounded-md p-3">
                  {availableMetrics.map((metric) => (
                    <label
                      key={metric}
                      className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric)}
                        onChange={() => toggleMetric(metric)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                      />
                      <span>{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTestData}
                  onChange={(e) => setIncludeTestData(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                />
                <span>Include Test Data</span>
              </label>

              {/* Generate Button */}
              <button
                onClick={handleGenerateReport}
                disabled={loading || selectedMetrics.length === 0}
                className="w-full py-2.5 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-lg transition"
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>
            </div>

            {/* Right Panel - Results */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Results</h3>
                {reportData && (
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                  >
                    Download CSV
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {!reportData && !error && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm">
                    Select metrics and click Generate Report
                  </p>
                </div>
              )}

              {reportData && (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400">Total Records:</span>
                        <span className="text-white ml-2 font-semibold">
                          {reportData.totalRecords}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Function:</span>
                        <span className="text-lime-400 ml-2 font-semibold">
                          {reportData.aggregateFunction}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reportData.data.map((item, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-white font-semibold text-sm">
                            {item.metric}
                          </h4>
                          <span className="text-lime-400 text-lg font-bold">
                            {item.value}
                          </span>
                        </div>

                        {item.breakdown && (
                          <div className="mt-2 space-y-1 border-t border-gray-700 pt-2">
                            <p className="text-gray-400 text-xs mb-1">
                              Breakdown:
                            </p>
                            {Object.entries(item.breakdown).map(
                              ([key, val]) => (
                                <div
                                  key={key}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <span className="text-gray-300">{key}</span>
                                  <span className="text-white font-semibold">
                                    {val}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

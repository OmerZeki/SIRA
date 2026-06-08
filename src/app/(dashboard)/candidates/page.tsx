"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { StatusBadge } from "@/components/sira/StatusBadge";
import {
  Search,
  Download,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  passportNumber: string;
  gender: string;
  status: string;
  dateOfExpiry: string;
  passportPhotoUrl: string | null;
  lmisStatus: string | null;
  musanedStatus: string | null;
  nationality: string;
  createdAt: string;
}

export default function CandidatesPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [data, setData] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ limit: "200" });
        if (statusFilter) params.append("status", statusFilter);
        const res = await fetch(`/api/applicants?${params}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.applicants || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const columns: ColumnDef<Applicant>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-hairline"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-hairline"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "passportPhotoUrl",
        header: "Photo",
        cell: ({ row }) =>
          row.original.passportPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.original.passportPhotoUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-hairline"
            />
          ) : (
            <UserCircle2 className="w-7 h-7 text-ink-tertiary" />
          ),
        size: 60,
        enableSorting: false,
      },
      {
        accessorFn: (r) => `${r.firstName} ${r.lastName}`,
        id: "name",
        header: t.candidates.tableName,
        cell: ({ row }) => (
          <Link
            href={`/candidates/${row.original.id}`}
            className="font-semibold text-ink hover:text-primary text-sm"
          >
            {row.original.firstName} {row.original.lastName}
          </Link>
        ),
      },
      {
        accessorKey: "passportNumber",
        header: t.candidates.tablePassport,
        cell: ({ getValue }) => (
          <span className="font-mono text-[11px] text-ink-muted">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t.candidates.tableStatus,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as any} />
        ),
      },
      {
        accessorKey: "dateOfExpiry",
        header: t.form.passportExpiry.replace("*", "").trim(),
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          const daysLeft = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-muted">
                {date.toLocaleDateString("en-GB")}
              </span>
              {daysLeft < 60 && (
                <AlertCircle className="w-3.5 h-3.5 text-error" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "lmisStatus",
        header: t.candidates.tableLmis,
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          if (!v) return <span className="text-[10px] text-ink-tertiary">—</span>;
          const colors: Record<string, string> = {
            COMPLETED: "text-success",
            FAILED: "text-error",
            PENDING: "text-warning",
            PROCESSING: "text-primary",
          };
          return (
            <span className={`text-[10px] font-semibold ${colors[v] || "text-ink-muted"}`}>
              {v}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/candidates/${row.original.id}`}
            className="text-[11px] font-medium text-primary hover:text-primary-hover"
          >
            {t.candidates.viewDetail.split(" ")[0]}
          </Link>
        ),
        size: 60,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-headline text-ink font-semibold">{t.candidates.title}</h2>
          <p className="text-xs text-ink-subtle">
            {data.length} {t.candidates.subtitle.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={async () => {
                const selectedIds = table
                  .getSelectedRowModel()
                  .rows.map((r) => r.original.id);
                try {
                  const res = await fetch("/api/export/excel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: selectedIds }),
                  });
                  if (!res.ok) throw new Error("Export failed");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `SIRA_Export_${new Date().toISOString().split("T")[0]}_${selectedIds.length}_candidates.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                } catch {
                  alert("Failed to export selected candidates.");
                }
              }}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {t.common.save} {selectedCount}
            </button>
          )}
          <Link href="/candidates/new" className="btn-primary flex items-center gap-1.5 text-xs py-2">
            <Plus className="w-4 h-4" />
            {t.candidates.newCandidate}
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t.candidates.searchPlaceholder}
            className="w-full input-text pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-text bg-surface-1 min-w-40"
        >
          <option value="">{t.candidates.filterStatus}</option>
          <option value="REGISTERED">{t.status.REGISTERED}</option>
          <option value="MEDICAL_APPROVED">{t.status.MEDICAL_APPROVED}</option>
          <option value="LMIS_CLEAR">{t.status.LMIS_CLEAR}</option>
          <option value="MUSANED_CONTRACTED">{t.status.MUSANED_CONTRACTED}</option>
          <option value="ENJAZ_COMPLETED">{t.status.ENJAZ_COMPLETED}</option>
          <option value="FLIGHT_READY">{t.status.FLIGHT_READY}</option>
          <option value="ON_HOLD">{t.status.ON_HOLD}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-hairline">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider"
                          style={{ width: header.getSize() }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1 cursor-pointer select-none">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() &&
                              (header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : null)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-center py-12 text-ink-tertiary text-sm"
                      >
                        {t.candidates.noCandidates}{" "}
                        <Link href="/candidates/new" className="text-primary hover:underline">
                          {t.candidates.newCandidate.toLowerCase()}
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const expiry = new Date(row.original.dateOfExpiry);
                      const daysLeft = Math.round(
                        (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-hairline hover:bg-surface-2 transition-colors ${
                            daysLeft < 60 ? "bg-error/5" : daysLeft < 180 ? "bg-warning/5" : ""
                          }`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-hairline flex items-center justify-between text-xs text-ink-muted">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} —{" "}
                {table.getFilteredRowModel().rows.length} results
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded hover:bg-surface-2 disabled:opacity-30"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded hover:bg-surface-2 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded hover:bg-surface-2 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded hover:bg-surface-2 disabled:opacity-30"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

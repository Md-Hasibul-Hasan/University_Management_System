"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadXlsx } from "@/lib/xlsx";

/**
 * Downloads a table as a real .xlsx workbook.
 *
 * @param {object}   props
 * @param {string}   props.fileName   Downloaded file name (e.g. "marks.xlsx").
 * @param {string}   [props.sheetName] Worksheet tab name.
 * @param {Array}    props.columns    [{ label, width? }]
 * @param {Array}    props.rows       (string | number | null)[][] — row-aligned with columns.
 * @param {string}   [props.label]    Button text.
 * @param {boolean}  [props.disabled] Extra disable condition (e.g. not published).
 */
export default function ExcelExportButton({
  fileName = "export.xlsx",
  sheetName = "Sheet1",
  columns = [],
  rows = [],
  label = "Export Excel",
  disabled = false,
  variant = "default",
  size = "sm",
  className,
}) {
  const canExport = !disabled && columns.length > 0 && rows.length > 0;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={!canExport}
      onClick={() => downloadXlsx({ fileName, sheetName, columns, rows })}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}

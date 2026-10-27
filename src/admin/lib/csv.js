/** Downloads rows as a UTF-8 CSV that Excel opens correctly. */
export function downloadCsv(filename, columns, rows) {
  const cell = (v) => {
    const s = v == null ? '' : String(v)
    // Neutralise spreadsheet formulas in user-entered text.
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s
    return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
  }
  const lines = [columns.map((c) => cell(c.label)).join(','), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(','))]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const stamp = () => new Date().toISOString().slice(0, 10)

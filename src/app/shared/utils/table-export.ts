import { copyText } from './clipboard';

/** Una columna exportable: su encabezado y cómo leer su valor de cada fila. */
export interface ExportColumn<T> {
  readonly header: string;
  readonly value: (row: T) => ExportValue;
}

type ExportValue = string | number | null | undefined;

/**
 * Colores del documento exportado.
 */
const EXPORT_COLORS = {
  text: '#0F172A',
  muted: '#64748B',
  border: '#CBD5E1',
  headerFill: '#F1F5F9',
  stripeFill: '#F8FAFC',
} as const;

/**
 * Copia la tabla al portapapeles separada por tabuladores e informa si funcionó.
 */
export function copyTableToClipboard<T>(
  data: readonly T[],
  columns: readonly ExportColumn<T>[],
): Promise<boolean> {
  const toCell = (value: ExportValue): string => toText(value).replace(/[\t\r\n]/g, ' ');
  const lines = [
    columns.map((column) => toCell(column.header)).join('\t'),
    ...data.map((row) => columns.map((column) => toCell(column.value(row))).join('\t')),
  ];
  return copyText(lines.join('\n'));
}

/** Descarga la tabla como archivo CSV en UTF-8. */
export function exportTableToCsv<T>(
  filename: string,
  data: readonly T[],
  columns: readonly ExportColumn<T>[],
): void {
  const toCell = (value: ExportValue): string => `"${toText(value).replace(/"/g, '""')}"`;
  const lines = [
    columns.map((column) => toCell(column.header)).join(','),
    ...data.map((row) => columns.map((column) => toCell(column.value(row))).join(',')),
  ];

  // El BOM es lo que hace que Excel en Windows abra el archivo como UTF-8
  const content = '\uFEFF' + lines.join('\r\n');
  downloadBlob(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
    withExtension(filename, 'csv'),
  );
}

/**
 * Descarga la tabla como libro de Excel en formato XML Spreadsheet 2003.
 */
export function exportTableToExcel<T>(
  filename: string,
  sheetName: string,
  data: readonly T[],
  columns: readonly ExportColumn<T>[],
): void {
  const headerRow = columns
    .map(
      (column) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeMarkup(column.header)}</Data></Cell>`,
    )
    .join('');

  const bodyRows = data
    .map((row) => {
      const cells = columns.map((column) => {
        const value = column.value(row);
        return typeof value === 'number' && Number.isFinite(value)
          ? `<Cell ss:StyleID="Number"><Data ss:Type="Number">${value}</Data></Cell>`
          : `<Cell ss:StyleID="Text"><Data ss:Type="String">${escapeMarkup(value)}</Data></Cell>`;
      });
      return `<Row>${cells.join('')}</Row>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${EXPORT_COLORS.text}"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${EXPORT_COLORS.border}"/></Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="${EXPORT_COLORS.text}"/>
   <Interior ss:Color="${EXPORT_COLORS.headerFill}" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Number"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>
  <Style ss:ID="Text"><Alignment ss:Horizontal="Left"/></Style>
 </Styles>
 <Worksheet ss:Name="${escapeMarkup(sheetName)}">
  <Table>
<Row>${headerRow}</Row>
${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }),
    withExtension(filename, 'xls'),
  );
}

/**
 * Abre la tabla en una ventana nueva y lanza el diálogo de impresión.
 */
export function printTable<T>(
  title: string,
  subtitle: string,
  data: readonly T[],
  columns: readonly ExportColumn<T>[],
): boolean {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    return false;
  }

  const generatedAt = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const meta = [subtitle, `Generado el ${generatedAt}`].filter(Boolean).join(' • ');
  const headerCells = columns.map((column) => `<th>${escapeMarkup(column.header)}</th>`).join('');
  const bodyRows = data
    .map(
      (row) =>
        `<tr>${columns.map((column) => `<td>${escapeMarkup(column.value(row))}</td>`).join('')}</tr>`,
    )
    .join('');

  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeMarkup(title)}</title>
  <style>
    body {
      font-family: "Segoe UI", Roboto, sans-serif;
      color: ${EXPORT_COLORS.text};
      margin: 0;
      padding: 2rem;
      font-size: 0.75rem;
    }
    header {
      border-bottom: 2px solid ${EXPORT_COLORS.text};
      padding-bottom: 0.75rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.25rem;
      margin: 0 0 0.25rem;
    }
    p {
      color: ${EXPORT_COLORS.muted};
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid ${EXPORT_COLORS.border};
      padding: 0.375rem 0.625rem;
      text-align: left;
    }
    th {
      background: ${EXPORT_COLORS.headerFill};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    tr:nth-child(even) td {
      background: ${EXPORT_COLORS.stripeFill};
    }
    @media print {
      body {
        padding: 0;
      } @page {
        margin: 1.5cm;
      }
    }
  </style>
</head>
<body>
  <header><h1>${escapeMarkup(title)}</h1><p>${escapeMarkup(meta)}</p></header>
  <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
  <script>
    window.addEventListener('afterprint', () => window.close());
    window.addEventListener('load', () => window.print());
  </script>
</body>
</html>`);
  // El script va dentro del documento porque `document.write` borra los
  // listeners que se registren desde aquí antes de escribir.
  printWindow.document.close();
  return true;
}

function toText(value: ExportValue): string {
  return value === null || value === undefined ? '' : String(value);
}

/** Escapa los caracteres que romperían el XML de Excel o el HTML de impresión. */
function escapeMarkup(value: ExportValue): string {
  return toText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function withExtension(filename: string, extension: string): string {
  return filename.toLowerCase().endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
}

export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number;
}

export function parseCsv(content: string) {
  const text = content.replace(/^\uFEFF/, '');
  const separator = (text.split(/\r?\n/, 1)[0].match(/;/g)?.length ?? 0) >= (text.split(/\r?\n/, 1)[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers = [], ...data] = rows;
  return data.filter((values) => values.some((value) => value.trim())).map((values) => Object.fromEntries(headers.map((header, index) => [header.trim().toLocaleLowerCase('pt-BR'), values[index]?.trim() ?? ''])));
}

export function exportCsv<T>(columns: CsvColumn<T>[], rows: T[], filename: string) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const content = [
    columns.map((column) => escape(column.label)).join(';'),
    ...rows.map((row) => columns.map((column) => escape(column.value(row))).join(';')),
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
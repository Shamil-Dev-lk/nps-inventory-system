export function exportToCsv(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;

  // Extract headers
  const headers = Object.keys(rows[0]).filter(key => typeof rows[0][key as keyof typeof rows[0]] !== 'object');
  
  const csvContent = [
    headers.join(','), // Header row
    ...rows.map(row => 
      headers.map(header => {
        const cell = row[header as keyof typeof row];
        // Escape quotes and wrap in quotes if there's a comma
        const cellStr = cell !== null && cell !== undefined ? String(cell) : '';
        return `"${cellStr.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

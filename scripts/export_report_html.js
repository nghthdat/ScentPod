const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'bao_cao_ai_prompt_engineering_v3.0.md');
const htmlPath = path.join(__dirname, '..', 'bao_cao_ai_prompt_engineering_v3.0.html');

if (!fs.existsSync(mdPath)) {
  console.error('Không tìm thấy tệp markdown:', mdPath);
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');

// Simple, robust markdown to HTML converter for academic document
function markdownToHtml(md) {
  const lines = md.split('\n');
  let html = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = [];
  let inTable = false;
  let tableHeaderDone = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        html.push(`<pre><code class="language-${codeLang}">${escapeHtml(codeContent.join('\n'))}</code></pre>`);
        inCodeBlock = false;
        codeContent = [];
      } else {
        if (inList) { html.push('</ul>'); inList = false; }
        if (inTable) { html.push('</tbody></table></div>'); inTable = false; tableHeaderDone = false; }
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(line.trim());
      if (isSeparator) {
        tableHeaderDone = true;
        continue;
      }

      const cells = line.trim().slice(1, -1).split('|').map(c => c.trim());

      if (!inTable) {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push('<div class="table-container"><table>');
        html.push('<thead><tr>' + cells.map(c => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead><tbody>');
        inTable = true;
      } else {
        html.push('<tr>' + cells.map(c => `<td>${formatInline(c)}</td>`).join('') + '</tr>');
      }
      continue;
    } else if (inTable) {
      html.push('</tbody></table></div>');
      inTable = false;
      tableHeaderDone = false;
    }

    // Empty line
    if (!line.trim()) {
      if (inList) { html.push('</ul>'); inList = false; }
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h4>${formatInline(line.slice(5))}</h4>`);
      continue;
    }

    // Blockquote / Alerts
    if (line.startsWith('> ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      let content = line.slice(2);
      let alertClass = 'alert-info';
      if (content.includes('[!NOTE]')) { alertClass = 'alert-note'; content = content.replace('[!NOTE]', ''); }
      else if (content.includes('[!IMPORTANT]')) { alertClass = 'alert-important'; content = content.replace('[!IMPORTANT]', ''); }
      else if (content.includes('[!WARNING]')) { alertClass = 'alert-warning'; content = content.replace('[!WARNING]', ''); }
      else if (content.includes('[!TIP]')) { alertClass = 'alert-tip'; content = content.replace('[!TIP]', ''); }
      html.push(`<div class="alert ${alertClass}"><p>${formatInline(content)}</p></div>`);
      continue;
    }

    // Horizontal rule
    if (/^---{3,}$/.test(line.trim())) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<hr>');
      continue;
    }

    // List items
    if (/^[-*]\s+/.test(line.trim())) {
      if (!inList) { html.push('<ul>'); inList = true; }
      html.push(`<li>${formatInline(line.trim().replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    // Paragraph
    if (inList) { html.push('</ul>'); inList = false; }
    html.push(`<p>${formatInline(line)}</p>`);
  }

  if (inTable) html.push('</tbody></table></div>');
  if (inList) html.push('</ul>');
  if (inCodeBlock) html.push(`<pre><code>${escapeHtml(codeContent.join('\n'))}</code></pre>`);

  return html.join('\n');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatInline(str) {
  let s = escapeHtml(str);
  // Bold & Italic
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return s;
}

const bodyHtml = markdownToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Nghiên Cứu Kỹ Thuật AI Prompt Engineering & AI Skills - ScentPod v3.0</title>
  <style>
    :root {
      --primary: #1e3a8a;
      --accent: #b45309;
      --bg: #ffffff;
      --text: #1f2937;
      --text-muted: #4b5563;
      --border: #e5e7eb;
      --code-bg: #f3f4f6;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: var(--text);
      background: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .top-actions {
      position: sticky;
      top: 0;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      z-index: 100;
    }
    .top-actions .title {
      font-weight: 700;
      color: var(--primary);
      font-size: 14px;
    }
    .btn-print {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .document-page {
      max-width: 900px;
      margin: 24px auto;
      background: #ffffff;
      padding: 48px 56px;
      border-radius: 8px;
      border: 1px solid var(--border);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    h1 {
      font-size: 26px;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-top: 0;
      line-height: 1.3;
    }
    h2 {
      font-size: 20px;
      color: var(--primary);
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-top: 36px;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 16.5px;
      color: #334155;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h4 {
      font-size: 15px;
      color: #475569;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p {
      margin: 0 0 14px 0;
    }
    ul, ol {
      margin: 0 0 16px 0;
      padding-left: 24px;
    }
    li {
      margin-bottom: 6px;
    }
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin: 20px 0;
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 600;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: #fdfdfd;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
      margin: 18px 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      background: var(--code-bg);
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 32px 0;
    }
    .alert {
      padding: 12px 16px;
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      border-radius: 0 6px 6px 0;
      margin: 16px 0;
      font-size: 14px;
    }
    .alert-important {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    .alert-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    .alert-note {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }
    .alert-tip {
      border-left-color: #10b981;
      background: #ecfdf5;
    }
    @media print {
      body {
        background: #ffffff;
        font-size: 11pt;
      }
      .top-actions {
        display: none;
      }
      .document-page {
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      h1, h2, h3 {
        page-break-after: avoid;
      }
      tr, pre, .alert {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <div class="top-actions">
    <div class="title">📄 BÁO CÁO HỌC THUẬT SCENTPOD - PHIÊN BẢN 3.0</div>
    <div style="display: flex; gap: 10px;">
      <button type="button" class="btn-print" onclick="window.print()">🖨️ In / Lưu ra PDF (Cmd + P)</button>
    </div>
  </div>

  <main class="document-page">
    ${bodyHtml}
  </main>

</body>
</html>
`;

fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log('✅ Đã tạo tệp HTML thành công tại:', htmlPath);


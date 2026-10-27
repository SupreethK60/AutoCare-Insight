import os
import subprocess
import markdown_it

md_path = os.path.join(os.path.dirname(__file__), 'PROJECT_REPORT.md')
html_path = os.path.join(os.path.dirname(__file__), 'PROJECT_REPORT.html')
pdf_path = os.path.join(os.path.dirname(__file__), 'AutoCare_Insight_Project_Report.pdf')

with open(md_path, 'r', encoding='utf-8') as f:
    text = f.read()

md = markdown_it.MarkdownIt('commonmark').enable('table')
html_content = md.render(text)

styled_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AutoCare Insight — DBMS Experiential Learning Project Report</title>
  <style>
    @page {{
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {{
        content: counter(page);
      }}
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }}
    h1 {{
      color: #0f172a;
      font-size: 20pt;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-top: 24pt;
      margin-bottom: 12pt;
      page-break-after: avoid;
    }}
    h2 {{
      color: #1e3a8a;
      font-size: 14pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 18pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
    }}
    h3 {{
      color: #334155;
      font-size: 11.5pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
    }}
    p, li {{
      color: #334155;
      text-align: justify;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }}
    th, td {{
      border: 1px solid #cbd5e1;
      padding: 5pt 7pt;
      text-align: left;
    }}
    th {{
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }}
    tr:nth-child(even) {{
      background-color: #f8fafc;
    }}
    pre, code {{
      font-family: "Cascadia Code", "Courier New", Courier, monospace;
      font-size: 8.5pt;
      background-color: #f8fafc;
      border-radius: 4px;
    }}
    pre {{
      border: 1px solid #e2e8f0;
      padding: 8pt;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      page-break-inside: avoid;
      background-color: #f8fafc;
      color: #0f172a;
    }}
    p code, li code {{
      padding: 1pt 3pt;
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #0369a1;
    }}
    blockquote {{
      border-left: 4px solid #2563eb;
      margin: 0;
      padding-left: 10pt;
      color: #475569;
      font-style: italic;
    }}
    .cover {{
      text-align: center;
      padding-top: 40pt;
      padding-bottom: 60pt;
      page-break-after: always;
    }}
    .cover h1 {{
      font-size: 26pt;
      color: #1e3a8a;
      border: none;
      margin-bottom: 10pt;
    }}
    .cover p {{
      text-align: center;
      font-size: 12pt;
      color: #475569;
    }}
    .cover-meta {{
      margin-top: 80pt;
      border-top: 1px solid #cbd5e1;
      padding-top: 20pt;
    }}
  </style>
</head>
<body>
  {html_content}
</body>
</html>"""

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(styled_html)

print(f"Wrote HTML to {html_path}")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    f"--print-to-pdf={pdf_path}",
    html_path
]

res = subprocess.run(cmd, capture_output=True, text=True)
print(f"Chrome return code: {res.returncode}")
if os.path.exists(pdf_path):
    print(f"Generated PDF successfully: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")
else:
    print(f"PDF creation failed. Stderr: {res.stderr}")

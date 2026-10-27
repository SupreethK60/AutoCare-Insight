const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Parse a single CSV line with support for quoted strings containing commas
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 1 && !values[0]) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : null;
    });
    rows.push(row);
  }
  return rows;
}

function cleanNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

function cleanInt(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(String(val).replace(/[^0-9-]/g, ''), 10);
  return isNaN(num) ? null : num;
}

function cleanStr(val, maxLen = 100) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') return null;
  return s.length > maxLen ? s.substring(0, maxLen) : s;
}

async function run() {
  console.log('Connecting to MySQL autocare_insight...');
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Simha@1234',
    database: process.env.MYSQL_DATABASE || 'autocare_insight'
  });

  console.log('Connected successfully!');

  const baseDir = path.join(__dirname, '..', 'vehicle_management');

  // 1. Light Duty Vehicles (LDV)
  const ldvPath = path.join(baseDir, 'Light Duty Vehicles.csv');
  console.log(`Loading: ${ldvPath}`);
  const ldvRows = parseCsvFile(ldvPath);
  console.log(`Parsed ${ldvRows.length} rows from Light Duty Vehicles.csv`);

  let ldvInserted = 0;
  for (const r of ldvRows) {
    const manufacturer = cleanStr(r['Manufacturer'], 100);
    const model = cleanStr(r['Model'], 100);
    const year = cleanInt(r['Model Year']);
    if (!manufacturer || !model || !year) continue;

    const sql = `
      INSERT IGNORE INTO vehicle_catalogue (
        manufacturer, model, model_year, category, fuel, fuel_code,
        engine_type, engine_size, engine_cylinders, engine_description,
        transmission_type, drivetrain,
        alt_economy_city, alt_economy_hwy, alt_economy_combined,
        conv_economy_city, conv_economy_hwy, conv_economy_combined,
        electric_range, phev_total_range,
        source_dataset, source_vehicle_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'LDV', ?, ?)
    `;

    const params = [
      manufacturer,
      model,
      year,
      cleanStr(r['Category'], 100),
      cleanStr(r['Fuel'], 100),
      cleanStr(r['Fuel Code'], 20),
      cleanStr(r['Engine Type'], 50),
      cleanStr(r['Engine Size'], 20),
      cleanInt(r['Engine Cylinder Count']),
      cleanStr(r['Engine Description'], 100),
      cleanStr(r['Transmission Type'], 50),
      cleanStr(r['Drivetrain'], 20),
      cleanNum(r['Alternative Fuel Economy City']),
      cleanNum(r['Alternative Fuel Economy Highway']),
      cleanNum(r['Alternative Fuel Economy Combined']),
      cleanNum(r['Conventional Fuel Economy City']),
      cleanNum(r['Conventional Fuel Economy Highway']),
      cleanNum(r['Conventional Fuel Economy Combined']),
      cleanNum(r['Electric-Only Range']),
      cleanNum(r['PHEV Total Range']),
      cleanInt(r['Vehicle ID']),
      cleanStr(r['Notes'], 500)
    ];

    const [res] = await conn.execute(sql, params);
    if (res.affectedRows > 0) ldvInserted++;
  }
  console.log(`Successfully ingested ${ldvInserted} LDV vehicles into vehicle_catalogue.`);

  // 2. Alternative Fuel Vehicles US (AFV)
  const afvPath = path.join(baseDir, 'Alternative Fuel Vehicles US.csv');
  console.log(`Loading: ${afvPath}`);
  const afvRows = parseCsvFile(afvPath);
  console.log(`Parsed ${afvRows.length} rows from Alternative Fuel Vehicles US.csv`);

  let afvInserted = 0;
  for (const r of afvRows) {
    const manufacturer = cleanStr(r['Manufacturer'], 100);
    const model = cleanStr(r['Model'], 100);
    const year = cleanInt(r['Model Year']);
    if (!manufacturer || !model || !year) continue;

    const sql = `
      INSERT IGNORE INTO vehicle_catalogue (
        manufacturer, model, model_year, category, fuel,
        engine_type, engine_size, engine_cylinders,
        transmission_type, drivetrain,
        alt_economy_city, alt_economy_hwy, alt_economy_combined,
        conv_economy_city, conv_economy_hwy, conv_economy_combined,
        electric_range, phev_total_range, num_passengers, heavy_duty_power_system,
        source_dataset, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AFV', ?)
    `;

    const params = [
      manufacturer,
      model,
      year,
      cleanStr(r['Category'], 100),
      cleanStr(r['Fuel'], 100),
      cleanStr(r['Engine Type'], 50),
      cleanStr(r['Engine Size'], 20),
      cleanInt(r['Engine Cylinder Count']),
      cleanStr(r['Transmission Type'], 50),
      cleanStr(r['Drivetrain'], 20),
      cleanNum(r['Alternative Fuel Economy City']),
      cleanNum(r['Alternative Fuel Economy Highway']),
      cleanNum(r['Alternative Fuel Economy Combined']),
      cleanNum(r['Conventional Fuel Economy City']),
      cleanNum(r['Conventional Fuel Economy Highway']),
      cleanNum(r['Conventional Fuel Economy Combined']),
      cleanNum(r['All-Electric Range']),
      cleanNum(r['PHEV Total Range']),
      cleanInt(r['Number of Passengers']),
      cleanStr(r['Heavy-Duty Power System'], 100),
      cleanStr(r['Notes'], 500)
    ];

    const [res] = await conn.execute(sql, params);
    if (res.affectedRows > 0) afvInserted++;
  }
  console.log(`Successfully ingested ${afvInserted} AFV vehicles into vehicle_catalogue.`);

  // 3. Medium and Heavy Duty Vehicles (MHD)
  const mhdPath = path.join(baseDir, 'Medium and Heavy Duty Vehicles.csv');
  console.log(`Loading: ${mhdPath}`);
  const mhdRows = parseCsvFile(mhdPath);
  console.log(`Parsed ${mhdRows.length} rows from Medium and Heavy Duty Vehicles.csv`);

  let mhdInserted = 0;
  for (const r of mhdRows) {
    const manufacturer = cleanStr(r['Manufacturer'], 100);
    const model = cleanStr(r['Model'], 100);
    if (!manufacturer || !model) continue;

    const sql = `
      INSERT IGNORE INTO vehicle_catalogue (
        manufacturer, model, model_year, category, fuel,
        transmission_type, num_passengers, heavy_duty_power_system,
        source_dataset, source_vehicle_id
      ) VALUES (?, ?, 2022, ?, ?, ?, ?, ?, 'MHD', ?)
    `;

    const params = [
      manufacturer,
      model,
      cleanStr(r['Application Categories'], 100),
      cleanStr(r['Fuels'], 100),
      cleanStr(r['Transmission Types'], 50),
      cleanInt(r['Num Passengers']),
      cleanStr(r['Transmission Make'], 100),
      cleanInt(r['Vehicle ID'])
    ];

    const [res] = await conn.execute(sql, params);
    if (res.affectedRows > 0) mhdInserted++;
  }
  console.log(`Successfully ingested ${mhdInserted} MHD vehicles into vehicle_catalogue.`);

  // Final count
  const [counts] = await conn.execute('SELECT COUNT(*) AS total FROM vehicle_catalogue');
  console.log(`\n========================================`);
  console.log(`TOTAL VEHICLES IN CATALOGUE: ${counts[0].total}`);
  console.log(`========================================`);

  await conn.end();
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

// renderer.js - Electron IPC Functions for HydroFlow Calculator

// Current export format
let currentExportFormat = 'txt';

// Initialize event listeners when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in Electron environment
    if (window.electronAPI) {
        // Listen for "Export Logs" requests
        window.electronAPI.onExportLogs(({ scope }) => {
            exportLogs(scope);
        });

        window.electronAPI.onExportLogsFormat(({ format }) => {
            setExportFormat(format);
        });

        // Listen for "Switch Axes"
        window.electronAPI.onSwitchAxes(() => {
            switchChartAxes();
        });
    } else {
        console.log('Not running in Electron environment');
    }

    // Load SheetJS for XLSX export
    loadSheetJS();
});

// Set export format
function setExportFormat(format) {
    currentExportFormat = format;
    console.log(`Export format set to: ${format}`);
}

// Extract calculations from logs
function extractCalculations() {
    if (!window.appLogs || window.appLogs.length === 0) {
        return [];
    }

    const calculations = [];
    let currentCalculation = null;

    for (let i = 0; i < window.appLogs.length; i++) {
        const log = window.appLogs[i];
        const message = log.message;

        // Check if this is the start of a calculation (parameters line)
        if (message.includes('m = ') && message.includes('kóta hladiny = ') && message.includes('kóta přelivu = ')) {
            // If we have a previous calculation, save it
            if (currentCalculation) {
                calculations.push(currentCalculation);
            }
            
            // Start new calculation
            currentCalculation = {
                timestamp: log.timestamp,
                parameters: message,
                consumptionCurveInfo: '',
                levels: []
            };
        }
        // Check if this is consumption curve info
        else if (currentCalculation && message.includes('Generating consumption curve:')) {
            currentCalculation.consumptionCurveInfo = message;
        }
        // Check if this is a level calculation
        else if (currentCalculation && message.includes('Level ') && message.includes('cm: h = ') && message.includes('m, Q = ')) {
            currentCalculation.levels.push({
                message: message,
                timestamp: log.timestamp
            });
        }
        // Check if this is the end of a calculation
        else if (currentCalculation && message.includes('Chart generated with ') && message.includes('data points')) {
            currentCalculation.endMessage = message;
            calculations.push(currentCalculation);
            currentCalculation = null;
        }
    }

    // If we have an ongoing calculation at the end, add it
    if (currentCalculation) {
        calculations.push(currentCalculation);
    }

    return calculations;
}

// Remove duplicate calculations
function removeDuplicateCalculations(calculations) {
    if (calculations.length <= 1) {
        return calculations;
    }

    const uniqueCalculations = [];
    const seen = new Set();

    for (const calc of calculations) {
        // Create a unique signature for each calculation
        const signature = createCalculationSignature(calc);
        
        if (!seen.has(signature)) {
            seen.add(signature);
            uniqueCalculations.push(calc);
        }
    }

    console.log(`Removed ${calculations.length - uniqueCalculations.length} duplicate calculations`);
    return uniqueCalculations;
}

// Create unique signature for calculation comparison
function createCalculationSignature(calculation) {
    // Combine parameters, consumption curve info, and all level data
    let signature = calculation.parameters + '|' + calculation.consumptionCurveInfo + '|';
    
    // Sort levels by level number to ensure consistent ordering
    const sortedLevels = calculation.levels.slice().sort((a, b) => {
        const levelA = parseInt(a.message.match(/Level (\d+)cm/)?.[1] || 0);
        const levelB = parseInt(b.message.match(/Level (\d+)cm/)?.[1] || 0);
        return levelA - levelB;
    });
    
    // Add each level's data to signature
    for (const level of sortedLevels) {
        signature += level.message + '|';
    }
    
    return signature;
}

// Export logs function
function exportLogs(scope) {
    const allCalculations = extractCalculations();
    
    if (allCalculations.length === 0) {
        alert('Žádné výpočty k exportu nenalezeny.');
        return;
    }

    let dataToExport;
    if (scope === 'last') {
        // For "last calculation", just take the most recent one (no deduplication needed)
        dataToExport = [allCalculations[allCalculations.length - 1]];
    } else {
        // For "all calculations", remove duplicates
        const uniqueCalculations = removeDuplicateCalculations(allCalculations);
        dataToExport = uniqueCalculations;
        
        if (uniqueCalculations.length < allCalculations.length) {
            console.log(`Export: ${allCalculations.length} calculations found, ${uniqueCalculations.length} unique calculations will be exported`);
        }
    }

    // Generate file content based on format
    let fileContent, fileExtension, mimeType;
    
    switch (currentExportFormat) {
        case 'txt':
            fileContent = generateTxtContent(dataToExport);
            fileExtension = 'txt';
            mimeType = 'text/plain';
            break;
        case 'csv':
            fileContent = generateCsvContent(dataToExport);
            fileExtension = 'csv';
            mimeType = 'text/csv';
            break;
        case 'xlsx':
            fileContent = generateXlsxContent(dataToExport);
            fileExtension = 'xlsx';
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
        default:
            fileContent = generateTxtContent(dataToExport);
            fileExtension = 'txt';
            mimeType = 'text/plain';
    }

    // Create download
    if (currentExportFormat === 'xlsx') {
        // For XLSX, we need to use a different approach
        downloadXlsxFile(fileContent, `hydroflow_export_${scope}.${fileExtension}`);
    } else {
        downloadFile(fileContent, `hydroflow_export_${scope}.${fileExtension}`, mimeType);
    }
}

// Generate TXT content
function generateTxtContent(calculations) {
    let content = 'HydroFlow Calculator - Export dat\n';
    content += '=====================================\n\n';

    calculations.forEach((calc, index) => {
        content += `Výpočet ${index + 1}:\n`;
        content += `Čas: [${calc.timestamp}]\n`;
        content += `${calc.parameters}\n`;
        if (calc.consumptionCurveInfo) {
            content += `${calc.consumptionCurveInfo}\n`;
        }
        content += '\nÚrovně hladiny a průtoky:\n';
        content += '----------------------------\n';
        
        calc.levels.forEach(level => {
            content += `${level.message}\n`;
        });
        
        if (calc.endMessage) {
            content += `\n${calc.endMessage}\n`;
        }
        content += '\n' + '='.repeat(50) + '\n\n';
    });

    return content;
}

// Generate CSV content
function generateCsvContent(calculations) {
    let csvContent = 'Calculation,Timestamp,m,Kota_Hladiny_m,Kota_Prelivu_m,Sirka_b_m,Pocet_Piliru_n,Typ_Pilire,Eta,Range_cm,Segment_cm,Level_cm,Height_h_m,Flow_Q_m3s\n';

    calculations.forEach((calc, calcIndex) => {
        // Parse parameters
        const params = parseParameters(calc.parameters);
        const rangeInfo = parseRangeInfo(calc.consumptionCurveInfo);
        
        calc.levels.forEach(level => {
            const levelData = parseLevelData(level.message);
            csvContent += `${calcIndex + 1},${calc.timestamp},${params.m},${params.kota_hladiny},${params.kota_prelivu},${params.b},${params.n},${params.typ},${params.eta},${rangeInfo.range},${rangeInfo.segment},${levelData.level},${levelData.h},${levelData.Q}\n`;
        });
    });

    return csvContent;
}

// Generate XLSX content (using SheetJS)
function generateXlsxContent(calculations) {
    // This function returns workbook data that will be processed by SheetJS
    const worksheetData = [];
    
    // Headers
    worksheetData.push([
        'Výpočet', 'Čas', 'Součinitel m', 'Kóta hladiny (m.n.m.)', 'Kóta přelivu (m.n.m.)', 
        'Šířka b (m)', 'Počet pilířů n', 'Typ pilíře', 'Eta ξ', 'Rozsah (cm)', 
        'Segment (cm)', 'Úroveň (cm)', 'Výška h (m)', 'Průtok Q (m³/s)'
    ]);

    calculations.forEach((calc, calcIndex) => {
        const params = parseParameters(calc.parameters);
        const rangeInfo = parseRangeInfo(calc.consumptionCurveInfo);
        
        calc.levels.forEach(level => {
            const levelData = parseLevelData(level.message);
            worksheetData.push([
                calcIndex + 1, calc.timestamp, params.m, params.kota_hladiny, params.kota_prelivu,
                params.b, params.n, params.typ, params.eta, rangeInfo.range,
                rangeInfo.segment, levelData.level, levelData.h, levelData.Q
            ]);
        });
    });

    return worksheetData;
}

// Helper functions to parse log data
function parseParameters(paramString) {
    const params = {};
    
    // Extract values using regex
    const mMatch = paramString.match(/m = ([\d.]+)/);
    const kotaHladinyMatch = paramString.match(/kóta hladiny = ([\d.]+)/);
    const kotaPrelivuMatch = paramString.match(/kóta přelivu = ([\d.]+)/);
    const bMatch = paramString.match(/b = ([\d.]+)/);
    const nMatch = paramString.match(/n = (\d+)/);
    const typMatch = paramString.match(/typ = ([^,]+)/);
    const etaMatch = paramString.match(/ξ = ([\d.]+)/);
    
    params.m = mMatch ? parseFloat(mMatch[1]) : '';
    params.kota_hladiny = kotaHladinyMatch ? parseFloat(kotaHladinyMatch[1]) : '';
    params.kota_prelivu = kotaPrelivuMatch ? parseFloat(kotaPrelivuMatch[1]) : '';
    params.b = bMatch ? parseFloat(bMatch[1]) : '';
    params.n = nMatch ? parseInt(nMatch[1]) : '';
    params.typ = typMatch ? typMatch[1].trim() : '';
    params.eta = etaMatch ? parseFloat(etaMatch[1]) : '';
    
    return params;
}

function parseRangeInfo(rangeString) {
    const info = {};
    
    if (rangeString) {
        const rangeMatch = rangeString.match(/rozsah = ([\d-]+)cm/);
        const segmentMatch = rangeString.match(/segment = (\d+)cm/);
        
        info.range = rangeMatch ? rangeMatch[1] : '';
        info.segment = segmentMatch ? parseInt(segmentMatch[1]) : '';
    }
    
    return info;
}

function parseLevelData(levelString) {
    const data = {};
    
    const levelMatch = levelString.match(/Level (\d+)cm/);
    const hMatch = levelString.match(/h = ([\d.]+)m/);
    const qMatch = levelString.match(/Q = ([\d.]+) m³\/s/);
    
    data.level = levelMatch ? parseInt(levelMatch[1]) : '';
    data.h = hMatch ? parseFloat(hMatch[1]) : '';
    data.Q = qMatch ? parseFloat(qMatch[1]) : '';
    
    return data;
}

// Download file function
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Download XLSX file using SheetJS
function downloadXlsxFile(worksheetData, filename) {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'HydroFlow Data');
    
    // Generate XLSX file and download
    XLSX.writeFile(wb, filename);
}

// Switch chart axes function
function switchChartAxes() {
    if (!window.currentChart) {
        alert('Žádný graf k přepnutí os nenalezen.');
        return;
    }

    // Toggle axes state
    window.axesSwapped = !window.axesSwapped;
    
    // Get original data
    const originalWaterLevels = window.currentChart.originalWaterLevels;
    const originalQValues = window.currentChart.originalQValues;
    
    if (!originalWaterLevels || !originalQValues) {
        alert('Data grafu nejsou k dispozici pro přepnutí os.');
        return;
    }
    
    // Regenerate chart with swapped axes
    // We need to call the generateConsumptionChart function again
    // Find the chart generation function in the global scope
    if (typeof generateConsumptionChart === 'function') {
        generateConsumptionChart(originalWaterLevels, originalQValues);
    } else {
        // If function is not globally available, manually update the chart
        updateChartAxes(originalWaterLevels, originalQValues);
    }
    
    console.log(`Axes ${window.axesSwapped ? 'swapped' : 'restored'}`);
}

// Manual chart axes update function
function updateChartAxes(waterLevels, qValues) {
    const chart = window.currentChart;
    
    if (window.axesSwapped) {
        chart.data.labels = qValues;
        chart.data.datasets[0].data = waterLevels;
        chart.data.datasets[0].label = 'Výška hladiny';
        chart.options.scales.x.title.text = 'Průtok Q (m³/s)';
        chart.options.scales.y.title.text = 'Výška hladiny (cm)';
    } else {
        chart.data.labels = waterLevels;
        chart.data.datasets[0].data = qValues;
        chart.data.datasets[0].label = 'Průtok (Q)';
        chart.options.scales.x.title.text = 'Výška hladiny (cm)';
        chart.options.scales.y.title.text = 'Průtok Q (m³/s)';
    }
    
    chart.update();
}

// Load SheetJS library dynamically for XLSX export
function loadSheetJS() {
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = function() {
            console.log('SheetJS loaded for XLSX export');
        };
        document.head.appendChild(script);
    }
}

// Load SheetJS when the page loads
document.addEventListener('DOMContentLoaded', loadSheetJS);

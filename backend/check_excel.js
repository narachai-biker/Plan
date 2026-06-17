const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
    const filePath = path.resolve(__dirname, '../ระบบจัดสรรงบประมาณ.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    workbook.eachSheet((worksheet, sheetId) => {
        console.log(`\nSheet: ${worksheet.name}`);
        const headerRow = worksheet.getRow(1);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
            headers.push(cell.value);
        });
        console.log('Headers:', headers);
    });
}

main().catch(console.error);

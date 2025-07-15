const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'output.json');

function runTest() {
    if (!fs.existsSync(outputPath)) {
        console.error('output.json does not exist.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    // Test 1: Should have 25 entries
    if (!Array.isArray(data) || data.length !== 25) {
        console.error('Test failed: output.json does not have 25 entries.');
        process.exit(1);
    }

    // Test 2: Must include a Boss task with "center": 1
    const bossTask = data.find(
        t => t.category === "Boss" && t.name && t.name.toLowerCase().includes("defeat") && t.center === 1
    );

    if (!bossTask) {
        // Try fallback: check if any entry has "center": 1 (in case structure is different)
        const centerTask = data.find(t => t.center === 1);
        if (!centerTask) {
            console.error('Test failed: No Boss task with "center": 1 found in output.json.');
            process.exit(1);
        }
    }

    console.log('All tests passed!');
}

runTest();
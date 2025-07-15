const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'output.json');
const nightfarersPath = path.join(__dirname, 'Nightfarers.json');

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
        t => t.center === 1
    );
    if (!bossTask) {
        console.error('Test failed: No Boss task with "center": 1 found in output.json.');
        process.exit(1);
    }

    // Test 3: No tasks from other Nightfarers than the selected one
    if (!fs.existsSync(nightfarersPath)) {
        console.warn('Nightfarers.json not found, skipping Nightfarer test.');
    } else {
        const nightfarers = JSON.parse(fs.readFileSync(nightfarersPath, 'utf-8'));
        // Find which Nightfarer was selected by checking which Nightfarer task appears in output
        let selectedNightfarer = null;
        for (const nf of nightfarers) {
            if (nf.tasks.some(task => data.find(d => d.name === task))) {
                selectedNightfarer = nf;
                break;
            }
        }
        if (!selectedNightfarer) {
            console.error('Test failed: No Nightfarer tasks found in output.json.');
            process.exit(1);
        }
        // Now check that no tasks from other Nightfarers are present
        for (const nf of nightfarers) {
            if (nf.name !== selectedNightfarer.name) {
                for (const task of nf.tasks) {
                    if (data.find(d => d.name === task)) {
                        console.error(`Test failed: Task "${task}" from Nightfarer "${nf.name}" found in output.json.`);
                        process.exit(1);
                    }
                }
            }
        }
    }

    console.log('All tests passed!');
}

runTest();
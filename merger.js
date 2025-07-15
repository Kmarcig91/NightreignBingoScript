const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Load data
const bosses = JSON.parse(fs.readFileSync(path.join(__dirname, 'Bosses.json')));
const nightfarers = JSON.parse(fs.readFileSync(path.join(__dirname, 'Nightfarers.json')));
const maps = JSON.parse(fs.readFileSync(path.join(__dirname, 'Maps.json')));
const generic = JSON.parse(fs.readFileSync(path.join(__dirname, 'Generic.json')));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function chooseFromList(list, promptText) {
    return new Promise((resolve) => {
        console.log(`\n${promptText}`);
        list.forEach((item, idx) => {
            console.log(`${idx + 1}: ${item.name}`);
        });
        rl.question('Enter number: ', (answer) => {
            const idx = parseInt(answer) - 1;
            if (idx >= 0 && idx < list.length) {
                resolve(list[idx]);
            } else {
                console.log('Invalid choice, try again.');
                resolve(chooseFromList(list, promptText));
            }
        });
    });
}

function getRandomElements(arr, n) {
    const copy = arr.slice();
    const result = [];
    while (result.length < n && copy.length > 0) {
        const idx = Math.floor(Math.random() * copy.length);
        result.push(copy.splice(idx, 1)[0]);
    }
    return result;
}

function getAllCategories(tasks) {
    const cats = new Set();
    for (const t of tasks) {
        if (t.category) cats.add(t.category);
        if (t.categories) t.categories.forEach(c => cats.add(c));
    }
    return Array.from(cats);
}

function filterTasksByCategory(tasks, category) {
    return tasks.filter(t =>
        (t.category && t.category === category) ||
        (t.categories && t.categories.includes(category))
    );
}

async function askCategoryMode(categories) {
    return new Promise((resolve) => {
        console.log('\nCategory selection mode:');
        console.log('1: Minimum from each category (choose a number for all)');
        console.log('2: Specify minimum for every category one-by-one');
        rl.question('Enter number: ', (answer) => {
            if (answer === '1' || answer === '2') resolve(answer);
            else resolve(askCategoryMode(categories));
        });
    });
}

async function askMinForAllCategories(categories) {
    return new Promise((resolve) => {
        rl.question(`Enter minimum tasks per category (applies to all, total must not exceed 25): `, (answer) => {
            const n = parseInt(answer);
            if (n >= 0 && n * categories.length <= 25) {
                resolve(n);
            } else {
                if (n * categories.length > 25) {
                    console.log(`Total would be ${n * categories.length}, which exceeds 25. Try again.`);
                } else {
                    console.log('Invalid input. Try a lower number.');
                }
                resolve(askMinForAllCategories(categories));
            }
        });
    });
}

async function askMinForEachCategory(categories) {
    let mins = {};
    let total = 0;
    for (const cat of categories) {
        await new Promise((res) => {
            rl.question(`Minimum tasks for "${cat}": `, (answer) => {
                const n = parseInt(answer) || 0;
                mins[cat] = n;
                total += n;
                res();
            });
        });
    }
    if (total > 25) {
        console.log('Total exceeds 25. Try again.');
        return askMinForEachCategory(categories);
    }
    return mins;
}

async function main() {
    const boss = await chooseFromList(bosses, 'Choose a Boss:');
    const nightfarer = await chooseFromList(nightfarers, 'Choose a Nightfarer:');
    const map = await chooseFromList(maps, 'Choose a Map:');

    // Gather all tasks
    let allTasks = [];
    // Add boss as a special entry, preserving all its properties (like "center": 1)
    allTasks.push({ ...boss });
    allTasks = allTasks.concat(
        nightfarer.tasks.map(t => ({ name: t, category: "Nightfarer" })),
        map.tasks.map(t => ({ name: t, category: "Map" })),
        generic
    );

    // Get all categories except "Boss"
    let categories = getAllCategories(allTasks).filter(cat => cat !== "Boss");

    // Ask for category mode (excluding Boss)
    const mode = await askCategoryMode(categories);

    let selectedTasks = [];
    // Always include the boss task first
    selectedTasks.push({ ...boss });

    if (mode === '1') {
        const min = await askMinForAllCategories(categories);
        for (const cat of categories) {
            const pool = filterTasksByCategory(allTasks, cat);
            selectedTasks = selectedTasks.concat(getRandomElements(pool, min));
        }
        // Fill up to 25 with randoms (excluding already used)
        const used = new Set(selectedTasks.map(t => t.name));
        const rest = allTasks.filter(t => !used.has(t.name) && !t.center); // avoid duplicate boss
        selectedTasks = selectedTasks.concat(getRandomElements(rest, 25 - selectedTasks.length));
    } else {
        const mins = await askMinForEachCategory(categories);
        for (const cat of categories) {
            const pool = filterTasksByCategory(allTasks, cat);
            selectedTasks = selectedTasks.concat(getRandomElements(pool, mins[cat]));
        }
        // Fill up to 25 with randoms (excluding already used)
        const used = new Set(selectedTasks.map(t => t.name));
        const rest = allTasks.filter(t => !used.has(t.name) && !t.center); // avoid duplicate boss
        selectedTasks = selectedTasks.concat(getRandomElements(rest, 25 - selectedTasks.length));
    }

    // Shuffle and trim to 25
    selectedTasks = selectedTasks.sort(() => Math.random() - 0.5).slice(0, 25);

    // Output as JSON file
    const outputPath = path.join(__dirname, 'output.json');
    fs.writeFileSync(outputPath, JSON.stringify(selectedTasks, null, 4));
    console.log(`\nYour 5x5 Bingo Board has been saved to ${outputPath}`);

    rl.close();
}

main();
const fs = require('fs').promises;

const DATA_FILE = 'src/database/passwords.json';

async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, return an empty array (no passwords yet)
            return [];
        }
        throw error; // Re-throw other errors
    }
}

async function saveData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    loadData,
    saveData
};
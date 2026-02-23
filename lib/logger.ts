import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'sync_debug_log.txt');

export function logSync(message: string, data?: any) {
    try {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (e) {
        console.error('Failed to write to sync log:', e);
    }
}

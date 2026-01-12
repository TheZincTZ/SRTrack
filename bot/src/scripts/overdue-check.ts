import dotenv from 'dotenv';
dotenv.config();

import { OverdueCheckService } from '../services/overdue-check.service';

/**
 * Script to check and mark overdue trainees
 * Run this daily at 22:05 SGT via cron job
 */
async function main() {
  try {
    console.log('Starting overdue check...');
    await OverdueCheckService.checkAndMarkOverdue();
    console.log('Overdue check completed');
    process.exit(0);
  } catch (error) {
    console.error('Overdue check failed:', error);
    process.exit(1);
  }
}

main();


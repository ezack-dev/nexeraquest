import { LedgerEngine } from '@nexeraquest/ledger';

async function runWorker() {
  console.log('🔄 [Worker:Reconciliation] Initiating scheduled ledger reconciliation run...');
  try {
    const report = await LedgerEngine.runReconciliation('SCHEDULED_WORKER');
    console.log(`✅ [Worker:Reconciliation] Completed. Status: ${report.status}. Accounts Checked: ${report.totalChecked}. Discrepancies: ${report.discrepanciesFound}`);
    if (report.discrepanciesFound > 0) {
      console.warn('⚠️ [Worker:Reconciliation] Discrepancies detected:', JSON.stringify(report.discrepancies, null, 2));
    }
  } catch (err: any) {
    console.error('❌ [Worker:Reconciliation] Execution error:', err.message);
  }
}

if (require.main === module) {
  runWorker().then(() => process.exit(0));
}

export { runWorker };

// Compatibility entry point for deployments that still reference this path.
const approvals = require('../solanaApprovals');

async function runContinuously() {
  while (true) {
    try { await approvals.verifySolanaApprovals(); }
    catch (error) { console.error(`[SolanaApproval] cycle failed: ${error.message}`); }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}

if (require.main === module) {
  runContinuously().catch(error => {
    console.error(`[SolanaApproval] service failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = approvals;

// Compatibility entry point. Keep a single transfer implementation so workers
// cannot disagree about destination-account selection.
const transfer = require('../transfer-spl');

if (require.main === module) {
  transfer.runContinuously().catch(error => {
    console.error(`[SolanaTransfer] service failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = transfer;

/**
 * Validates the swap quote for any issues
 * @param swapQuote - The swap quote data
 * @returns true if swap is valid, false if there are issues
 */
export function validateSwapQuote(swapQuote: any): boolean {
  // Handle undefined/null input
  if (!swapQuote) {
    return true;
  }
  
  let isValid = true;
  
  // Check balance issues
  if (swapQuote.issues?.balance) {
    console.log("❌ Balance Issues:");
    console.log(`   Current: ${swapQuote.issues.balance.currentBalance}`);
    console.log(`   Required: ${swapQuote.issues.balance.requiredBalance}`);
    console.log(`   Token: ${swapQuote.issues.balance.token}`);
    isValid = false;
  }
  
  // Check allowance issues
  if (swapQuote.issues?.allowance) {
    console.log("❌ Allowance Issues:");
    console.log(`   Current: ${swapQuote.issues.allowance.currentAllowance}`);
    console.log(`   Required: ${swapQuote.issues.allowance.requiredAllowance}`);
    console.log(`   Spender: ${swapQuote.issues.allowance.spender}`);
    isValid = false;
  }
  
  // Check simulation
  if (swapQuote.issues?.simulationIncomplete) {
    console.log("⚠️ WARNING: Simulation incomplete - transaction may fail");
    // Not marking as invalid since this is just a warning
  }
  
  return isValid;
}

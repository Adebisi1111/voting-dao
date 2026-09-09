import { createClient, chains } from 'https://cdn.jsdelivr.net/npm/genlayer-js@latest/+esm';

const CONTRACT = '0x20f8d6cB56f922C973b9A7D7479E9452A61217BE';

// Create client with default account
const client = createClient({
  chain: chains.testnetBradbury,
});

async function main() {
  console.log('=== VotingDAO Testnet Seeder ===\n');

  // Step 1: Register voter
  console.log('1. Registering voter...');
  try {
    const regResult = await client.writeContract({
      address: CONTRACT,
      functionName: 'register_voter',
      args: [],
      value: 100000000000000000n, // 0.1 GEN
    });
    console.log(`   Registration tx: ${regResult.transactionHash}`);
    await waitForFinality(regResult.transactionHash);
  } catch (e) {
    console.log(`   Registration error: ${e.message?.slice(0, 200)}`);
  }

  // Check if registered
  const registered = await client.readContract({
    address: CONTRACT,
    functionName: 'is_voter',
    args: ['0x782abaE1C6C4aec093C964785a4c10C0991Fa01A'],
  });
  console.log(`   Registered: ${registered}`);

  // Step 2: Create proposals
  const proposals = [
    { id: 'prop-001', title: 'Allocate 10% of Treasury to Liquidity Mining', desc: 'Proposal to allocate 10% of the protocol treasury to liquidity mining rewards for the next quarter.', deadline: Math.floor(Date.now() / 1000) + 86400 * 10 },
    { id: 'prop-002', title: 'Reduce Proposal Threshold to 100 Tokens', desc: 'Lower the minimum token requirement for creating proposals from 500 to 100 tokens to increase community participation.', deadline: Math.floor(Date.now() / 1000) + 86400 * 7 },
    { id: 'prop-003', title: 'Extend Voting Period to 7 Days', desc: 'Increase the voting period from 3 days to 7 days for treasury decisions to allow more time for community deliberation.', deadline: Math.floor(Date.now() / 1000) + 86400 * 14 },
    { id: 'prop-004', title: 'Add Quadratic Voting for Treasury Proposals', desc: 'Implement quadratic voting for all treasury-related proposals to give smaller token holders more influence.', deadline: Math.floor(Date.now() / 1000) + 86400 * 5 },
    { id: 'prop-005', title: 'Establish Developer Grant Program', desc: 'Create a 50,000 GEN grant program for developers building tools and integrations for VotingDAO.', deadline: Math.floor(Date.now() / 1000) + 86400 * 21 },
  ];

  for (const p of proposals) {
    console.log(`\n2. Creating ${p.id}: ${p.title.slice(0, 50)}...`);
    try {
      const result = await client.writeContract({
        address: CONTRACT,
        functionName: 'create_proposal',
        args: [p.id, p.title, p.desc, p.deadline],
        value: 0n,
      });
      console.log(`   Tx: ${result.transactionHash}`);
      await waitForFinality(result.transactionHash);
    } catch (e) {
      console.log(`   Error: ${e.message?.slice(0, 200)}`);
    }
  }

  // Step 3: Cast votes on proposals
  console.log('\n3. Casting votes...');
  const votes = [
    { proposal: 'prop-001', vote: 'yes' },
    { proposal: 'prop-002', vote: 'yes' },
    { proposal: 'prop-003', vote: 'no' },
    { proposal: 'prop-004', vote: 'yes' },
    { proposal: 'prop-005', vote: 'no' },
  ];

  for (const v of votes) {
    try {
      const result = await client.writeContract({
        address: CONTRACT,
        functionName: 'cast_vote',
        args: [v.proposal, v.vote],
        value: 0n,
      });
      console.log(`   ${v.vote} on ${v.proposal}: ${result.transactionHash}`);
      await waitForFinality(result.transactionHash);
    } catch (e) {
      console.log(`   Error on ${v.proposal}: ${e.message?.slice(0, 200)}`);
    }
  }

  // Step 4: Verify final state
  console.log('\n4. Verifying final state...');
  const count = await client.readContract({
    address: CONTRACT,
    functionName: 'get_proposals_count',
    args: [],
  });
  console.log(`   Total proposals: ${count}`);

  for (let i = 1; i <= parseInt(count); i++) {
    try {
      const p = await client.readContract({
        address: CONTRACT,
        functionName: 'get_proposal',
        args: [`prop-00${i}`],
      });
      const proposal = JSON.parse(p);
      if (proposal.exists) {
        console.log(`   ${proposal.proposal_id}: ${proposal.yes_votes} yes, ${proposal.no_votes} no (${proposal.resolved ? proposal.result : 'active'})`);
      }
    } catch (e) {
      // Skip missing proposals
    }
  }

  console.log('\n=== Done! ===');
}

async function waitForFinality(txHash) {
  // Wait for transaction to be finalized
  return new Promise((resolve) => {
    setTimeout(resolve, 15000); // 15 seconds between txs
  });
}

main().catch(console.error);

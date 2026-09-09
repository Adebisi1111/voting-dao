import { createClient, chains, createAccount } from 'genlayer-js';

const CONTRACT = '0x20f8d6cB56f922C973b9A7D7479E9452A61217BE';
const PRIVATE_KEY = '0xf6e536098748e4d4884c30b588136835ff7b6d6ed0e71dc1dc92753d27b94b26';

const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain: chains.testnetBradbury, account });

async function main() {
  console.log('=== VotingDAO Seeder ===');
  console.log(`Account: ${account.address}\n`);

  // Register voter
  console.log('1. Registering voter...');
  try {
    const reg = await client.writeContract({
      address: CONTRACT,
      functionName: 'register_voter',
      args: [],
      value: 100000000000000000n,
    });
    console.log(`   Tx: ${reg.transactionHash}`);
    await new Promise(r => setTimeout(r, 20000));
  } catch (e) {
    console.log(`   Error: ${e.message?.slice(0, 150)}`);
  }

  // Check registration
  const reg = await client.readContract({
    address: CONTRACT,
    functionName: 'is_voter',
    args: [account.address],
  });
  console.log(`   Registered: ${reg}\n`);

  // Create proposals
  const proposals = [
    { id: 'prop-001', title: 'Allocate 10% of Treasury to Liquidity Mining', desc: 'Proposal to allocate 10% of the protocol treasury to liquidity mining rewards.', deadline: Math.floor(Date.now() / 1000) + 86400 * 10 },
    { id: 'prop-002', title: 'Reduce Proposal Threshold to 100 Tokens', desc: 'Lower the minimum token requirement for creating proposals.', deadline: Math.floor(Date.now() / 1000) + 86400 * 7 },
    { id: 'prop-003', title: 'Extend Voting Period to 7 Days', desc: 'Increase the voting period from 3 days to 7 days.', deadline: Math.floor(Date.now() / 1000) + 86400 * 14 },
  ];

  for (const p of proposals) {
    console.log(`2. Creating ${p.id}...`);
    try {
      const result = await client.writeContract({
        address: CONTRACT,
        functionName: 'create_proposal',
        args: [p.id, p.title, p.desc, p.deadline],
        value: 0n,
      });
      console.log(`   Tx: ${result.transactionHash}`);
      await new Promise(r => setTimeout(r, 20000));
    } catch (e) {
      console.log(`   Error: ${e.message?.slice(0, 150)}`);
    }
  }

  // Cast votes
  console.log('\n3. Casting votes...');
  const votes = [
    { proposal: 'prop-001', vote: 'yes' },
    { proposal: 'prop-002', vote: 'yes' },
    { proposal: 'prop-003', vote: 'no' },
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
      await new Promise(r => setTimeout(r, 20000));
    } catch (e) {
      console.log(`   Error: ${e.message?.slice(0, 150)}`);
    }
  }

  // Verify
  console.log('\n4. Verifying...');
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
        console.log(`   ${proposal.proposal_id}: ${proposal.yes_votes} yes, ${proposal.no_votes} no`);
      }
    } catch (e) {}
  }

  console.log('\n=== Done! ===');
}

main().catch(console.error);

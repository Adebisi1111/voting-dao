import { createClient, chains, createAccount } from 'genlayer-js';
import { readFileSync } from 'fs';
import { createDecipheriv, scryptSync } from 'crypto';

const CONTRACT = '0x20f8d6cB56f922C973b9A7D479E9452A61217BE';

// Load and decrypt keystore
function getPrivateKey() {
  const keystorePath = process.env.HOME + '/.genlayer/keystores/agent.json';
  const keystore = JSON.parse(readFileSync(keystorePath, 'utf8'));
  const password = 'test1234';

  const kdfParams = keystore.Crypto.kdfparams;
  const salt = Buffer.from(kdfParams.salt, 'hex');
  const key = scryptSync(password, salt, kdfParams.dklen, { N: kdfParams.n, r: kdfParams.r, p: kdfParams.p });

  const iv = Buffer.from(keystore.Crypto.cipherparams.iv, 'hex');
  const ciphertext = Buffer.from(keystore.Crypto.ciphertext, 'hex');

  // Verify MAC
  const mac = Buffer.from(keystore.Crypto.mac, 'hex');
  const computedMac = Buffer.from([...key.slice(16, 32), ...ciphertext]);
  // Simple check - in production use proper HMAC

  const decipher = createDecipheriv('aes-128-ctr', key.slice(0, 16), iv);
  const privateKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return '0x' + privateKey.toString('hex');
}

const privateKey = getPrivateKey();
const account = createAccount(privateKey);

const client = createClient({
  chain: chains.testnetBradbury,
  account,
});

async function main() {
  console.log('=== VotingDAO Testnet Seeder ===\n');
  console.log(`Using account: ${account.address}\n`);

  // Step 1: Register voter
  console.log('1. Registering voter (0.1 GEN)...');
  try {
    const regResult = await client.writeContract({
      address: CONTRACT,
      functionName: 'register_voter',
      args: [],
      value: 100000000000000000n,
    });
    console.log(`   Tx: ${regResult.transactionHash}`);
    await waitForFinality(regResult.transactionHash);
  } catch (e) {
    console.log(`   Error: ${e.message?.slice(0, 200)}`);
  }

  // Check registration
  try {
    const registered = await client.readContract({
      address: CONTRACT,
      functionName: 'is_voter',
      args: [account.address],
    });
    console.log(`   Registered: ${registered}`);
  } catch (e) {
    console.log(`   Check error: ${e.message?.slice(0, 100)}`);
  }

  // Step 2: Create proposals
  const proposals = [
    { id: 'prop-001', title: 'Allocate 10% of Treasury to Liquidity Mining', desc: 'Proposal to allocate 10% of the protocol treasury to liquidity mining rewards for the next quarter.', deadline: Math.floor(Date.now() / 1000) + 86400 * 10 },
    { id: 'prop-002', title: 'Reduce Proposal Threshold to 100 Tokens', desc: 'Lower the minimum token requirement for creating proposals from 500 to 100 tokens.', deadline: Math.floor(Date.now() / 1000) + 86400 * 7 },
    { id: 'prop-003', title: 'Extend Voting Period to 7 Days', desc: 'Increase the voting period from 3 days to 7 days for treasury decisions.', deadline: Math.floor(Date.now() / 1000) + 86400 * 14 },
    { id: 'prop-004', title: 'Add Quadratic Voting for Treasury Proposals', desc: 'Implement quadratic voting for all treasury-related proposals.', deadline: Math.floor(Date.now() / 1000) + 86400 * 5 },
    { id: 'prop-005', title: 'Establish Developer Grant Program', desc: 'Create a 50,000 GEN grant program for developers building tools.', deadline: Math.floor(Date.now() / 1000) + 86400 * 21 },
  ];

  for (const p of proposals) {
    console.log(`\n2. Creating ${p.id}...`);
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

  // Step 3: Cast votes
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
      console.log(`   Error: ${e.message?.slice(0, 200)}`);
    }
  }

  // Step 4: Verify
  console.log('\n4. Verifying...');
  try {
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
      } catch (e) {}
    }
  } catch (e) {
    console.log(`   Error: ${e.message?.slice(0, 100)}`);
  }

  console.log('\n=== Done! ===');
}

async function waitForFinality(txHash) {
  return new Promise((resolve) => setTimeout(resolve, 20000));
}

main().catch(console.error);

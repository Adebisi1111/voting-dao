import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

const CONTRACT = '0x20f8d6cB56f922C973b9A7D7479E9452A61217BE';
const PRIVATE_KEY = '0xf6e536098748e4d4884c30b588136835ff7b6d6ed0e71dc1dc92753d27b94b26';
const RPC_URL = 'https://rpc-bradbury.genlayer.com';

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: { ...foundry, id: 688, name: 'GenLayer Bradbury', network: 'genlayer-bradbury', nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 } },
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: { ...foundry, id: 688, name: 'GenLayer Bradbury', network: 'genlayer-bradbury', nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 } },
  transport: http(RPC_URL),
});

async function main() {
  console.log('=== VotingDAO Testnet Seeder ===\n');
  console.log(`Using account: ${account.address}\n`);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${formatEther(balance)} GEN\n`);

  // Step 1: Register voter
  console.log('1. Registering voter (0.1 GEN)...');
  try {
    const regHash = await walletClient.writeContract({
      address: CONTRACT,
      abi: [
        {
          type: 'function',
          name: 'register_voter',
          inputs: [],
          outputs: [],
          stateMutability: 'payable',
        },
      ],
      functionName: 'register_voter',
      value: parseEther('0.1'),
    });
    console.log(`   Tx: ${regHash}`);
    await publicClient.waitForTransactionReceipt({ hash: regHash });
    console.log(`   Finalized!`);
  } catch (e) {
    console.log(`   Error: ${e.message?.slice(0, 200)}`);
  }

  // Check registration
  try {
    const registered = await publicClient.readContract({
      address: CONTRACT,
      abi: [
        {
          type: 'function',
          name: 'is_voter',
          inputs: [{ type: 'string', name: 'address' }],
          outputs: [{ type: 'string' }],
          stateMutability: 'view',
        },
      ],
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
      const hash = await walletClient.writeContract({
        address: CONTRACT,
        abi: [
          {
            type: 'function',
            name: 'create_proposal',
            inputs: [
              { type: 'string', name: 'proposal_id' },
              { type: 'string', name: 'title' },
              { type: 'string', name: 'description' },
              { type: 'uint256', name: 'deadline' },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        functionName: 'create_proposal',
        args: [p.id, p.title, p.desc, BigInt(p.deadline)],
      });
      console.log(`   Tx: ${hash}`);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   Finalized!`);
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
      const hash = await walletClient.writeContract({
        address: CONTRACT,
        abi: [
          {
            type: 'function',
            name: 'cast_vote',
            inputs: [
              { type: 'string', name: 'proposal_id' },
              { type: 'string', name: 'vote' },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        functionName: 'cast_vote',
        args: [v.proposal, v.vote],
      });
      console.log(`   ${v.vote} on ${v.proposal}: ${hash}`);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   Finalized!`);
    } catch (e) {
      console.log(`   Error: ${e.message?.slice(0, 200)}`);
    }
  }

  // Step 4: Verify
  console.log('\n4. Verifying...');
  try {
    const count = await publicClient.readContract({
      address: CONTRACT,
      abi: [
        {
          type: 'function',
          name: 'get_proposals_count',
          inputs: [],
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
        },
      ],
      functionName: 'get_proposals_count',
    });
    console.log(`   Total proposals: ${count}`);

    for (let i = 1; i <= parseInt(count); i++) {
      try {
        const p = await publicClient.readContract({
          address: CONTRACT,
          abi: [
            {
              type: 'function',
              name: 'get_proposal',
              inputs: [{ type: 'string', name: 'proposal_id' }],
              outputs: [{ type: 'string' }],
              stateMutability: 'view',
            },
          ],
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

main().catch(console.error);

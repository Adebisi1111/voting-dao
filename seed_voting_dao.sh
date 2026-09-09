#!/bin/bash
# Seed VotingDAO with realistic testnet data
# Run: bash seed_voting_dao.sh

CONTRACT=0x20f8d6cB56f922C973b9A7D7479E9452A61217BE
PASS=test1234

echo "=== VotingDAO Testnet Seeder ==="

# Step 1: Register voter
echo "1. Registering voter..."
echo "$PASS" | genlayer write $CONTRACT register_voter --fee-value 100000000000000000 2>&1 | grep -i "hash\|error"
sleep 20

# Step 2: Create proposals
echo "2. Creating proposals..."

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-001 "Allocate 10% of Treasury to Liquidity Mining" "Proposal to allocate 10% of the protocol treasury to liquidity mining rewards for the next quarter." 1729000000 2>&1 | grep -i "hash\|error"
sleep 20

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-002 "Reduce Proposal Threshold to 100 Tokens" "Lower the minimum token requirement for creating proposals from 500 to 100 tokens to increase community participation." 1728000000 2>&1 | grep -i "hash\|error"
sleep 20

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-003 "Extend Voting Period to 7 Days" "Increase the voting period from 3 days to 7 days for treasury decisions to allow more time for community deliberation." 1730000000 2>&1 | grep -i "hash\|error"
sleep 20

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-004 "Add Quadratic Voting for Treasury Proposals" "Implement quadratic voting for all treasury-related proposals to give smaller token holders more influence." 1727500000 2>&1 | grep -i "hash\|error"
sleep 20

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-005 "Establish Developer Grant Program" "Create a 50,000 GEN grant program for developers building tools and integrations for VotingDAO." 1731000000 2>&1 | grep -i "hash\|error"
sleep 20

# Step 3: Cast votes
echo "3. Casting votes..."

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-001 yes 2>&1 | grep -i "hash\|error"
sleep 15

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-002 yes 2>&1 | grep -i "hash\|error"
sleep 15

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-003 no 2>&1 | grep -i "hash\|error"
sleep 15

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-004 yes 2>&1 | grep -i "hash\|error"
sleep 15

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-005 no 2>&1 | grep -i "hash\|error"
sleep 15

# Step 4: Verify
echo "4. Verifying..."
echo "$PASS" | genlayer call $CONTRACT get_proposals_count 2>&1

echo "=== Done! ==="

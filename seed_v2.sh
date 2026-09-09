#!/bin/bash
# Seed VotingDAO v2 with realistic testnet data
# Contract: 0x8BAB49CF18Cf129977b7d12BF0558357b358113e

CONTRACT=0x8BAB49CF18Cf129977b7d12BF0558357b358113e
PASS=test1234
DELAY=25

echo "=== VotingDAO v2 Seeder ==="

# Register voter
echo "1. Registering voter..."
echo "$PASS" | genlayer write $CONTRACT register_voter 2>&1 | grep -i "hash\|error"
sleep $DELAY

# Create proposals
echo "2. Creating proposals..."

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-001 "Allocate 10% of Treasury to Liquidity Mining" "Proposal to allocate 10% of the protocol treasury to liquidity mining rewards for the next quarter." 1789000000 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-002 "Reduce Proposal Threshold to 100 Tokens" "Lower the minimum token requirement for creating proposals from 500 to 100 tokens." 1789050000 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-003 "Extend Voting Period to 7 Days" "Increase the voting period from 3 days to 7 days for treasury decisions." 1789100000 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-004 "Add Quadratic Voting for Treasury Proposals" "Implement quadratic voting for all treasury-related proposals." 1789150000 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT create_proposal --args prop-005 "Establish Developer Grant Program" "Create a 50,000 GEN grant program for developers building tools." 1789200000 2>&1 | grep -i "hash\|error"
sleep $DELAY

# Cast votes
echo "3. Casting votes..."

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-001 yes 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-002 yes 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-003 no 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-004 yes 2>&1 | grep -i "hash\|error"
sleep $DELAY

echo "$PASS" | genlayer write $CONTRACT cast_vote --args prop-005 no 2>&1 | grep -i "hash\|error"
sleep $DELAY

# Verify
echo "4. Verifying..."
echo "$PASS" | genlayer call $CONTRACT get_proposals_count 2>&1

echo "=== Done! ==="

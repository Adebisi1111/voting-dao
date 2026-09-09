# VotingDAO Testnet Seeder

This script seeds the VotingDAO contract with realistic testnet data.

## Prerequisites

1. GenLayer CLI installed
2. Test GEN for gas fees

## Usage

Run each command separately and wait for finalization between each step.

### Step 1: Register Voter

```bash
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE register_voter --fee-value 100000000000000000
```

### Step 2: Create Proposals

```bash
# Proposal 1: Treasury Allocation
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE create_proposal \
  --args '"prop-001"' '"Allocate 10% of Treasury to Liquidity Mining"' '"Proposal to allocate 10% of the protocol treasury to liquidity mining rewards for the next quarter."' '1729000000'

# Proposal 2: Reduce Threshold
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE create_proposal \
  --args '"prop-002"' '"Reduce Proposal Threshold to 100 Tokens"' '"Lower the minimum token requirement for creating proposals from 500 to 100 tokens to increase community participation."' '1728000000'

# Proposal 3: Extend Voting Period
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE create_proposal \
  --args '"prop-003"' '"Extend Voting Period to 7 Days"' '"Increase the voting period from 3 days to 7 days for treasury decisions to allow more time for community deliberation."' '1730000000'

# Proposal 4: Quadratic Voting
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE create_proposal \
  --args '"prop-004"' '"Add Quadratic Voting for Treasury Proposals"' '"Implement quadratic voting for all treasury-related proposals to give smaller token holders more influence."' '1727500000'

# Proposal 5: Developer Grants
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE create_proposal \
  --args '"prop-005"' '"Establish Developer Grant Program"' '"Create a 50,000 GEN grant program for developers building tools and integrations for VotingDAO."' '1731000000'
```

### Step 3: Cast Votes

```bash
# Vote on proposals
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE cast_vote --args '"prop-001"' '"yes"'
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE cast_vote --args '"prop-002"' '"yes"'
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE cast_vote --args '"prop-003"' '"no"'
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE cast_vote --args '"prop-004"' '"yes"'
genlayer write 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE cast_vote --args '"prop-005"' '"no"'
```

### Step 4: Verify

```bash
# Check proposal count
genlayer call 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE get_proposals_count

# Check each proposal
genlayer call 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE get_proposal --args '"prop-001"'
genlayer call 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE get_proposal --args '"prop-002"'
genlayer call 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE get_proposal --args '"prop-003"'
genlayer call 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE get_proposal --args '"prop-004"'
genlayer call 0x20f8d6cB56f922C973b9A7D7479E9452A61217BE get_proposal --args '"prop-005"'
```

## Notes

- Wait ~15 seconds between transactions for finalization
- Each address can only vote once per proposal
- Proposals need future deadlines to be active
- Use test GEN for gas and registration fees

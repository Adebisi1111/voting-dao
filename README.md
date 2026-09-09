# GenLayer Voting DAO

A decentralized voting platform built on GenLayer. Create proposals, cast votes, and let AI consensus tally the results.

## How It Works

1. **Create Proposal** — Anyone can create a proposal with a title, description, and deadline
2. **Register to Vote** — Users register with 0.1 GEN to prevent spam
3. **Cast Votes** — Registered voters vote yes/no on proposals
4. **Resolve** — After deadline, anyone can trigger resolution
5. **Consensus** — AI validators verify the final result

## Architecture

| Component | Technology |
|-----------|------------|
| Smart Contract | GenLayer Python (Bradbury Testnet) |
| Frontend | HTML/CSS/JS (GitHub Pages) |
| Backend | Node.js (Render) |
| Consensus | GenLayer `gl.vm.run_nondet_unsafe` |

## Key Design: Verdict-Based Consensus

Validators don't compare individual vote counts. They compare the **FINAL RESULT** (PASS/FAIL/INCONCLUSIVE). This prevents validator-compatible counts from crossing thresholds and changing the outcome.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create-proposal` | POST | Create a new proposal |
| `/cast-vote` | POST | Cast a vote (yes/no) |
| `/resolve-proposal` | POST | Trigger consensus resolution |
| `/proposals` | GET | List all proposals |
| `/proposal/:id` | GET | Get proposal details |

## Deployment

```bash
# Deploy contract to Bradbury
genlayer deploy --contract contracts/voting_dao.py

# Deploy backend to Render
# Set CONTRACT_ADDRESS and PRIVATE_KEY env vars

# Deploy frontend to GitHub Pages
git push origin main
```

## License
MIT

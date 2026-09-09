# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from genlayer import *


@allow_storage
@dataclass
class Proposal:
    id: str
    title: str
    description: str
    creator: str
    deadline: u256
    yes_votes: u256
    no_votes: u256
    resolved: bool
    result: str  # "PASS" | "FAIL" | "INCONCLUSIVE"


@allow_storage
@dataclass
class VoterRecord:
    registered: bool
    last_proposal_voted: str


class VotingDAO(gl.Contract):
    proposals: TreeMap[str, Proposal]
    proposal_counter: u256
    voters: TreeMap[str, VoterRecord]

    def __init__(self):
        pass

    def _now(self) -> int:
        return int(datetime.now(timezone.utc).timestamp())

    @gl.public.write
    def register_voter(self) -> None:
        """Register to vote. Free registration."""
        sender = gl.message.sender_address.as_hex
        rec = self.voters.get(sender, None)
        if rec is None:
            rec = VoterRecord(registered=True, last_proposal_voted="")
        else:
            rec.registered = True
        self.voters[sender] = rec

    @gl.public.write
    def create_proposal(self, proposal_id: str, title: str, description: str, deadline: int) -> None:
        """Create a new proposal."""
        if not proposal_id or not title:
            raise gl.vm.UserError("proposal_id and title required")
        if self.proposals.get(proposal_id, None) is not None:
            raise gl.vm.UserError(f"Proposal {proposal_id} already exists")
        if int(deadline) <= self._now():
            raise gl.vm.UserError("Deadline must be in the future")

        self.proposals[proposal_id] = Proposal(
            id=proposal_id,
            title=title,
            description=description,
            creator=gl.message.sender_address.as_hex,
            deadline=u256(int(deadline)),
            yes_votes=u256(0),
            no_votes=u256(0),
            resolved=False,
            result=""
        )
        self.proposal_counter += u256(1)

    @gl.public.write
    def cast_vote(self, proposal_id: str, vote: str) -> None:
        """Cast a vote (yes/no) on a proposal."""
        sender = gl.message.sender_address.as_hex
        rec = self.voters.get(sender, None)
        if rec is None or not rec.registered:
            raise gl.vm.UserError("Must register to vote")
        if rec.last_proposal_voted == proposal_id:
            raise gl.vm.UserError("Already voted on this proposal")

        proposal = self.proposals.get(proposal_id, None)
        if proposal is None:
            raise gl.vm.UserError(f"Proposal {proposal_id} not found")
        if proposal.resolved:
            raise gl.vm.UserError("Proposal already resolved")
        if self._now() >= int(proposal.deadline):
            raise gl.vm.UserError("Voting deadline has passed")

        if vote.lower() == "yes":
            proposal.yes_votes += u256(1)
        elif vote.lower() == "no":
            proposal.no_votes += u256(1)
        else:
            raise gl.vm.UserError("Vote must be 'yes' or 'no'")

        rec.last_proposal_voted = proposal_id
        self.voters[sender] = rec
        self.proposals[proposal_id] = proposal

    @gl.public.write
    def resolve_proposal(self, proposal_id: str) -> str:
        """Resolve a proposal using consensus on the FINAL RESULT."""
        proposal = self.proposals.get(proposal_id, None)
        if proposal is None:
            raise gl.vm.UserError(f"Proposal {proposal_id} not found")
        if proposal.resolved:
            raise gl.vm.UserError("Proposal already resolved")

        def leader_work() -> dict:
            yes = int(proposal.yes_votes)
            no = int(proposal.no_votes)
            total = yes + no

            if total == 0:
                return {"result": "INCONCLUSIVE", "yes": yes, "no": no}

            yes_pct = (yes * 100) // total
            no_pct = (no * 100) // total

            if yes_pct > 50:
                result = "PASS"
            elif no_pct > 50:
                result = "FAIL"
            else:
                result = "INCONCLUSIVE"

            return {"result": result, "yes": yes, "no": no, "yes_pct": yes_pct, "no_pct": no_pct}

        def validator(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                leader_msg = getattr(leaders_res, "message", "")
                try:
                    leader_work()
                    return False
                except gl.vm.UserError as e:
                    return str(e.message) == str(leader_msg)
                except Exception:
                    return False
            try:
                mine = leader_work()
            except Exception:
                return False
            return mine["result"] == leaders_res.calldata["result"]

        try:
            verified = gl.vm.run_nondet_unsafe(leader_work, validator)
        except gl.vm.UserError as e:
            raise gl.vm.UserError(f"Consensus failed: {e.message}")

        proposal.resolved = True
        proposal.result = verified["result"]
        self.proposals[proposal_id] = proposal
        return verified["result"]

    @gl.public.view
    def get_proposal(self, proposal_id: str) -> str:
        """Get proposal details."""
        proposal = self.proposals.get(proposal_id, None)
        if proposal is None:
            return json.dumps({"proposal_id": proposal_id, "exists": False})
        return json.dumps({
            "proposal_id": proposal.id,
            "exists": True,
            "title": proposal.title,
            "description": proposal.description,
            "creator": proposal.creator,
            "deadline": int(proposal.deadline),
            "yes_votes": int(proposal.yes_votes),
            "no_votes": int(proposal.no_votes),
            "resolved": proposal.resolved,
            "result": proposal.result,
            "expired": self._now() >= int(proposal.deadline)
        })

    @gl.public.view
    def get_proposals_count(self) -> str:
        """Get total number of proposals."""
        return str(len(self.proposals))

    @gl.public.view
    def is_voter(self, address: str) -> str:
        """Check if address is registered voter."""
        addr = address.lower() if hasattr(address, 'lower') else str(address).lower()
        rec = self.voters.get(addr, None)
        return "true" if rec is not None and rec.registered else "false"

    @gl.public.view
    def now(self) -> str:
        return str(self._now())

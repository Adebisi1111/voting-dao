"""Tests for VotingDAO contract."""
import pytest


def test_create_proposal(direct_vm, direct_deploy, direct_alice):
    """Test creating a proposal."""
    contract = direct_deploy("contracts/voting_dao.py")

    direct_vm.sender = direct_alice
    deadline = int(datetime.now(timezone.utc).timestamp()) + 86400  # 1 day from now

    contract.create_proposal(
        proposal_id="prop-1",
        title="Test Proposal",
        description="A test proposal",
        deadline=deadline
    )

    proposal = json.loads(contract.get_proposal("prop-1"))
    assert proposal["exists"] is True
    assert proposal["title"] == "Test Proposal"
    assert proposal["yes_votes"] == 0
    assert proposal["no_votes"] == 0
    assert proposal["resolved"] is False


def test_register_and_vote(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Test registering and voting."""
    contract = direct_deploy("contracts/voting_dao.py")

    # Register voters
    direct_vm.sender = direct_alice
    direct_vm.value = 100000000000000000  # 0.1 GEN
    contract.register_voter()

    direct_vm.sender = direct_bob
    direct_vm.value = 100000000000000000
    contract.register_voter()

    # Create proposal
    direct_vm.sender = direct_alice
    deadline = int(datetime.now(timezone.utc).timestamp()) + 86400
    contract.create_proposal("prop-1", "Test", "Test desc", deadline)

    # Cast votes
    contract.cast_vote("prop-1", "yes")

    direct_vm.sender = direct_bob
    contract.cast_vote("prop-1", "no")

    proposal = json.loads(contract.get_proposal("prop-1"))
    assert proposal["yes_votes"] == 1
    assert proposal["no_votes"] == 1


def test_resolve_proposal(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    """Test resolving a proposal with consensus."""
    contract = direct_deploy("contracts/voting_dao.py")

    # Register voters
    for addr in [direct_alice, direct_bob, direct_charlie]:
        direct_vm.sender = addr
        direct_vm.value = 100000000000000000
        contract.register_voter()

    # Create proposal
    direct_vm.sender = direct_alice
    deadline = int(datetime.now(timezone.utc).timestamp()) + 86400
    contract.create_proposal("prop-1", "Test", "Test desc", deadline)

    # Cast votes: 2 yes, 1 no
    contract.cast_vote("prop-1", "yes")
    direct_vm.sender = direct_bob
    contract.cast_vote("prop-1", "yes")
    direct_vm.sender = direct_charlie
    contract.cast_vote("prop-1", "no")

    # Resolve
    direct_vm.sender = direct_alice
    result = contract.resolve_proposal("prop-1")
    assert result == "PASS"

    proposal = json.loads(contract.get_proposal("prop-1"))
    assert proposal["resolved"] is True
    assert proposal["result"] == "PASS"


def test_double_vote_fails(direct_vm, direct_deploy, direct_alice):
    """Test that voting twice on same proposal fails."""
    contract = direct_deploy("contracts/voting_dao.py")

    direct_vm.sender = direct_alice
    direct_vm.value = 100000000000000000
    contract.register_voter()

    deadline = int(datetime.now(timezone.utc).timestamp()) + 86400
    contract.create_proposal("prop-1", "Test", "Test desc", deadline)
    contract.cast_vote("prop-1", "yes")

    # Second vote on same proposal should fail
    with direct_vm.expect_revert("Already voted on this proposal"):
        contract.cast_vote("prop-1", "no")


def test_unregistered_vote_fails(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Test that unregistered users cannot vote."""
    contract = direct_deploy("contracts/voting_dao.py")

    direct_vm.sender = direct_alice
    deadline = int(datetime.now(timezone.utc).timestamp()) + 86400
    contract.create_proposal("prop-1", "Test", "Test desc", deadline)

    direct_vm.sender = direct_bob  # Not registered
    with direct_vm.expect_revert("Must register to vote"):
        contract.cast_vote("prop-1", "yes")


def test_proposal_not_found(direct_vm, direct_deploy, direct_alice):
    """Test getting non-existent proposal."""
    contract = direct_deploy("contracts/voting_dao.py")

    direct_vm.sender = direct_alice
    proposal = json.loads(contract.get_proposal("nonexistent"))
    assert proposal["exists"] is False


def test_get_proposals_count(direct_vm, direct_deploy, direct_alice):
    """Test counting proposals."""
    contract = direct_deploy("contracts/voting_dao.py")

    direct_vm.sender = direct_alice
    assert contract.get_proposals_count() == "0"

    deadline = int(datetime.now(timezone.utc).timestamp()) + 86400
    contract.create_proposal("prop-1", "Test", "Test desc", deadline)
    assert contract.get_proposals_count() == "1"


from datetime import datetime, timezone
import json

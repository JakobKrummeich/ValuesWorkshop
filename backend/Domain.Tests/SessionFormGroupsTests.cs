namespace ValuesWorkshop.Domain.Tests;

public class SessionFormGroupsTests
{
    [Fact]
    public void Advancing_into_group_formation_forms_named_groups_sized_by_the_sizing_rule()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 3);

        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupFormation);
        session.Formation.IsFormed.ShouldBeTrue();
        session.Formation.Groups.Select(group => group.Name).ShouldBe(["tier-1", "tier-2"]);
        session.Formation.Groups.Select(group => group.Members.Count).ShouldBe([5, 4]);
        session.Formation.Groups.Select(group => group.AssignedValues.Count).ShouldBe([2, 1]);
    }

    [Fact]
    public void Every_participant_lands_in_exactly_one_group()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 3);

        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session
            .Formation.Groups.SelectMany(group => group.Members)
            .ShouldBe(
                session.Roster.Participants.Select(participant => participant.Id),
                ignoreOrder: true
            );
    }

    [Fact]
    public void A_participant_who_joined_while_the_groups_were_forming_still_lands_in_a_group()
    {
        var session = SessionAwaitingFormation(participantCount: 8, topValueCount: 4);
        session.AdvancePhase();
        var members = Enumerable.Range(1, 8).Select(ParticipantAt).ToList();
        var topValues = TestValueIds.Numbered(1, 4);
        var assignmentWithoutTheLatecomer = new GroupFormationResult([
            new FormedGroup(members.Take(4).ToList(), topValues.Take(2).ToList()),
            new FormedGroup(members.Skip(4).ToList(), topValues.Skip(2).ToList()),
        ]);
        var latecomer = TestParticipants.Named(ParticipantAt(99), "Late Lena");
        session.Join(latecomer, new FixedRandomness(0));

        session.FormGroups(
            assignmentWithoutTheLatecomer,
            new TestGroupNames(8).Names,
            new FixedRandomness(0)
        );

        session.Formation.Groups.SelectMany(group => group.Members).ShouldContain(latecomer.Id);
        session.Formation.Groups.Select(group => group.Members.Count).ShouldBe([5, 4]);
    }

    [Fact]
    public void Every_top_value_is_dealt_to_exactly_one_group()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 3);

        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session
            .Formation.Groups.SelectMany(group => group.AssignedValues)
            .ShouldBe(session.Selection.TopValues, ignoreOrder: true);
    }

    [Fact]
    public void The_solver_request_carries_the_roster_selections_and_top_values()
    {
        var session = SessionAwaitingFormation(participantCount: 2, topValueCount: 3);
        var solver = new RecordingGroupSolver();

        AdvanceIntoGroupFormation(session, solver);

        var request = solver.LastRequest.ShouldNotBeNull();
        request
            .Participants.Select(participant => participant.ParticipantId)
            .ShouldBe(session.Roster.Participants.Select(participant => participant.Id));
        request.Participants.ShouldAllBe(participant =>
            participant.SelectedValues.SequenceEqual(TestValueIds.Numbered(1, 3))
        );
        request.TopValues.ShouldBe(session.Selection.TopValues);
    }

    [Fact]
    public void Groups_already_formed_are_never_re_formed()
    {
        var alreadyFormed = FormationRecord.Restore(
            true,
            [Group.Restore("otter", [ParticipantAt(1)], [new ValueId("wert-1")], null, false, [])]
        );
        var session = SessionAwaitingFormation(
            participantCount: 9,
            topValueCount: 3,
            formation: alreadyFormed
        );

        AdvanceIntoGroupFormation(session, new ThrowingGroupSolver());

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupFormation);
        var group = session.Formation.Groups.ShouldHaveSingleItem();
        group.Name.ShouldBe("otter");
        group.Members.ShouldBe([ParticipantAt(1)]);
        group.AssignedValues.ShouldBe([new ValueId("wert-1")]);
    }

    [Fact]
    public void Forming_an_already_formed_session_again_changes_nothing()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 3);
        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session.FormGroups(
            new GroupFormationResult([new FormedGroup([ParticipantAt(1)], [])]),
            ["usurper"],
            new FixedRandomness(0)
        );

        session.Formation.Groups.Select(group => group.Name).ShouldBe(["tier-1", "tier-2"]);
    }

    [Fact]
    public void Formation_waits_until_the_group_formation_phase_is_reached()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 3);

        FormationWith(new ThrowingGroupSolver()).ExecuteFor(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.SelectionResults);
        session.Formation.IsFormed.ShouldBeFalse();
    }

    [Fact]
    public void Advancing_out_of_group_formation_re_forms_nothing()
    {
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.GroupFormation,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore(
                        "otter",
                        [ParticipantAt(1)],
                        [new ValueId("wert-1")],
                        null,
                        false,
                        []
                    ),
                ]
            )
        );

        session.AdvancePhase();
        FormationWith(new ThrowingGroupSolver()).ExecuteFor(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupWork);
        session.Formation.Groups.ShouldHaveSingleItem().Name.ShouldBe("otter");
    }

    [Fact]
    public void A_session_without_participants_forms_one_empty_group()
    {
        var session = SessionAwaitingFormation(participantCount: 0, topValueCount: 0);

        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session.Formation.IsFormed.ShouldBeTrue();
        var group = session.Formation.Groups.ShouldHaveSingleItem();
        group.Name.ShouldBe("tier-1");
        group.Members.ShouldBeEmpty();
        group.AssignedValues.ShouldBeEmpty();
    }

    [Fact]
    public void A_session_without_top_values_forms_groups_without_assigned_values()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 0);

        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session.Formation.Groups.Count.ShouldBe(2);
        session.Formation.Groups.ShouldAllBe(group => group.AssignedValues.Count == 0);
    }

    [Fact]
    public void A_formation_needing_more_group_names_than_exist_is_refused()
    {
        var session = SessionAwaitingFormation(participantCount: 9, topValueCount: 3);
        session.AdvancePhase();

        Should
            .Throw<InvariantViolationException>(() =>
                new GroupFormation(
                    new TestGroupSolver(),
                    new TestGroupNames(1),
                    new FixedRandomness(0)
                ).ExecuteFor(session)
            )
            .Message.ShouldContain("group names");

        session.Formation.IsFormed.ShouldBeFalse();
        session.Formation.Groups.ShouldBeEmpty();
    }

    [Fact]
    public void Thirty_participants_fit_within_the_eight_group_names()
    {
        var session = SessionAwaitingFormation(participantCount: 30, topValueCount: 10);

        AdvanceIntoGroupFormation(session, new TestGroupSolver());

        session.Formation.Groups.Count.ShouldBe(7);
        session
            .Formation.Groups.Select(group => group.Name)
            .ShouldBe(["tier-1", "tier-2", "tier-3", "tier-4", "tier-5", "tier-6", "tier-7"]);
    }

    private static void AdvanceIntoGroupFormation(Session session, IGroupSolver groupSolverPort)
    {
        session.AdvancePhase();
        FormationWith(groupSolverPort).ExecuteFor(session);
    }

    private static GroupFormation FormationWith(IGroupSolver groupSolverPort)
    {
        return new GroupFormation(groupSolverPort, new TestGroupNames(8), new FixedRandomness(0));
    }

    private static ParticipantId ParticipantAt(int number)
    {
        return new ParticipantId(new Guid(number, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0]));
    }

    private static Session SessionAwaitingFormation(
        int participantCount,
        int topValueCount,
        FormationRecord? formation = null
    )
    {
        var participants = Enumerable
            .Range(1, participantCount)
            .Select(number => TestParticipants.Named(ParticipantAt(number), $"Person {number}"))
            .ToList();
        var topValues = TestValueIds.Numbered(1, topValueCount);
        var selectedValues = participants.SelectMany(participant =>
            TestValueIds
                .Numbered(1, 3)
                .Select(valueId => new SelectedValue(participant.Id, valueId))
        );

        return Session.Restore(
            new SessionIdentity(Guid.NewGuid()),
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore(participants),
            PhaseProgress.Restore(Phase.SelectionResults),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore(selectedValues, topValues),
            formation ?? FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null, 0),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );
    }

    private sealed class RecordingGroupSolver : IGroupSolver
    {
        public GroupFormationRequest? LastRequest { get; private set; }

        public GroupFormationResult Solve(GroupFormationRequest request)
        {
            LastRequest = request;
            return new TestGroupSolver().Solve(request);
        }
    }
}

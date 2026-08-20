namespace ValuesWorkshop.Domain;

public sealed class GroupFormation(IGroupSolver groupSolverPort, IAnimalNames animalNamesPort)
{
    public void EnsureFormedFor(Session session)
    {
        if (
            session.PhaseProgress.CurrentPhase != Phase.GroupFormation
            || session.Formation.IsFormed
        )
        {
            return;
        }

        var participants = session
            .Roster.Participants.Select(participant => new ParticipantSelection(
                participant.Id,
                session.Selection.SelectedValuesOf(participant.Id)
            ))
            .ToList();

        var formationResult = groupSolverPort.Solve(
            new GroupFormationRequest(participants, session.Selection.TopValues)
        );

        session.FormGroups(formationResult, animalNamesPort.Names);
    }
}

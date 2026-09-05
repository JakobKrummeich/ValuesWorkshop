namespace ValuesWorkshop.Domain;

public interface IGroupSolver
{
    GroupSolverOutcome Solve(GroupFormationRequest request, CancellationToken cancellationToken);
}

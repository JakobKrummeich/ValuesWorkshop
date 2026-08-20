namespace ValuesWorkshop.Domain;

public interface IGroupSolver
{
    GroupFormationResult Solve(GroupFormationRequest request);
}

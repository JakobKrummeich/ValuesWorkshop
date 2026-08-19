namespace ValuesWorkshop.Domain.Ports;

public interface IGroupSolver
{
    GroupFormationResult Solve(GroupFormationRequest request);
}

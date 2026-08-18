namespace ValuesWorkshop.Application.Ports.Driven;

public interface IGroupSolver
{
    GroupFormationResult Solve(GroupFormationRequest request);
}

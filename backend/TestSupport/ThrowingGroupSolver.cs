using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class ThrowingGroupSolver : IGroupSolver
{
    public GroupFormationResult Solve(GroupFormationRequest request)
    {
        throw new InvalidOperationException("Group formation found no assignment.");
    }
}

using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class TestFormationProgress(double progress) : IGroupFormationProgress
{
    public double ProgressOf(SessionIdentity sessionIdentity)
    {
        return progress;
    }
}

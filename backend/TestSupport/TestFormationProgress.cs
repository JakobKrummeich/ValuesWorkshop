using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class TestFormationProgress(double progress) : IGroupFormationProgress
{
    public FormationProgress ProgressOf(SessionIdentity sessionIdentity)
    {
        return new FormationProgress(progress);
    }
}

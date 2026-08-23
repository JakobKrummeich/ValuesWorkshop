using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Formation;

public interface IGroupFormationProgress
{
    double ProgressOf(SessionIdentity sessionIdentity);
}

using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Formation;

public interface IGroupFormationProgress
{
    FormationProgress ProgressOf(SessionIdentity sessionIdentity);
}

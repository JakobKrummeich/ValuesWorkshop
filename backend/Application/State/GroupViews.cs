using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal sealed class GroupViews(
    IAnimalsCatalog animalsCatalogPort,
    IValuesCatalog valuesCatalogPort
)
{
    private readonly IReadOnlyDictionary<string, GroupNameView> nameOfAnimal =
        animalsCatalogPort.Animals.ToDictionary(
            animal => animal.AnimalId,
            animal => new GroupNameView(
                animal.AnimalId,
                new LocalizedTextView(animal.Text.German, animal.Text.English)
            )
        );

    private readonly IReadOnlyDictionary<string, WorkshopValueView> valueOfId = SelectionViews
        .CatalogOf(valuesCatalogPort)
        .ToDictionary(value => value.ValueId);

    internal GroupNameView NameOf(Group group)
    {
        if (!nameOfAnimal.TryGetValue(group.Name, out var name))
        {
            throw new InvalidOperationException(
                $"The group name '{group.Name}' is not an animal in the animals catalog."
            );
        }

        return name;
    }

    internal IReadOnlyList<WorkshopValueView> AssignedValuesOf(Group group)
    {
        return group.AssignedValues.Select(ValueViewOf).ToList();
    }

    internal IReadOnlyList<string> MemberDisplayNamesOf(Group group, Session session)
    {
        return group.Members.Select(member => SessionViews.DisplayNameOf(session, member)).ToList();
    }

    internal IReadOnlyList<RosterParticipantView> MembersOf(Group group, Session session)
    {
        return group
            .Members.Select(member => new RosterParticipantView(
                member.Value,
                SessionViews.DisplayNameOf(session, member)
            ))
            .ToList();
    }

    private WorkshopValueView ValueViewOf(ValueId valueId)
    {
        if (!valueOfId.TryGetValue(valueId.Value, out var value))
        {
            throw new InvalidOperationException(
                $"The assigned value '{valueId.Value}' is not in the values catalog."
            );
        }

        return value;
    }
}

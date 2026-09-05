using FsCheck;
using FsCheck.Fluent;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class WorkshopGenerators
{
    public static Arbitrary<int> CountBetween(int lowest, int highest)
    {
        return Arb.From(
            Gen.Choose(lowest, highest),
            value =>
                ArbMap
                    .Default.ArbFor<int>()
                    .Shrinker(value)
                    .Where(candidate => candidate >= lowest && candidate <= highest)
        );
    }

    public static ParticipantId ParticipantNumbered(int number)
    {
        return new ParticipantId(new Guid($"00000000-0000-0000-0000-{number:d12}"));
    }

    public static IReadOnlyList<Participant> ParticipantsNumbered(int participantCount)
    {
        return Enumerable
            .Range(1, participantCount)
            .Select(number =>
                TestParticipants.Named(ParticipantNumbered(number), $"Participant {number}")
            )
            .ToList();
    }

    public static Gen<IReadOnlyList<ValueId>> DistinctValuesFrom(
        IReadOnlyList<ValueId> catalog,
        int valueCount
    )
    {
        return Gen.Shuffle<ValueId>(catalog)
            .Select(shuffled => (IReadOnlyList<ValueId>)shuffled.Take(valueCount).ToList());
    }

    public static IEnumerable<IReadOnlyList<TItem>> ListsWithOneItemDropped<TItem>(
        IReadOnlyList<TItem> items
    )
    {
        for (var droppedIndex = 0; droppedIndex < items.Count; droppedIndex++)
        {
            yield return items.Where((_, index) => index != droppedIndex).ToList();
        }
    }
}

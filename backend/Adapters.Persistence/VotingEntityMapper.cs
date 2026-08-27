using ValuesWorkshop.Adapters.Persistence.Entities;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Persistence;

internal static class VotingEntityMapper
{
    internal static List<VotingRoundEntity> RoundEntities(
        string sessionIdentity,
        VotingRounds voting
    )
    {
        var rounds = voting
            .ClosedRounds.Select(round => (round.RoundNumber, round.Allotment, round.VotedCount))
            .ToList();

        if (voting.RoundOpen)
        {
            rounds.Add((voting.RoundNumber, voting.Allotment, voting.VotedCount));
        }

        return rounds
            .Select(round => new VotingRoundEntity
            {
                SessionIdentity = sessionIdentity,
                RoundNumber = round.RoundNumber,
                Allotment = round.Allotment,
                VotedCount = round.VotedCount,
            })
            .ToList();
    }

    internal static List<VoteTallyEntity> TallyEntities(string sessionIdentity, VotingRounds voting)
    {
        var talliesPerRound = voting
            .ClosedRounds.Select(round => (round.RoundNumber, round.EligibleValues, round.Tallies))
            .ToList();

        if (voting.RoundOpen)
        {
            talliesPerRound.Add(
                (voting.RoundNumber, voting.EligibleValues, voting.OpenRoundTallies)
            );
        }

        return talliesPerRound
            .SelectMany(round =>
                round.EligibleValues.Select(
                    (value, index) =>
                        new VoteTallyEntity
                        {
                            SessionIdentity = sessionIdentity,
                            RoundNumber = round.RoundNumber,
                            ValueId = value.Value,
                            VoteCount = round.Tallies[value],
                            SortOrder = index,
                        }
                )
            )
            .ToList();
    }

    internal static List<VotedParticipantEntity> VotedParticipantEntities(
        string sessionIdentity,
        VotingRounds voting
    )
    {
        return voting
            .OpenRoundVotedParticipants.Select(participantId => new VotedParticipantEntity
            {
                SessionIdentity = sessionIdentity,
                RoundNumber = voting.RoundNumber,
                ParticipantId = participantId.Value.ToString(),
            })
            .ToList();
    }

    internal static List<VotingRoundTieEntity> TieEntities(
        string sessionIdentity,
        VotingRounds voting
    )
    {
        return voting
            .ClosedRounds.SelectMany(round =>
                round.TiedValues.Select(
                    (value, index) =>
                        new VotingRoundTieEntity
                        {
                            SessionIdentity = sessionIdentity,
                            RoundNumber = round.RoundNumber,
                            ValueId = value.Value,
                            SortOrder = index,
                        }
                )
            )
            .ToList();
    }

    internal static List<WinningValueEntity> WinningValueEntities(
        string sessionIdentity,
        VotingRounds voting
    )
    {
        var rank = 0;

        return voting
            .ClosedRounds.SelectMany(round =>
                round.LockedValues.Select(value =>
                {
                    rank++;
                    return new WinningValueEntity
                    {
                        SessionIdentity = sessionIdentity,
                        ValueId = value.Value,
                        Rank = rank,
                        RoundNumber = round.RoundNumber,
                    };
                })
            )
            .ToList();
    }

    internal static VotingRounds RestoreVoting(SessionEntity entity)
    {
        var rounds = entity.VotingRounds.OrderBy(round => round.RoundNumber).ToList();

        var openRoundEntity = entity.VotingState.RoundOpen
            ? rounds.Single(round => round.RoundNumber == entity.VotingState.RoundNumber)
            : null;

        var closedRounds = rounds
            .Where(round => round != openRoundEntity)
            .Select(round => new ClosedVotingRound(
                round.RoundNumber,
                round.Allotment,
                EligibleValuesOf(entity, round.RoundNumber),
                TalliesOf(entity, round.RoundNumber),
                round.VotedCount,
                LockedValuesOf(entity, round.RoundNumber),
                TiedValuesOf(entity, round.RoundNumber)
            ))
            .ToList();

        var openRound = openRoundEntity is null
            ? null
            : new OpenVotingRound(
                openRoundEntity.RoundNumber,
                openRoundEntity.Allotment,
                EligibleValuesOf(entity, openRoundEntity.RoundNumber),
                TalliesOf(entity, openRoundEntity.RoundNumber),
                VotedParticipantsOf(entity, openRoundEntity.RoundNumber)
            );

        return VotingRounds.Restore(closedRounds, openRound);
    }

    private static IReadOnlyList<ValueId> EligibleValuesOf(SessionEntity entity, int roundNumber)
    {
        return entity
            .VoteTallies.Where(tally => tally.RoundNumber == roundNumber)
            .OrderBy(tally => tally.SortOrder)
            .Select(tally => new ValueId(tally.ValueId))
            .ToList();
    }

    private static IReadOnlyDictionary<ValueId, int> TalliesOf(
        SessionEntity entity,
        int roundNumber
    )
    {
        return entity
            .VoteTallies.Where(tally => tally.RoundNumber == roundNumber)
            .ToDictionary(tally => new ValueId(tally.ValueId), tally => tally.VoteCount);
    }

    private static IReadOnlySet<ParticipantId> VotedParticipantsOf(
        SessionEntity entity,
        int roundNumber
    )
    {
        return entity
            .VotedParticipants.Where(voted => voted.RoundNumber == roundNumber)
            .Select(voted => new ParticipantId(Guid.Parse(voted.ParticipantId)))
            .ToHashSet();
    }

    private static IReadOnlyList<ValueId> LockedValuesOf(SessionEntity entity, int roundNumber)
    {
        return entity
            .WinningValues.Where(winner => winner.RoundNumber == roundNumber)
            .OrderBy(winner => winner.Rank)
            .Select(winner => new ValueId(winner.ValueId))
            .ToList();
    }

    private static IReadOnlyList<ValueId> TiedValuesOf(SessionEntity entity, int roundNumber)
    {
        return entity
            .VotingRoundTies.Where(tie => tie.RoundNumber == roundNumber)
            .OrderBy(tie => tie.SortOrder)
            .Select(tie => new ValueId(tie.ValueId))
            .ToList();
    }
}

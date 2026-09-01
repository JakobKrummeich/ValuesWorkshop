namespace ValuesWorkshop.Domain;

public sealed class WinnerReveal
{
    public int RevealedCount { get; private set; }

    public bool IsConcluded => RevealedCount == VotingRounds.RequiredWinningValueCount;

    internal void RevealNext()
    {
        if (IsConcluded)
        {
            throw new InvariantViolationException(
                "Every winner has been revealed; nothing is left to reveal."
            );
        }

        RevealedCount++;
    }

    internal static WinnerReveal Restore(int revealedCount)
    {
        if (revealedCount < 0 || revealedCount > VotingRounds.RequiredWinningValueCount)
        {
            throw new ArgumentOutOfRangeException(
                nameof(revealedCount),
                revealedCount,
                $"Must be between 0 and {VotingRounds.RequiredWinningValueCount}."
            );
        }

        return new WinnerReveal { RevealedCount = revealedCount };
    }
}

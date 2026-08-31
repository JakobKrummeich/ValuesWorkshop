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
        return new WinnerReveal { RevealedCount = revealedCount };
    }
}

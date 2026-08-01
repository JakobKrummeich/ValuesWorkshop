namespace ValuesWorkshop.Host.Tests;

internal sealed class SaveGate
{
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(10);

    private readonly TaskCompletionSource saveHeld = new(
        TaskCreationOptions.RunContinuationsAsynchronously
    );
    private readonly TaskCompletionSource saveReleased = new(
        TaskCreationOptions.RunContinuationsAsynchronously
    );

    private int holdsRequested;
    private int savesToHold;

    internal void HoldTheNextSave()
    {
        if (Interlocked.Increment(ref holdsRequested) > 1)
        {
            throw new InvalidOperationException(
                "A SaveGate holds one save for its whole lifetime; use a second gate."
            );
        }

        Interlocked.Exchange(ref savesToHold, 1);
    }

    internal Task WaitUntilSaveIsHeldAsync()
    {
        return saveHeld.Task.WaitAsync(Patience);
    }

    internal void ReleaseHeldSave()
    {
        saveReleased.TrySetResult();
    }

    internal async Task PassAsync()
    {
        if (Interlocked.Exchange(ref savesToHold, 0) == 0)
        {
            return;
        }

        saveHeld.TrySetResult();

        await saveReleased.Task.WaitAsync(Patience);
    }
}

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

    private int savesToHold;

    internal void HoldNextSave()
    {
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

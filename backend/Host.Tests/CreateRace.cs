namespace ValuesWorkshop.Host.Tests;

internal sealed class CreateRace
{
    private int rivalCreatesToRun;

    internal void LetARivalWinTheNextCreate()
    {
        Interlocked.Exchange(ref rivalCreatesToRun, 1);
    }

    internal bool ShouldARivalWinTheNextCreate()
    {
        return Interlocked.Exchange(ref rivalCreatesToRun, 0) == 1;
    }
}

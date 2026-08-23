namespace ValuesWorkshop.Application.Formation;

public sealed record GroupFormationWindow(TimeSpan Value)
{
    public TimeSpan Value { get; } = Guarded(Value);

    private static TimeSpan Guarded(TimeSpan value)
    {
        if (value <= TimeSpan.Zero)
        {
            throw new InvalidOperationException(
                "A group formation window must last longer than no time at all."
            );
        }

        return value;
    }
}

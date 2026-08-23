namespace ValuesWorkshop.Domain;

public sealed record GroupFormationWindow(TimeSpan Value)
{
    public static GroupFormationWindow Default { get; } = new(TimeSpan.FromSeconds(3));

    public TimeSpan Value { get; } = Guarded(Value);

    public FormationProgress ProgressAfter(TimeSpan elapsed)
    {
        return new FormationProgress(Math.Clamp(elapsed / Value, 0, 1));
    }

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

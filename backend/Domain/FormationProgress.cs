namespace ValuesWorkshop.Domain;

public sealed record FormationProgress(double Value)
{
    public static FormationProgress NotStarted { get; } = new(0);

    public double Value { get; } = Guarded(Value);

    public bool IsWindowOver => Value >= 1;

    private static double Guarded(double value)
    {
        if (double.IsNaN(value) || value < 0 || value > 1)
        {
            throw new InvalidOperationException(
                "Formation progress is a fraction of the window and runs from 0 to 1."
            );
        }

        return value;
    }
}

namespace ValuesWorkshop.TestSupport;

public sealed class ManualTimeProvider : TimeProvider
{
    private long timestamp;

    public override long TimestampFrequency => TimeSpan.TicksPerSecond;

    public override long GetTimestamp()
    {
        return timestamp;
    }

    public void Advance(TimeSpan elapsed)
    {
        timestamp += elapsed.Ticks;
    }
}

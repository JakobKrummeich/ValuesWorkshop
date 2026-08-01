using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

internal sealed class RecordingBroadcaster : IBroadcaster
{
    internal List<Session> Broadcasts { get; } = [];

    public Task BroadcastSessionStateAsync(Session session)
    {
        Broadcasts.Add(session);

        return Task.CompletedTask;
    }
}

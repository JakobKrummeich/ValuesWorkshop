using System.Threading.Channels;
using Microsoft.AspNetCore.SignalR.Client;

namespace ValuesWorkshop.Host.Tests;

internal sealed class StateInbox<TState>
{
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(10);

    private readonly Channel<TState> received = Channel.CreateUnbounded<TState>();

    internal StateInbox(HubConnection connection)
    {
        connection.On<TState>("ReceiveWorkshopState", state => received.Writer.TryWrite(state));
    }

    internal async Task<TState> NextAsync()
    {
        using var patience = new CancellationTokenSource(Patience);

        return await received.Reader.ReadAsync(patience.Token);
    }
}

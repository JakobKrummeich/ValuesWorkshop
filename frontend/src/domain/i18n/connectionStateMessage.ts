import { ConnectionState } from "../connectionState";
import { MessageKey } from "./messages";

const connectionStateMessages: Readonly<Record<ConnectionState, MessageKey>> = {
  [ConnectionState.Connecting]: MessageKey.ConnectionConnecting,
  [ConnectionState.Connected]: MessageKey.ConnectionConnected,
  [ConnectionState.Reconnecting]: MessageKey.ConnectionReconnecting,
  [ConnectionState.Disconnected]: MessageKey.ConnectionDisconnected,
};

export function connectionStateMessage(state: ConnectionState): MessageKey {
  return connectionStateMessages[state];
}

# Wire contract corpus

The machine-checked shadow of `design/protocol.md` §§ 4–6. Backend tests write
these files, frontend tests read them, so a rename, a removal or a retype on
either side of the SignalR seam fails a gate in the pull request that causes it.

| File                            | Holds                                                    | Producer                                          | Consumer                                              |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `intents.json`                  | hub method names + parameter names, the state callback   | `backend/Adapters.Tests/WireContractTests.cs`      | `frontend/src/adapters/__tests__/wireIntents.test.ts`  |
| `enums.json`                    | every wire enum member as the serializer writes it       | `backend/Adapters.Tests/WireEnumContractTests.cs`  | `frontend/src/domain/__tests__/wireEnums.test.ts`      |
| `state/<role>/<scenario>.json`  | one serialized workshop state per role and phase         | `backend/Adapters.Tests/WireStateContractTests.cs` | `frontend/src/domain/__tests__/wireContract.test.ts`   |

Everything is serialized through the same `JsonHubProtocol` the hubs push with,
so the files record the wire form (`3`, `"editing"`, `"forming"`) rather than a
guess read off the C# source.

## Changing the contract

```
CONTRACT_WRITE=1 dotnet test backend/ValuesWorkshop.Tests.slnf
```

That rewrites the files from the hubs, the enums and the fixtures in
`backend/Adapters.Tests/WireStateFixtures.cs`. Review the diff — it is the
change the frontend has to follow — and commit it with the code that caused it.
Without the switch the same tests only compare and fail on drift.

Scenario names are phase names, plus a suffix where a phase has more than one
shape worth checking (`groupFormationForming`, `finalVotingClosed`). A scenario
may cover fewer than the three roles when only one role renders it, e.g.
`groupWorkWithoutOwnGroup`. `WireVariantCoverageTests` keeps the corpus honest:
every `[JsonDerivedType]` discriminator and every state a screen renders
differently must appear in at least one sample.

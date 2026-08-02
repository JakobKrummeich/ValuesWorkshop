using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class SessionCreationHandlerTests
{
    private static readonly FacilitatorSubject Facilitator = new("facilitator-subject");

    [Fact]
    public async Task A_rejected_passphrase_never_reaches_the_repository()
    {
        var repository = FakeSessionRepository.Empty();
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var result = await handler.CreateAsync(Facilitator, new SessionName("Workshop"), "wrong");

        result.ShouldBeOfType<SessionCreationResult.PassphraseRejected>();
        repository.Created.ShouldBeEmpty();
        repository.Loads.ShouldBe(0);
    }

    [Fact]
    public async Task A_rejected_passphrase_wins_over_an_invalid_session_name()
    {
        var repository = FakeSessionRepository.Empty();
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var result = await handler.CreateAsync(Facilitator, new SessionName("   "), "wrong");

        result.ShouldBeOfType<SessionCreationResult.PassphraseRejected>();
    }

    [Fact]
    public async Task A_blank_session_name_is_an_invalid_request_and_creates_nothing()
    {
        var repository = FakeSessionRepository.Empty();
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var result = await handler.CreateAsync(Facilitator, new SessionName("   "), "correct");

        result.ShouldBeOfType<SessionCreationResult.InvalidRequest>();
        repository.Created.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_oversized_session_name_is_an_invalid_request()
    {
        var repository = FakeSessionRepository.Empty();
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var result = await handler.CreateAsync(
            Facilitator,
            new SessionName(new string('n', 500)),
            "correct"
        );

        result.ShouldBeOfType<SessionCreationResult.InvalidRequest>();
        repository.Created.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_accepted_creation_persists_exactly_one_session_for_the_caller()
    {
        var repository = FakeSessionRepository.Empty();
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var result = await handler.CreateAsync(
            Facilitator,
            new SessionName("  Workshop  "),
            "correct"
        );

        var accepted = result.ShouldBeOfType<SessionCreationResult.Accepted>();
        repository.Created.Count.ShouldBe(1);

        var created = repository.Created[0];
        created.Identity.ShouldBe(accepted.SessionIdentity);
        created.Name.Value.ShouldBe("Workshop");
        created.Revision.ShouldBe(0);
        created.IsFacilitatedBy(Facilitator).ShouldBeTrue();
    }

    [Fact]
    public async Task Two_accepted_creations_produce_two_different_session_identities()
    {
        var repository = FakeSessionRepository.Empty();
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var first = await handler.CreateAsync(Facilitator, new SessionName("First"), "correct");
        var second = await handler.CreateAsync(Facilitator, new SessionName("Second"), "correct");

        first
            .ShouldBeOfType<SessionCreationResult.Accepted>()
            .SessionIdentity.ShouldNotBe(
                second.ShouldBeOfType<SessionCreationResult.Accepted>().SessionIdentity
            );
    }

    [Fact]
    public async Task An_identity_that_the_repository_rejects_as_a_conflict_is_unavailable()
    {
        var repository = FakeSessionRepository.Holding(
            TestSessions.Open(new SessionIdentity(Guid.NewGuid()))
        );
        var handler = new SessionCreationHandler(repository, new FakePassphrase("correct"));

        var result = await handler.CreateAsync(Facilitator, new SessionName("Workshop"), "correct");

        result.ShouldBeOfType<SessionCreationResult.CreationUnavailable>();
        repository.Created.ShouldBeEmpty();
    }

    private sealed class FakePassphrase(string expected) : IFacilitatorPassphrase
    {
        public bool Matches(string candidate)
        {
            return string.Equals(candidate, expected, StringComparison.Ordinal);
        }
    }
}

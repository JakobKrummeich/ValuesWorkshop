using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

internal static class TestSessions
{
    internal static readonly FacilitatorSubject Facilitator = new("facilitator-subject");
    internal static readonly SessionName Name = new("Test workshop");

    internal static Session Open(SessionIdentity identity)
    {
        return Open(identity, Facilitator);
    }

    internal static Session Open(SessionIdentity identity, FacilitatorSubject facilitator)
    {
        return Session.Open(identity, facilitator, Name);
    }
}

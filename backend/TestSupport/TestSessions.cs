using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestSessions
{
    public static readonly FacilitatorSubject Facilitator = new("facilitator-subject");
    public static readonly SessionName Name = new("Test workshop");

    public static Session Open(SessionIdentity identity)
    {
        return Open(identity, Facilitator);
    }

    public static Session Open(SessionIdentity identity, FacilitatorSubject facilitator)
    {
        return Session.Open(identity, facilitator, Name);
    }
}

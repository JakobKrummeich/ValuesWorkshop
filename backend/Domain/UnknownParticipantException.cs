namespace ValuesWorkshop.Domain;

public sealed class UnknownParticipantException : Exception
{
    public UnknownParticipantException(string message)
        : base(message) { }

    public UnknownParticipantException()
        : base("The referenced participant is not on the roster.") { }

    public UnknownParticipantException(string message, Exception innerException)
        : base(message, innerException) { }
}

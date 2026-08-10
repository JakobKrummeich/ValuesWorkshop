namespace ValuesWorkshop.Domain;

public sealed class MalformedPayloadException : Exception
{
    public MalformedPayloadException(string message)
        : base(message) { }

    public MalformedPayloadException()
        : base("The payload of the command is malformed.") { }

    public MalformedPayloadException(string message, Exception innerException)
        : base(message, innerException) { }
}

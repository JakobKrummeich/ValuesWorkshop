namespace ValuesWorkshop.Domain;

public sealed class InvariantViolationException : Exception
{
    public InvariantViolationException(string message)
        : base(message) { }

    public InvariantViolationException()
        : base("A domain invariant refused the command.") { }

    public InvariantViolationException(string message, Exception innerException)
        : base(message, innerException) { }
}

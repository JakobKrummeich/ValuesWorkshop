namespace ValuesWorkshop.Domain;

public sealed class WrongPhaseException : Exception
{
    public WrongPhaseException(string message)
        : base(message) { }

    public WrongPhaseException()
        : base("The command does not exist in the current phase or sub-state.") { }

    public WrongPhaseException(string message, Exception innerException)
        : base(message, innerException) { }
}

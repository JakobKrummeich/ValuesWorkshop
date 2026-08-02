namespace ValuesWorkshop.Domain;

public sealed class NotAuthorizedException : Exception
{
    public NotAuthorizedException(string message)
        : base(message) { }

    public NotAuthorizedException()
        : base("The caller is not allowed to issue this command.") { }

    public NotAuthorizedException(string message, Exception innerException)
        : base(message, innerException) { }
}

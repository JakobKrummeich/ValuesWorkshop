namespace ValuesWorkshop.Application.Intents;

public sealed record IntentResult(bool IsAccepted, IntentRejectionCode? Code, string? Detail)
{
    public static IntentResult Accepted()
    {
        return new IntentResult(true, null, null);
    }

    public static IntentResult Rejected(IntentRejectionCode code, string detail)
    {
        return new IntentResult(false, code, detail);
    }
}

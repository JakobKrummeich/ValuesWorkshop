namespace ValuesWorkshop.Domain;

/// <summary>Current question, reveal state, answer tallies. Enforces I5.</summary>
public sealed class QuizProgress
{
    /// <summary>Zero-based index of the posed question; null before the first is posed.</summary>
    public int? CurrentQuestion { get; private set; }
}

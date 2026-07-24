namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class QuizStateEntity
{
    public string SessionIdentity { get; set; } = "";
    public int? CurrentQuestionIndex { get; set; }
    public bool IsRevealed { get; set; }
    public bool IsLearningTextShown { get; set; }

    public SessionEntity Session { get; set; } = null!;
}

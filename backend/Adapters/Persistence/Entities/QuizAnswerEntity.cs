namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class QuizAnswerEntity
{
    public string SessionIdentity { get; set; } = "";
    public int QuestionIndex { get; set; }
    public string ParticipantId { get; set; } = "";
    public int AnswerIndex { get; set; }

    public SessionEntity Session { get; set; } = null!;
}

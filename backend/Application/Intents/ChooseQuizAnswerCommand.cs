using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record ChooseQuizAnswerCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    int QuestionIndex,
    int AnswerIndex
);

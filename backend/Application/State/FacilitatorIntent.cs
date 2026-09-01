using System.Text.Json.Serialization;

namespace ValuesWorkshop.Application.State;

[JsonConverter(typeof(JsonStringEnumConverter<FacilitatorIntent>))]
public enum FacilitatorIntent
{
    AdvancePhase,
    RevealAnswer,
    ShowLearningText,
    PoseNextQuestion,
    ReassignScribe,
    GoToNextValue,
    CorrectActionWording,
    CloseVoting,
    StartTiebreakRound,
    RevealNextValue,
}

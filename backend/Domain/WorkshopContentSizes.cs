namespace ValuesWorkshop.Domain;

public sealed record WorkshopContentSizes(int QuizQuestionCount, int PresentedValueCount)
{
    public static WorkshopContentSizes Placeholder { get; } =
        new(QuizQuestionCount: 5, PresentedValueCount: 10);
}

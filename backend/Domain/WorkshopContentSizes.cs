namespace ValuesWorkshop.Domain;

public sealed record WorkshopContentSizes(int? QuizQuestionCount, int? PresentedValueCount)
{
    public static WorkshopContentSizes NotConfigured { get; } =
        new(QuizQuestionCount: null, PresentedValueCount: null);
}

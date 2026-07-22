namespace ValuesWorkshop.Domain.Tests;

public class WorkshopStateTests
{
    [Fact]
    public void Initial_phase_is_Join()
    {
        new WorkshopState().CurrentPhase.ShouldBe(Phase.Join);
    }

    [Fact]
    public void The_nine_phases_are_ordered_1_to_9()
    {
        Phase[] expected =
        [
            Phase.Join,
            Phase.Quiz,
            Phase.ValueSelection,
            Phase.SelectionResults,
            Phase.GroupFormation,
            Phase.GroupWork,
            Phase.ValuePresentation,
            Phase.FinalVoting,
            Phase.FinalPresentation,
        ];

        Enum.GetValues<Phase>().ShouldBe(expected);
        ((int)Phase.Join).ShouldBe(1);
        ((int)Phase.FinalPresentation).ShouldBe(9);
    }
}

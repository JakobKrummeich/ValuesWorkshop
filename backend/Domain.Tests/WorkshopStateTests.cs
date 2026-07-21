namespace ValuesWorkshop.Domain.Tests;

public class WorkshopStateTests
{
    [Fact]
    public void Initial_phase_is_Join()
    {
        Assert.Equal(Phase.Join, new WorkshopState().CurrentPhase);
    }

    [Fact]
    public void The_nine_phases_are_ordered_1_to_9()
    {
        Phase[] expected =
        [
            Phase.Join, Phase.Quiz, Phase.ValueSelection, Phase.SelectionResults,
            Phase.GroupFormation, Phase.GroupWork, Phase.ValuePresentation,
            Phase.FinalVoting, Phase.FinalPresentation,
        ];

        Assert.Equal(expected, Enum.GetValues<Phase>());
        Assert.Equal(1, (int)Phase.Join);
        Assert.Equal(9, (int)Phase.FinalPresentation);
    }
}

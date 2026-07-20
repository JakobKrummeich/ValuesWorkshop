namespace ValuesWorkshop.Domain;

/// <summary>The nine workshop phases; forward-only, in this fixed order (I1).</summary>
public enum Phase
{
    Join = 1,
    Quiz = 2,
    ValueSelection = 3,
    SelectionResults = 4,
    GroupFormation = 5,
    GroupWork = 6,
    ValuePresentation = 7,
    FinalVoting = 8,
    FinalPresentation = 9,
}

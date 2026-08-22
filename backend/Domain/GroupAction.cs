namespace ValuesWorkshop.Domain;

public sealed record GroupAction(ActionId ActionId, ValueId ValueId, GroupActionText Text);

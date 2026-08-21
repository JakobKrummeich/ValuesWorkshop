namespace ValuesWorkshop.Domain;

public sealed class Group
{
    private const int MaximumActionsPerValue = 5;

    private readonly List<ParticipantId> _members;
    private readonly List<GroupAction> _actions = [];

    public string Name { get; }
    public IReadOnlyList<ParticipantId> Members => _members;
    public IReadOnlyList<ValueId> AssignedValues { get; }
    public IReadOnlyList<GroupAction> Actions => _actions;
    public ParticipantId? Scribe { get; private set; }
    public bool IsSubmitted { get; private set; }

    public Group(
        string name,
        IReadOnlyList<ParticipantId> members,
        IReadOnlyList<ValueId> assignedValues
    )
    {
        Name = name;
        _members = [.. members];
        AssignedValues = assignedValues;
    }

    internal void AddMember(ParticipantId participantId)
    {
        _members.Add(participantId);
    }

    internal void AppointScribe(IRandomness randomness)
    {
        if (Scribe is not null)
        {
            return;
        }

        Scribe = _members[randomness.NextIndex(_members.Count)];
    }

    internal void ReassignScribe(ParticipantId newScribe)
    {
        if (!_members.Contains(newScribe))
        {
            throw new InvariantViolationException(
                "The scribe role can only be handed to a member of the group."
            );
        }

        Scribe = newScribe;
    }

    internal void AddAction(
        ParticipantId caller,
        ActionId actionId,
        ValueId valueId,
        GroupActionText text
    )
    {
        RequireScribe(caller);
        RequireEditable();

        if (!AssignedValues.Contains(valueId))
        {
            throw new InvariantViolationException(
                "Actions exist only for the values assigned to the group."
            );
        }

        if (_actions.Any(action => action.ActionId == actionId))
        {
            throw new InvariantViolationException(
                "An action with this id already exists in the group."
            );
        }

        if (_actions.Count(action => action.ValueId == valueId) == MaximumActionsPerValue)
        {
            throw new InvariantViolationException(
                $"A value holds at most {MaximumActionsPerValue} actions."
            );
        }

        _actions.Add(new GroupAction(actionId, valueId, text));
    }

    internal void EditAction(ParticipantId caller, ActionId actionId, GroupActionText text)
    {
        RequireScribe(caller);
        RequireEditable();

        var index = IndexOf(actionId);

        _actions[index] = _actions[index] with { Text = text };
    }

    internal void RemoveAction(ParticipantId caller, ActionId actionId)
    {
        RequireScribe(caller);
        RequireEditable();

        _actions.RemoveAt(IndexOf(actionId));
    }

    internal void Submit(ParticipantId caller)
    {
        RequireScribe(caller);

        if (IsSubmitted)
        {
            return;
        }

        if (!AssignedValues.All(valueId => _actions.Any(action => action.ValueId == valueId)))
        {
            throw new InvariantViolationException(
                "Submitting needs at least one action for every assigned value."
            );
        }

        IsSubmitted = true;
    }

    internal void Reopen(ParticipantId caller)
    {
        RequireScribe(caller);

        IsSubmitted = false;
    }

    private void RequireScribe(ParticipantId caller)
    {
        if (Scribe != caller)
        {
            throw new NotAuthorizedException(
                "Only the scribe of the group may work on its result."
            );
        }
    }

    private void RequireEditable()
    {
        if (IsSubmitted)
        {
            throw new InvariantViolationException(
                "A submitted result cannot be changed until it is reopened."
            );
        }
    }

    private int IndexOf(ActionId actionId)
    {
        var index = _actions.FindIndex(action => action.ActionId == actionId);

        return index >= 0
            ? index
            : throw new InvariantViolationException("The group holds no action with this id.");
    }

    internal static Group Restore(
        string name,
        IReadOnlyList<ParticipantId> members,
        IReadOnlyList<ValueId> assignedValues,
        ParticipantId? scribe,
        bool isSubmitted,
        IReadOnlyList<GroupAction> actions
    )
    {
        var group = new Group(name, members, assignedValues)
        {
            Scribe = scribe,
            IsSubmitted = isSubmitted,
        };
        group._actions.AddRange(actions);

        return group;
    }
}

namespace ValuesWorkshop.Application.Ports.Driven;

public interface IValuesCatalog
{
    IReadOnlyList<WorkshopValue> Values { get; }
}

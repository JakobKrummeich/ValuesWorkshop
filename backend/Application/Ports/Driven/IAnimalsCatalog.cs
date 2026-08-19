namespace ValuesWorkshop.Application.Ports.Driven;

public interface IAnimalsCatalog
{
    IReadOnlyList<WorkshopAnimal> Animals { get; }
}

namespace ValuesWorkshop.Domain;

public interface IRandomness
{
    int NextIndex(int exclusiveUpperBound);
}

namespace ValuesWorkshop.Application.Ports.Driven;

public interface IFacilitatorPassphrase
{
    bool Matches(string candidate);
}

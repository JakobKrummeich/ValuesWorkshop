using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("ValuesWorkshop.Adapters.Persistence")]
[assembly: InternalsVisibleTo("ValuesWorkshop.Adapters.Tests")]
[assembly: InternalsVisibleTo("ValuesWorkshop.Application.Tests")]
[assembly: InternalsVisibleTo("ValuesWorkshop.Domain.Tests")]
[assembly: InternalsVisibleTo("ValuesWorkshop.Host.Tests")]
[assembly: InternalsVisibleTo("ValuesWorkshop.TestSupport")]

namespace ValuesWorkshop.Domain;

public static class AssemblyMarker;

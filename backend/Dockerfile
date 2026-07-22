FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY Directory.Build.props .editorconfig ./
COPY Analyzers/ValuesWorkshop.Analyzers.csproj Analyzers/
COPY Domain/ValuesWorkshop.Domain.csproj Domain/
COPY Application/ValuesWorkshop.Application.csproj Application/
COPY Adapters/ValuesWorkshop.Adapters.csproj Adapters/
COPY Host/ValuesWorkshop.Host.csproj Host/
COPY ValuesWorkshop.sln .
RUN dotnet restore ValuesWorkshop.sln

COPY . .
RUN dotnet publish Host/ValuesWorkshop.Host.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
ENV DATA_DIR=/data
EXPOSE 8080

ENTRYPOINT ["dotnet", "ValuesWorkshop.Host.dll"]

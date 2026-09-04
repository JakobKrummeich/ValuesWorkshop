using Microsoft.EntityFrameworkCore;

namespace ValuesWorkshop.Adapters.Tests;

internal sealed class ShelfEntity
{
    public string Identity { get; set; } = "";

    public List<BookEntity> Books { get; set; } = [];
}

internal sealed class BookEntity
{
    public string Identity { get; set; } = "";
    public string Title { get; set; } = "";
    public string? ShelfIdentity { get; set; }

    public ShelfEntity? Shelf { get; set; }
    public BookCoverEntity? Cover { get; set; }
}

internal sealed class BookCoverEntity
{
    public string BookIdentity { get; set; } = "";

    public BookEntity Book { get; set; } = null!;
}

internal sealed class CatalogueDbContext(DbContextOptions<CatalogueDbContext> options)
    : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShelfEntity>(shelf =>
        {
            shelf.ToTable("shelves");
            shelf.HasKey(entity => entity.Identity);
            shelf.Property(entity => entity.Identity).HasColumnName("identity");
        });

        modelBuilder.Entity<BookEntity>(book =>
        {
            book.ToTable("books");
            book.HasKey(entity => entity.Identity);
            book.Property(entity => entity.Identity).HasColumnName("identity");
            book.Property(entity => entity.Title).HasColumnName("title");
            book.Property(entity => entity.ShelfIdentity).HasColumnName("shelf_identity");
            book.HasIndex(entity => entity.Title).IsUnique();
            book.HasOne(entity => entity.Shelf)
                .WithMany(shelf => shelf.Books)
                .HasForeignKey(entity => entity.ShelfIdentity);
        });

        modelBuilder.Entity<BookCoverEntity>(cover =>
        {
            cover.ToTable("book_covers");
            cover.HasKey(entity => entity.BookIdentity);
            cover.Property(entity => entity.BookIdentity).HasColumnName("book_identity");
            cover
                .HasOne(entity => entity.Book)
                .WithOne(book => book.Cover)
                .HasForeignKey<BookCoverEntity>(entity => entity.BookIdentity);
        });
    }
}

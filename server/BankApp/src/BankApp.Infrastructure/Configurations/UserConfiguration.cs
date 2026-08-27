using BankApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BankApp.Infrastructure.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
               .IsRequired()
               .HasMaxLength(256);

        builder.HasIndex(u => u.Email)
               .IsUnique();  // No duplicate emails

        builder.Property(u => u.PasswordHash)
               .IsRequired();

        builder.Property(u => u.FirstName)
               .HasMaxLength(100);

        builder.Property(u => u.LastName)
               .HasMaxLength(100);

        builder.HasMany(u => u.Accounts)
               .WithOne()
               .HasForeignKey(a => a.UserId);

        builder.Navigation(u => u.Accounts)
               .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
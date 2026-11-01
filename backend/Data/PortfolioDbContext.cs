using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PortfolioApi.Model;

namespace PortfolioApi.Data
{
	public class PortfolioDbContext : DbContext
	{
		public PortfolioDbContext(DbContextOptions<PortfolioDbContext> options) : base(options) { }

		public DbSet<Project> Projects { get; set; }
		public DbSet<Skill> Skills { get; set; }
		public DbSet<ContactMessage> Messages { get; set; }

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			// Store List<string> Tags as a JSON string in one column
			var tagsComparer = new ValueComparer<List<string>>(
				(a, b) => a != null && b != null && a.SequenceEqual(b),
				v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
				v => v.ToList());

			modelBuilder.Entity<Project>()
				.Property(p => p.Tags)
				.HasConversion(
					v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
					v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
				.Metadata.SetValueComparer(tagsComparer);

			modelBuilder.Entity<ContactMessage>().HasIndex(m => m.CreatedAt);
		}
	}
}
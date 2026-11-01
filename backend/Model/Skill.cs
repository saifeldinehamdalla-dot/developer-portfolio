using System.ComponentModel.DataAnnotations;

namespace PortfolioApi.Model
{
	public class Skill
	{
		public int Id { get; set; }

		[Required, MaxLength(100)]
		public string Name { get; set; } = string.Empty;

		[MaxLength(50)]
		public string Level { get; set; } = string.Empty;

		public int? Percentage { get; set; }

		[MaxLength(50)]
		public string? Category { get; set; }

		public int Order { get; set; }
	}
}
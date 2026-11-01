using System.ComponentModel.DataAnnotations;

namespace PortfolioApi.Model
{
	public class Project
	{
		public int Id { get; set; }

		[Required, MaxLength(200)]
		public string Title { get; set; } = string.Empty;

		[Required, MaxLength(2000)]
		public string Description { get; set; } = string.Empty;

		[MaxLength(500)]
		public string GitHubUrl { get; set; } = string.Empty;

		public string ImageUrl { get; set; } = string.Empty;

		[MaxLength(500)]
		public string? LiveUrl { get; set; }

		public List<string> Tags { get; set; } = new();
		public bool Featured { get; set; }
		public int Order { get; set; }
	}
}
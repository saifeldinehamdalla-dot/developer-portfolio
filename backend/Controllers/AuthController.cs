using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace PortfolioApi.Controllers
{
	public record LoginDto(string Username, string Password);

	[ApiController]
	[Route("api/[controller]")]
	public class AuthController : ControllerBase
	{
		private readonly IConfiguration _config;
		public AuthController(IConfiguration config) => _config = config;

		[HttpPost("login")]
		public IActionResult Login(LoginDto dto)
		{
			var user = _config["Admin:Username"];
			var pass = _config["Admin:Password"];

			if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass) ||
				dto.Username != user || dto.Password != pass)
			{
				return Unauthorized(new { message = "Invalid username or password" });
			}

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
			var token = new JwtSecurityToken(
				issuer: _config["Jwt:Issuer"],
				audience: _config["Jwt:Audience"],
				claims: new[] { new Claim(ClaimTypes.Name, dto.Username) },
				expires: DateTime.UtcNow.AddHours(8),
				signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

			return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
		}
	}
}
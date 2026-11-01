using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Model;

namespace PortfolioApi.Controllers
{
	public record SendMessageDto(string Name, string Email, string Message);

	[ApiController]
	[Route("api/[controller]")]
	public class MessagesController : ControllerBase
	{
		private readonly PortfolioDbContext _context;
		public MessagesController(PortfolioDbContext context) => _context = context;

		// Public: contact form
		[HttpPost]
		public async Task<ActionResult<ContactMessage>> Send(SendMessageDto dto)
		{
			var msg = new ContactMessage
			{
				Name = dto.Name?.Trim() ?? "",
				Email = dto.Email?.Trim() ?? "",
				Message = dto.Message?.Trim() ?? "",
				CreatedAt = DateTime.UtcNow,
				IsRead = false
			};

			if (!TryValidateModel(msg)) return ValidationProblem(ModelState);

			_context.Messages.Add(msg);
			await _context.SaveChangesAsync();
			return Ok(msg);
		}

		[Authorize]
		[HttpGet]
		public async Task<ActionResult<IEnumerable<ContactMessage>>> GetAll()
			=> await _context.Messages.OrderByDescending(m => m.CreatedAt).ToListAsync();

		[Authorize]
		[HttpGet("unread-count")]
		public async Task<IActionResult> UnreadCount()
			=> Ok(new { count = await _context.Messages.CountAsync(m => !m.IsRead) });

		[Authorize]
		[HttpPut("{id}/read")]
		public async Task<IActionResult> MarkRead(int id, [FromQuery] bool isRead = true)
		{
			var msg = await _context.Messages.FindAsync(id);
			if (msg == null) return NotFound();
			msg.IsRead = isRead;
			await _context.SaveChangesAsync();
			return NoContent();
		}

		[Authorize]
		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			var msg = await _context.Messages.FindAsync(id);
			if (msg == null) return NotFound();
			_context.Messages.Remove(msg);
			await _context.SaveChangesAsync();
			return Ok(new { message = "Deleted." });
		}
	}
}
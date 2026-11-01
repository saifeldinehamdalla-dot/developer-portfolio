using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Model;

namespace PortfolioApi.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class SkillsController : ControllerBase
	{
		private readonly PortfolioDbContext _context;
		public SkillsController(PortfolioDbContext context)
		{
			_context = context;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<Skill>>> GetSkills()
		{
			return await _context.Skills.ToListAsync();
		}

		[Authorize]
		[HttpPost]
		public async Task<ActionResult<Skill>> AddSkill(Skill skill)
		{
			skill.Id = 0; // لضمان توليد الـ ID من الداتابيز تلقائياً
			_context.Skills.Add(skill);
			await _context.SaveChangesAsync();
			return Ok(skill);
		}

		[Authorize]
		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateSkill(int id, Skill skill)
		{
			if (id != skill.Id)
			{
				return BadRequest("Skill ID mismatch");
			}

			_context.Entry(skill).State = EntityState.Modified;

			try
			{
				await _context.SaveChangesAsync();
			}
			catch (DbUpdateConcurrencyException)
			{
				if (!SkillExists(id))
				{
					return NotFound($"Skill with ID {id} not found.");
				}
				else
				{
					throw;
				}
			}

			return NoContent();
		}

		[Authorize]
		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteSkill(int id)
		{
			var skill = await _context.Skills.FindAsync(id);

			if (skill == null)
			{
				return NotFound($"Skill with ID {id} not found.");
			}

			_context.Skills.Remove(skill);
			await _context.SaveChangesAsync();

			return Ok(new { message = $"Skill with ID {id} deleted successfully." });
		}

		private bool SkillExists(int id)
		{
			return _context.Skills.Any(e => e.Id == id);
		}
	}
}
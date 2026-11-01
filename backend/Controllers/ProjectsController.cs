using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Model;

namespace PortfolioApi.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ProjectsController : ControllerBase
	{
		private readonly PortfolioDbContext _context;

		public ProjectsController(PortfolioDbContext context)
		{
			_context = context;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
		{
			return await _context.Projects.ToListAsync();
		}

		[Authorize]
		[HttpPost]
		public async Task<ActionResult<Project>> AddProject(Project project)
		{
			project.Id = 0; // لضمان توليد الـ ID من الداتابيز تلقائياً
			_context.Projects.Add(project);
			await _context.SaveChangesAsync();
			return Ok(project);
		}

		[Authorize]
		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateProject(int id, Project project)
		{
			if (id != project.Id)
			{
				return BadRequest("Project ID mismatch");
			}

			_context.Entry(project).State = EntityState.Modified;

			try
			{
				await _context.SaveChangesAsync();
			}
			catch (DbUpdateConcurrencyException)
			{
				if (!ProjectExists(id))
				{
					return NotFound($"Project with ID {id} not found.");
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
		public async Task<IActionResult> DeleteProject(int id)
		{
			var dbProject = await _context.Projects.FindAsync(id);
			if (dbProject == null)
			{
				return NotFound($"Project with ID {id} not found.");
			}

			_context.Projects.Remove(dbProject);
			await _context.SaveChangesAsync();

			return Ok(new { message = $"Project with ID {id} deleted successfully." });
		}

		private bool ProjectExists(int id)
		{
			return _context.Projects.Any(e => e.Id == id);
		}
	}
}
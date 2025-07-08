using Application.DTOs;
using Application.Interfaces.Content;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EarningsController : ControllerBase
    {
        private readonly IEarningsService _earningsService;

        public EarningsController(IEarningsService earningsService)
        {
            _earningsService = earningsService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEarningsById(string id)
        {
            try
            {
                var earnings = await _earningsService.GetEarningsByIdAsync(id);
                if (earnings == null)
                    return NotFound("Earnings record not found");

                return Ok(earnings);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }

        [HttpGet("caregiver/{caregiverId}")]
        public async Task<IActionResult> GetEarningsByCaregiverId(string caregiverId)
        {
            try
            {
                var earnings = await _earningsService.GetEarningsByCaregiverIdAsync(caregiverId);
                if (earnings == null)
                    return NotFound("No earnings record found for this caregiver");

                return Ok(earnings);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> CreateEarnings([FromBody] CreateEarningsRequest request)
        {
            try
            {
                // Check if earnings already exist for this caregiver
                bool exists = await _earningsService.DoesEarningsExistForCaregiverAsync(request.CaregiverId);
                if (exists)
                    return BadRequest("Earnings record already exists for this caregiver");

                var earnings = await _earningsService.CreateEarningsAsync(request);
                return CreatedAtAction(nameof(GetEarningsById), new { id = earnings.Id }, earnings);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UpdateEarnings(string id, [FromBody] UpdateEarningsRequest request)
        {
            try
            {
                var earnings = await _earningsService.UpdateEarningsAsync(id, request);
                if (earnings == null)
                    return NotFound("Earnings record not found");

                return Ok(earnings);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }
    }
}

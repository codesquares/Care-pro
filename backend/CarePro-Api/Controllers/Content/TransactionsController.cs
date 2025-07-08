using Application.DTOs;
using Application.Interfaces.Content;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CarePro_Api.Controllers.Content
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionHistoryService _transactionHistoryService;

        public TransactionsController(ITransactionHistoryService transactionHistoryService)
        {
            _transactionHistoryService = transactionHistoryService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionById(string id)
        {
            try
            {
                var transaction = await _transactionHistoryService.GetTransactionByIdAsync(id);
                if (transaction == null)
                    return NotFound("Transaction not found");

                // Check if the user is requesting their own data or is an admin
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirstValue(ClaimTypes.Role);

                if (userId != transaction.CaregiverId && userRole != "Admin" && userRole != "SuperAdmin")
                    return Forbid();

                return Ok(transaction);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }

        [HttpGet("caregiver/{caregiverId}")]
        public async Task<IActionResult> GetTransactionsByCaregiverId(string caregiverId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Check if the user is requesting their own data or is an admin
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirstValue(ClaimTypes.Role);

                if (userId != caregiverId && userRole != "Admin" && userRole != "SuperAdmin")
                    return Forbid();

                var transactions = await _transactionHistoryService.GetTransactionsByCaregiverIdAsync(caregiverId, page, pageSize);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetTransactionsWithFilters([FromQuery] TransactionHistoryQueryParams queryParams)
        {
            try
            {
                var transactions = await _transactionHistoryService.GetTransactionsWithFiltersAsync(queryParams);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
        {
            try
            {
                var transaction = await _transactionHistoryService.CreateTransactionAsync(request);
                return CreatedAtAction(nameof(GetTransactionById), new { id = transaction.Id }, transaction);
            }
            catch (Exception ex)
            {
                return BadRequest(new { ErrorMessage = ex.Message });
            }
        }
    }
}

using BankApp.Application.Queries.GetTransactions;
using BankApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BankApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TransactionController : ControllerBase
{
    private readonly IMediator _mediator;

    public TransactionController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetTransactions([FromQuery] string type = "Checking")
    {
        if (!Enum.TryParse<AccountType>(type, true, out var accountType))
            return BadRequest("Invalid account type");

        var transactions = await _mediator.Send(new GetTransactionsQuery(GetUserId(), accountType));
        return Ok(transactions);
    }
}
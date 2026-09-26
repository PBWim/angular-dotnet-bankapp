using Azure.Core;
using BankApp.API.Requests;
using BankApp.Application.Commands.Deposit;
using BankApp.Application.Commands.Withdraw;
using BankApp.Application.Queries.GetBalance;
using BankApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BankApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IMediator _mediator;

    public AccountController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance([FromQuery] string type = "Checking")
    {
        if (!Enum.TryParse<AccountType>(type, true, out var accountType))
            return BadRequest("Invalid account type");

        var balance = await _mediator.Send(new GetBalanceQuery(GetUserId(), accountType));
        return Ok(new { balance });
    }

    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest depositRequest)
    {
        try
        {
            if (!Enum.TryParse<AccountType>(depositRequest.AccountType, true, out var accountType))
                return BadRequest(new { error = "Invalid account type" });

            var newBalance = await _mediator.Send(new DepositCommand(GetUserId(), accountType, depositRequest.Amount, depositRequest.Description));
            return Ok(new { balance = newBalance });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequest withdrawRequest)
    {
        try
        {
            if (!Enum.TryParse<AccountType>(withdrawRequest.AccountType, true, out var accountType))
                return BadRequest(new { error = "Invalid account type" });
            
            var newBalance = await _mediator.Send(new WithdrawCommand(GetUserId(), accountType, withdrawRequest.Amount, withdrawRequest.Description));
            return Ok(new { balance = newBalance });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
using BankApp.Application.Commands.Deposit;
using BankApp.Application.Commands.Withdraw;
using BankApp.Application.Queries.GetBalance;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IMediator _mediator;

    public AccountController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var balance = await _mediator.Send(new GetBalanceQuery());
        return Ok(new { balance });
    }

    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositCommand command)
    {
        try
        {
            var newBalance = await _mediator.Send(command);
            return Ok(new { balance = newBalance });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawCommand command)
    {
        try
        {
            var newBalance = await _mediator.Send(command);
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
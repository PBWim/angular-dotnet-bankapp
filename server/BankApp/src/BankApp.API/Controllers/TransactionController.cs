using BankApp.Application.Queries.GetTransactions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionController : ControllerBase
{
    private readonly IMediator _mediator;

    public TransactionController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        var transactions = await _mediator.Send(new GetTransactionsQuery());
        return Ok(transactions);
    }
}
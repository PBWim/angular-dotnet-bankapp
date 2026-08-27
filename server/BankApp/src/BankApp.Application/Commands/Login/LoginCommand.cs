using BankApp.Application.DTOs;
using MediatR;

namespace BankApp.Application.Commands.Login;

// LoginCommand — technically a query (doesn't change state), but we put it in Commands because it's an "action" the user takes, and it returns a token just like Register
public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResponseDto>;
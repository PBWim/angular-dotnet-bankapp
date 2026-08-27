using BankApp.Application.DTOs;
using MediatR;

namespace BankApp.Application.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName
) : IRequest<AuthResponseDto>;
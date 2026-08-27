namespace BankApp.Application.DTOs;

public record AuthResponseDto(
    string Token,
    string Email,
    string FirstName
);
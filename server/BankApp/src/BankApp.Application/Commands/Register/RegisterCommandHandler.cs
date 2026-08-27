using BankApp.Application.DTOs;
using BankApp.Application.Interfaces;
using BankApp.Domain.Entities;
using MediatR;

namespace BankApp.Application.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;

    public RegisterCommandHandler(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if email already exists
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
            throw new InvalidOperationException("Email is already registered.");

        // Create user (domain entity handles validation + password hashing)
        var user = new User(request.Email, request.Password, request.FirstName, request.LastName);
        await _userRepository.AddAsync(user);

        // Generate JWT token
        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto(token, user.Email, user.FirstName);
    }
}
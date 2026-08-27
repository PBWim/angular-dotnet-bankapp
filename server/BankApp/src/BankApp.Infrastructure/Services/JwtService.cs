using BankApp.Application.Interfaces;
using BankApp.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BankApp.Infrastructure.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            // Claims — pieces of info embedded in the token. We store the user's ID, email, and first name.
            // The API can read these from the token on every request without hitting the database.
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.GivenName, user.FirstName)
            };

            // SymmetricSecurityKey — the secret key used to sign the token. Same key signs and verifies.
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));

            // SigningCredentials — HMAC-SHA256 algorithm to sign the token.
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // JwtSecurityToken — builds the token with issuer, audience, claims, and expiry (24 hours).
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            // WriteToken — serializes it to the eyJhbGci... string format.
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

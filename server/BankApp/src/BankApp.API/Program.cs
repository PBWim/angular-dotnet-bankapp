using BankApp.Application.Interfaces;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using BankApp.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.

        builder.Services.AddControllers();

        // Add DbContext
        builder.Services.AddDbContext<BankDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        // Add MediatR
        builder.Services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(BankApp.Application.Commands.Deposit.DepositCommand).Assembly));

        // Add Repository
        builder.Services.AddScoped<IAccountRepository, AccountRepository>();

        // Add CORS for Angular
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAngular", policy =>
            {
                policy.WithOrigins("http://localhost:4200")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        app.UseAuthorization();

        app.UseCors("AllowAngular");

        app.MapControllers();

        // Auto-apply migrations on startup
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<BankDbContext>();
            db.Database.Migrate();

            if (!db.Accounts.Any())
            {
                db.Accounts.Add(new Account());
                db.SaveChanges();
            }
        }

        app.Run();
    }
}
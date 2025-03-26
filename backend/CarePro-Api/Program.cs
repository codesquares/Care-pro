using Application.Interfaces;
using Application.Interfaces.Authentication;
using Application.Interfaces.Content;
using Application.Interfaces.Email;
using Domain.Settings;
using Infrastructure.Content.Data;
using Infrastructure.Content.Services;
using Infrastructure.Content.Services.Authentication;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddDbContext<CareProDbContext>(options =>
{
     //options.UseMongoDB("mongodb://localhost:27017", "Care-Pro_DB");
    //////options.UseMongoDB("mongodb+srv://codesquareltd:fqWU47mw0Coyfp5n@cluster0.c9g7a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", "Care-pro_db");
   options.UseMongoDB("mongodb+srv://codesquareltd:fqWU47mw0Coyfp5n@cluster0.c9g7a.mongodb.net/Care-pro_db?retryWrites=true&w=majority", "Care-pro_db");
});

/// Configure JWT

builder.Services.Configure<JWT>(builder.Configuration.GetSection("JWT"));



builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(2); // Set token lifespan here
});







/// Setting up Lifespan for our Services
/// Dependency injection, to enable us use the repository services in controller

//builder.Services.AddScoped<IAuthResponseService, AuthResponseService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICareGiverService, CareGiverService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IGigServices, GigServices>();
builder.Services.AddScoped<IClientOrderService, ClientOrderService>();

builder.Services.AddScoped<ITokenHandler, Infrastructure.Content.Services.Authentication.TokenHandler>();

///Flutterwave dependency injection
builder.Services.AddSingleton<FlutterwaveService>();



/// Setting up our EmailTemplate Service
builder.Services.Configure<MailSettings>(builder.Configuration.GetSection("MailSettings"));


//// Configure JWT

//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    options.TokenValidationParameters = new TokenValidationParameters
//    {
//        ValidateIssuer = true,
//        ValidateAudience = true,
//        ValidateLifetime = true,
//        ValidateIssuerSigningKey = true,
//        ValidIssuer = builder.Configuration["Jwt:Issuer"],
//        ValidAudience = builder.Configuration["Jwt:Audience"],
//        IssuerSigningKey = new SymmetricSecurityKey(
//            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
//    });

/// Implementing Authentication for chat users (To ensure only Authorized Users Chat)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/chathub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

    });


// Add MongoDB client and register ChatRepository
builder.Services.AddSingleton<IMongoClient>(sp =>
    new MongoClient(builder.Configuration.GetConnectionString("MongoDbConnection")));

builder.Services.AddScoped(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    var database = client.GetDatabase("Care-pro_db"); // Replace with your actual DB name
    return database;
});

// Register ChatRepository
builder.Services.AddScoped<ChatRepository>();




//Handle CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", builder =>
    {
        builder.WithOrigins("https://localhost:5173", "http://localhost:5173", "https://localhost:5174", "http://localhost:5174")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});




/// Add services to the container. (MIDDLEWARES)
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

/// Add Swagger
builder.Services.AddSwaggerGen(options =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "JWT Authentication",
        Description = "Enter a valid JWT bearer token",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    options.AddSecurityDefinition(securityScheme.Reference.Id, securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {securityScheme, new string[] {} }
    });
});

/// Configure SignalR
builder.Services.AddSignalR();


//builder.Services.AddSwaggerGen();

var app = builder.Build();

/// Configure SignalR Continues
app.UseRouting();
app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<ChatHub>("/chathub");
});





// Configure the HTTP request pipeline.

app.UseSwagger();
app.UseSwaggerUI();



app.UseHttpsRedirection();

app.UseCors("default");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();


app.Run();

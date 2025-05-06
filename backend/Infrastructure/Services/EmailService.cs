using Application.Interfaces.Email;
using Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
//using System.Net.Mail;
using MailKit.Net.Smtp;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using MimeKit;
using Infrastructure.Content.Data;
using static Org.BouncyCastle.Math.EC.ECCurve;
using Microsoft.EntityFrameworkCore;
using Application.Interfaces.Authentication;

namespace Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly string smtpServer = "smtp.gmail.com";
        private readonly int smtpPort = 587;
        private readonly string fromEmail = "jamesoluwatosinfadeyi@gmail.com"; // your gmail
        private readonly string fromName = "CarePro Support";
        private readonly string appPassword = "flvm mvmo avsv kqvr"; // NOT your Gmail password!
        private readonly CareProDbContext careProDbContext;
        //private readonly IEmailService emailService;
        private readonly ITokenHandler tokenHandler;

        public EmailService(CareProDbContext careProDbContext, /*IEmailService emailService,*/ ITokenHandler tokenHandler)
        {
            this.careProDbContext = careProDbContext;
            //this.emailService = emailService;
            this.tokenHandler = tokenHandler;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = "Password Reset Request";

            //var resetLink = $"https://yourdomain.com/reset-password?token={resetToken}";
            var resetLink = $"{resetToken}";

            message.Body = new TextPart("html")
            {
                Text = $@"
                <h3>Hello,</h3>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <p><a href='{resetLink}'>Reset Password</a></p>
                <p>If you did not request this, please ignore this email.</p>
                <br />
                <p>Thanks,<br />CarePro Team</p>"
            };

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(fromEmail, appPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        //public async Task SendPasswordResetEmailWithJwtAsync(string email)
        //{
        //    var user = await careProDbContext.CareGivers.FirstOrDefaultAsync(u => u.Email == email.ToLower());

        //    if (user == null)
        //        throw new InvalidOperationException("User not found.");

        //    var token = tokenHandler.GeneratePasswordResetToken(email);
        //    var resetLink = $"https://yourfrontenddomain.com/reset-password?token={token}";


        //    await emailService.SendPasswordResetEmailAsync(email, token);
        //}














        //private System.Net.Mail.SmtpClient _smtpClient;

        //public MailSettings _mailSettings { get; }
        //public ILogger<EmailService> _logger { get; }

        //public EmailService(IOptions<MailSettings> mailSettings, ILogger<EmailService> logger)
        //{
        //    _mailSettings = mailSettings.Value;
        //    _logger = logger;
        //}






        //public async Task SendEmailAsync2(string toEmail, string subject, string body)
        //{
        //    _smtpClient = new System.Net.Mail.SmtpClient(_mailSettings.Host)
        //    {

        //        Port = 587,
        //        EnableSsl = true,
        //        UseDefaultCredentials = false,
        //        Credentials = new NetworkCredential(_mailSettings.Mail, _mailSettings.Password)
        //    };
        //    try
        //    {
        //        var message = new MailMessage(_mailSettings.Mail, toEmail, subject, body)
        //        {
        //            IsBodyHtml = true
        //        };

        //        await _smtpClient.SendMailAsync(message);
        //    }
        //    catch (Exception ex)
        //    {
        //        // Handle exceptions
        //        _logger.LogError($"Failed to send email: {ex.Message}");
        //        throw new Exception(ex.Message);
        //    }
        //}









    }
}


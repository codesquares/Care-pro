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

            //var resetLink = $"https://yourdomain.com/reset-password?token={verificationToken}";
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




        public async Task SendSignUpVerificationEmailAsync(string toEmail, string verificationToken, string firstName)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = "Confirm Your Email - CarePro";

            //var resetLink = $"https://yourdomain.com/reset-password?token={verificationToken}";
            var verificationLink = $"{verificationToken}";

            message.Body = new TextPart("html")
            {
                Text = $@"
            <h3>Hello {firstName},</h3> <br />
            <h3>Welcome to CarePro!</h3>
            <p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
            <p><a href='{verificationLink}'>Verify My Email</a></p>
            <p>This helps us ensure we have the right contact information and lets you access your account securely.</p>
            <br />
            <p>If you did not sign up for CarePro, please ignore this email.</p>
            <br />
            <p>Thanks,<br />The CarePro Team</p>"
            };

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(fromEmail, appPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }








    }
}


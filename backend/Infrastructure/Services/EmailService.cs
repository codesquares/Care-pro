using Application.Interfaces.Email;
using Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private System.Net.Mail.SmtpClient _smtpClient;

        public MailSettings _mailSettings { get; }
        public ILogger<EmailService> _logger { get; }

        public EmailService(IOptions<MailSettings> mailSettings, ILogger<EmailService> logger)
        {
            _mailSettings = mailSettings.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync2(string toEmail, string subject, string body)
        {
            _smtpClient = new System.Net.Mail.SmtpClient(_mailSettings.Host)
            {

                Port = 587,
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_mailSettings.Mail, _mailSettings.Password)
            };
            try
            {
                var message = new MailMessage(_mailSettings.Mail, toEmail, subject, body)
                {
                    IsBodyHtml = true
                };

                await _smtpClient.SendMailAsync(message);
            }
            catch (Exception ex)
            {
                // Handle exceptions
                _logger.LogError($"Failed to send email: {ex.Message}");
                throw new Exception(ex.Message);
            }
        }
    }
}

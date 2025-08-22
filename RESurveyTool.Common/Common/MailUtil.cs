using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System;
using System.IO;
using SurveyReportRE.Models.Request;
using RESurveyTool.Common.Common;
namespace SurveyReportRE.Common
{
    public static class MailUtil
    {
        public static string BodyContentHandle(string content, Dictionary<string, object> paramsObject)
        {
            foreach (var placeholder in paramsObject)
            {
                if (placeholder.Value != null)
                {
                    content = content.Replace(placeholder.Key.ToString(), placeholder.Value.ToString());
                }
                else
                {
                    content = content.Replace(placeholder.Key.ToString(), "");
                }
            }
            //if (staff != null)
            //    content = content.Replace("@@staffFullName", staff.FullName);
            content = Util.ClearMailPlaceHolder(content);
            return content;
        }

        public static string TitleContentHandle(string content, Dictionary<string, object> paramsObject)
        {
            foreach (var placeholder in paramsObject)
            {
                if (placeholder.Value != null)
                {
                    content = content.Replace(placeholder.Key.ToString(), placeholder.Value.ToString());
                }
                else
                {
                    content = content.Replace(placeholder.Key.ToString(), "");
                }
            }
            content = Util.ClearMailPlaceHolder(content);
            return content;
        }
        public static async Task SendEmail(MailConfig emailSettings, MailItem mailItem,List<string> attachments = null)
        {
            //MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(emailSettings.FromTitle, emailSettings.User));
            email.To.Add(new MailboxAddress(mailItem.ToName, mailItem.ToEmail));
            email.Subject = mailItem.Subject;
            if (!string.IsNullOrEmpty(mailItem.CC))
            {
                string[] CCs = mailItem.CC.Split(';');
                foreach (var cc in CCs)
                {
                    email.Cc.Add(new MailboxAddress("CC Recipient", cc));
                }
            }

            if (!string.IsNullOrEmpty(mailItem.BCC))
            {
                string[] BCCs = mailItem.BCC.Split(';');
                foreach (var bcc in BCCs)
                {
                    email.Bcc.Add(new MailboxAddress("BCC Recipient", bcc));
                }
            }
            var bodyBuilder = new BodyBuilder
            {
                TextBody = mailItem.TextBody,
                HtmlBody = mailItem.HtmlBody,

            };
            if (attachments != null)
                foreach (string item in attachments)
                {
                    bodyBuilder.Attachments.Add(item);
                }


            email.Body = bodyBuilder.ToMessageBody();

            using var smtp = new SmtpClient();
            try
            {
                await smtp.ConnectAsync(emailSettings.SmtpDomainName, emailSettings.TLS, SecureSocketOptions.StartTls); 
                await smtp.AuthenticateAsync(emailSettings.User, emailSettings.Password);
                await smtp.SendAsync(email);
            }
            catch (Exception ex)
            {
                Handler.ErrorException(ex, "");
            }
            finally
            {
                await smtp.DisconnectAsync(true);
                smtp.Dispose();
            }
        }
    }
}
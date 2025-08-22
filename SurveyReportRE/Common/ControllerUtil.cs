using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Serilog.Context;
using SurveyReportRE.Models.Migration.Business.Workflow;
using SurveyReportRE.Models.Migration.Config;
using System.Data;
using System.Security.Claims;
using System.Text;

namespace SurveyReportRE.ControllerUtil
{
    public static class ControllerUtil
    {
        public static string GetWebFile(IWebHostEnvironment env, string folder, string filename)
        {
            return env.WebRootPath
               + Path.DirectorySeparatorChar.ToString()
               + folder
               + Path.DirectorySeparatorChar.ToString()
               + filename;
        }
        public static void ContextHandle(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, out bool isDebugmode)
        {
            isDebugmode = false;
            string checkIfLoginAsDebug = configuration.GetSection("SuperUser:LoginAs").Value;
            string superUsers = configuration.GetSection("SuperUser:SuperUser").Value;
            
            if (!string.IsNullOrEmpty(checkIfLoginAsDebug))
            {
                {
                    var newIdentity = new ClaimsIdentity();
                    newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, checkIfLoginAsDebug));
                    httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
                }
            }
            var session = httpContextAccessor.HttpContext.Session;
            if (session != null && session.TryGetValue("ImpersonatedUser", out var userData))
            {
                var impersonatedUser = System.Text.Encoding.UTF8.GetString(userData);
                if (!string.IsNullOrWhiteSpace(impersonatedUser))
                {
                    isDebugmode = true;
                    var newIdentity = new ClaimsIdentity();
                    newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, impersonatedUser));
                    httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
                }
            }else
            {
               
            }
        }

        public static string GenerateNumberSeq(List<FormatCodeNo> tableConfigs, IBaseRepository<FormatCodeNo> baseRepository, string tableName = "")
        {
            FormatCodeNo tableConfig = new FormatCodeNo();

            tableConfig = tableConfigs.Where(x => x.SysTableFK?.Name == tableName && x.IsDefault == true).FirstOrDefault();
            // Begin process
            if (tableConfig != null)
            {
                string rs = string.Empty;

                bool hasCodeNumberConfig = false;
                bool isManual = false;
                bool hasHasTableRefWithDefault = false;

                string r_format = string.Empty;
                string r_DateFormat = string.Empty;
                int r_Next = 0;

                //Get config of Table

                if (tableConfig != null)
                {
                    hasCodeNumberConfig = true;
                    r_format = tableConfig.Format;
                    r_DateFormat = tableConfig.DateFormat;
                    r_Next = tableConfig.Next ?? 1;
                }
                else
                {

                    if (tableConfig != null)
                    {
                        hasHasTableRefWithDefault = true;
                        r_format = tableConfig.Format;
                        r_DateFormat = tableConfig.DateFormat;
                        r_Next = tableConfig.Next ?? 1;
                    }
                }

                if (hasCodeNumberConfig && isManual == false)
                {
                    string format = r_format;
                    if (format.Contains("@"))
                    {
                        format = format.Replace("@", string.Format("{0:" + r_DateFormat + "}", DateTime.UtcNow.Date));
                    }

                    string formatNumber = string.Empty;
                    string formatNumberString = string.Empty;
                    foreach (var c in format.ToCharArray())
                    {
                        if (c == '#')
                        {
                            formatNumber += c;
                            formatNumberString += '0';
                        }
                    }

                    if (formatNumber != string.Empty)
                    {
                        format = format.Replace(formatNumber, string.Format("{0:" + formatNumberString + "}", r_Next));
                    }

                    rs = format;

                    //Update NumberSeq
                    tableConfig.Next = r_Next + 1;
                }
                //else if (hasCodeNumberConfig && isManual == true)
                //{
                //    rs = string.Format("{0}", paperNo);

                //    //Update NumberSeq
                //    tableConfig.Next = r_Next + 1;
                //}
                else if (hasCodeNumberConfig == false && hasHasTableRefWithDefault == true)
                {
                    string format = r_format;
                    if (format.Contains("@"))
                    {
                        format = format.Replace("@", string.Format("{0:" + r_DateFormat + "}", DateTime.UtcNow.Date));
                    }

                    string formatNumber = string.Empty;
                    string formatNumberString = string.Empty;
                    foreach (var c in format.ToCharArray())
                    {
                        if (c == '#')
                        {
                            formatNumber += c;
                            formatNumberString += '0';
                        }
                    }

                    if (formatNumber != string.Empty)
                    {
                        format = format.Replace(formatNumber, string.Format("{0:" + formatNumberString + "}", r_Next));
                    }

                    rs = format;

                    //Update NumberSeq
                    tableConfig.Next = r_Next + 1;
                }
                else
                {
                    rs = string.Empty;
                }
                baseRepository.UpdateData(tableConfig, JsonConvert.SerializeObject(tableConfig), tableConfig?.Id, "Id");
                return rs;
            }
            else
                return "...";
        }
    }
    public enum CommandQueryType
    {
        Insert,
        Update,
        Delete
    }
}

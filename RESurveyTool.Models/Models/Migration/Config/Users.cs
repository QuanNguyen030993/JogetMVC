using SurveyReportRE.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Migration.Business.Config
{
    public class Users : BaseModel
    {

        public string name { get; set; } = "";

        public string mail { get; set; } = "";

        public string givenname { get; set; } = "";

        public string sn { get; set; } = "";

        public string userPrincipalName { get; set; } = "";

        public string distinguishedName { get; set; } = "";

        public string department
        {
            get
            {
                return distinguishedName.Split(',')[1].Remove(0, 3).Trim();
            }
        }

        public string branch
        {
            get
            {

                string branch = distinguishedName.Split(',')[2].Remove(0, 6).Trim();
                if (branch.Trim().ToUpper() == "SGN")
                {
                    return "HCM";
                }
                return "HN";
            }
        }

        public string username
        {
            get
            {
                return userPrincipalName.Split('@')[0];
            }
        }
    }
}

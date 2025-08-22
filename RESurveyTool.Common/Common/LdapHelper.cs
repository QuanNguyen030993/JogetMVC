
using SurveyReportRE.Models.Base;
using System.DirectoryServices;
using System.DirectoryServices.Protocols;
using System.Net;
using DirectoryEntry = System.DirectoryServices.DirectoryEntry;

namespace LdapService
{
    public static class LdapHelper // không dùng tạm đóng 
    {
        private static  string _ldapServer;
        private static  string _ldapUser;
        private static  string _ldapPassword;

        //public static LdapHelper(string ldapServer, string ldapUser, string ldapPassword)
        //{
        //    _ldapServer = ldapServer;
        //    _ldapUser = ldapUser;
        //    _ldapPassword = ldapPassword;
        //}

        public static void LdapInitialize(string ldapServer, string ldapUser, string ldapPassword)
        {
            _ldapServer = ldapServer;
            _ldapUser = ldapUser;
            _ldapPassword = ldapPassword;
        }

        // Phương thức kiểm tra thông tin đăng nhập bằng DirectoryEntry
        public static bool ValidateCredentials()
        {
            try
            {
                // Tạo đối tượng DirectoryEntry để kết nối với LDAP
                using (var entry = new DirectoryEntry(_ldapServer, _ldapUser, _ldapPassword))
                {
                    // Kết nối đến server LDAP
                    var nativeObject = entry.NativeObject;
                    Console.WriteLine("Kết nối LDAP thành công.");
                    return true;
                }
            }
            catch (DirectoryServicesCOMException ex)
            {
                // Xử lý lỗi khi không kết nối được
                Console.WriteLine("Lỗi kết nối LDAP: " + ex.Message);
                return false;
            }
        }
        public static bool ValidateCredentials(string userName, string password)
        {
            try
            {
                // Tạo đối tượng DirectoryEntry để kết nối với LDAP
                using (var entry = new DirectoryEntry(_ldapServer, userName, password))
                {
                    // Kết nối đến server LDAP
                    var nativeObject = entry.NativeObject;
                    Console.WriteLine("Login thành công.");
                    return true;
                }
            }
            catch (DirectoryServicesCOMException ex)
            {
                // Xử lý lỗi khi không kết nối được
                Console.WriteLine("Lỗi kết nối LDAP: " + ex.Message);
                return false;
            }
        }

        // Phương thức lấy tất cả người dùng từ LDAP
        public static List<string> GetAllUsers()
        {
            var users = new List<string>();
            try
            {
                using (var entry = new DirectoryEntry(_ldapServer, _ldapUser, _ldapPassword))
                {
                    using (var searcher = new DirectorySearcher(entry))
                    {
                        // Thiết lập bộ lọc để lấy các đối tượng người dùng
                        searcher.Filter = "(objectClass=user)";
                        searcher.PropertiesToLoad.Add("sAMAccountName"); // Chỉ lấy thuộc tính tên đăng nhập

                        // Thực hiện tìm kiếm
                        var resultCollection = searcher.FindAll();

                        // Lặp qua kết quả và thêm vào danh sách
                        foreach (SearchResult result in resultCollection)
                        {
                            if (result.Properties.Contains("sAMAccountName"))
                            {
                                users.Add(result.Properties["sAMAccountName"][0].ToString());
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi khi lấy danh sách người dùng: " + ex.Message);
            }
            return users;
        }
    }


    public static class LDConnect
    {
        private static string _domainName;
        private static string _userName;
        private static string _password;

        //public static LDConnect(string domainName, string userName, string password)
        //{
        //    _domainName = domainName;
        //    _userName = userName;
        //    _password = password;
        //}
        //public static LDConnect()
        //{
        //}
        public static void LDConnectInitialize(string domainName, string userName, string password)
        {
             _domainName = domainName;
             _userName = userName;
             _password = password;
        }
        public static List<ADUser> GetAllUsers(string path, bool hasTerminated, bool hasNilEmail)
        {
            SearchResultCollection results;
            DirectorySearcher ds = null;
            DirectoryEntry de = new
            DirectoryEntry(GetCurrentDomainPath());

            ds = new DirectorySearcher(de);
            ds.Filter = "(&(objectCategory=User)(objectClass=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";//TERMINATED=(userAccountControl:1.2.840.113556.1.4.803:=2)

            results = ds.FindAll();
            string result = "list_user.txt";
            List<ADUser> users = new List<ADUser>();
            foreach (SearchResult sr in results)
            {
                // string text = $"{sr.GetPropertyValue("name")};{sr.GetPropertyValue("mail")};{sr.GetPropertyValue("givenname")};{sr.GetPropertyValue("sn")};{sr.GetPropertyValue("userPrincipalName")};{sr.GetPropertyValue("distinguishedName")}\r\n";
                // File.AppendAllText(Path.Combine(path, result), text);

                //if(!hasTerminated && !hasNilEmail)
                //{
                //    if (!sr.GetPropertyValue("distinguishedName").Contains("OU=TERMINATED") && !string.IsNullOrEmpty(sr.GetPropertyValue("mail")))
                //    {
                //        string text = $"{sr.GetPropertyValue("name")};{sr.GetPropertyValue("mail")};{sr.GetPropertyValue("givenname")};{sr.GetPropertyValue("sn")};{sr.GetPropertyValue("userPrincipalName")};{sr.GetPropertyValue("distinguishedName")}\r\n";
                //        File.AppendAllText(Path.Combine(path, result), text);
                //    }
                //}else if(hasNilEmail && !hasTerminated)
                //{
                //    if (!sr.GetPropertyValue("distinguishedName").Contains("OU=TERMINATED"))
                //    {
                //        string text = $"{sr.GetPropertyValue("name")};{sr.GetPropertyValue("mail")};{sr.GetPropertyValue("givenname")};{sr.GetPropertyValue("sn")};{sr.GetPropertyValue("userPrincipalName")};{sr.GetPropertyValue("distinguishedName")}\r\n";
                //        File.AppendAllText(Path.Combine(path, result), text);
                //    }
                //}else if (!hasNilEmail && hasTerminated)
                //{
                //    if (!string.IsNullOrEmpty(sr.GetPropertyValue("mail")))
                //    {
                //        string text = $"{sr.GetPropertyValue("name")};{sr.GetPropertyValue("mail")};{sr.GetPropertyValue("givenname")};{sr.GetPropertyValue("sn")};{sr.GetPropertyValue("userPrincipalName")};{sr.GetPropertyValue("distinguishedName")}\r\n";
                //        File.AppendAllText(Path.Combine(path, result), text);
                //    }
                //}

                if (!string.IsNullOrEmpty(sr.GetPropertyValue("mail")))
                {
                    users.Add(new ADUser
                    {
                        name = sr.GetPropertyValue("name").Trim(),
                        mail = sr.GetPropertyValue("mail").Trim(),
                        givenname = sr.GetPropertyValue("givenname").Trim(),
                        sn = sr.GetPropertyValue("sn").Trim(),
                        distinguishedName = sr.GetPropertyValue("distinguishedName").Trim(),
                        userPrincipalName = sr.GetPropertyValue("userPrincipalName").Trim()
                    });
                    //string text = $"{sr.GetPropertyValue("name")};{sr.GetPropertyValue("mail")};{sr.GetPropertyValue("givenname")};{sr.GetPropertyValue("sn")};{sr.GetPropertyValue("userPrincipalName")};{sr.GetPropertyValue("distinguishedName")};{sr.GetPropertyValue("distinguishedName").Split(',')[1].Remove(0, 3).Trim()};{sr.GetPropertyValue("distinguishedName").Split(',')[2].Remove(0, 6).Trim()}\r\n";
                    //File.AppendAllText(Path.Combine(path, result), text);
                }
            }
            return users;
        }
        public static List<ADUser> GetAllUsers(bool hasTerminated, bool hasNilEmail)
        {
            SearchResultCollection results;
            DirectorySearcher ds = null;
            DirectoryEntry de = new
            DirectoryEntry(GetCurrentDomainPath());

            ds = new DirectorySearcher(de);
            ds.Filter = "(&(objectCategory=User)(objectClass=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";//TERMINATED=(userAccountControl:1.2.840.113556.1.4.803:=2)

            results = ds.FindAll();
            string result = "list_user.txt";
            List<ADUser> users = new List<ADUser>();
            foreach (SearchResult sr in results)
            {

                if (!string.IsNullOrEmpty(sr.GetPropertyValue("mail")))
                {
                    users.Add(new ADUser
                    {
                        name = sr.GetPropertyValue("name").Trim(),
                        mail = sr.GetPropertyValue("mail").Trim(),
                        givenname = sr.GetPropertyValue("givenname").Trim(),
                        sn = sr.GetPropertyValue("sn").Trim(),
                        distinguishedName = sr.GetPropertyValue("distinguishedName").Trim(),
                        userPrincipalName = sr.GetPropertyValue("userPrincipalName").Trim()
                    });
                    //string text = $"{sr.GetPropertyValue("name")};{sr.GetPropertyValue("mail")};{sr.GetPropertyValue("givenname")};{sr.GetPropertyValue("sn")};{sr.GetPropertyValue("userPrincipalName")};{sr.GetPropertyValue("distinguishedName")};{sr.GetPropertyValue("distinguishedName").Split(',')[1].Remove(0, 3).Trim()};{sr.GetPropertyValue("distinguishedName").Split(',')[2].Remove(0, 6).Trim()}\r\n";
                    //File.AppendAllText(Path.Combine(path, result), text);
                }
            }
            return users;
        }
        private static ADUser? GetOneUser(DirectorySearcher ds)
        {
            ds.Filter = "(&(objectCategory=User)(objectClass=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";//TERMINATED=(userAccountControl:1.2.840.113556.1.4.803:=2)
            var sr = ds.FindOne();
            if (sr != null)
            {
                return new ADUser
                {
                    name = sr.GetPropertyValue("name").Trim(),
                    mail = sr.GetPropertyValue("mail").Trim(),
                    givenname = sr.GetPropertyValue("givenname").Trim(),
                    sn = sr.GetPropertyValue("sn").Trim(),
                    distinguishedName = sr.GetPropertyValue("distinguishedName").Trim(),
                    userPrincipalName = sr.GetPropertyValue("userPrincipalName").Trim()
                };
            }
            return null;
        }
        public static void SearchForUsers(string userName)
        {
            SearchResultCollection results;
            DirectorySearcher ds = null;
            DirectoryEntry de = new DirectoryEntry(GetCurrentDomainPath());

            // Build User Searcher
            ds = BuildUserSearcher(de);

            ds.Filter = "(&(objectCategory=User)(objectClass=person)(name=" + userName + "*))";

            results = ds.FindAll();

            foreach (SearchResult sr in results)
            {
                //Debug.WriteLine(sr.GetPropertyValue("name"));
                //Debug.WriteLine(sr.GetPropertyValue("mail"));
                //Debug.WriteLine(sr.GetPropertyValue("givenname"));
                //Debug.WriteLine(sr.GetPropertyValue("sn"));
                //Debug.WriteLine(sr.GetPropertyValue("userPrincipalName"));
                //Debug.WriteLine(sr.GetPropertyValue("distinguishedName"));
            }
        }
        private static DirectorySearcher BuildUserSearcher(DirectoryEntry de)
        {
            DirectorySearcher ds = null;

            ds = new DirectorySearcher(de);

            // Full Name
            ds.PropertiesToLoad.Add("name");

            // Email Address
            ds.PropertiesToLoad.Add("mail");

            // First Name
            ds.PropertiesToLoad.Add("givenname");

            // Last Name (Surname)
            ds.PropertiesToLoad.Add("sn");

            // Login Name
            ds.PropertiesToLoad.Add("userPrincipalName");

            // Distinguished Name
            ds.PropertiesToLoad.Add("distinguishedName");

            return ds;
        }
        private static string GetCurrentDomainPath()
        {
            DirectoryEntry de = new DirectoryEntry("LDAP://RootDSE");

            return "LDAP://" + de.Properties["defaultNamingContext"][0].ToString();
        }
        public static bool AuthenticateUser(string domainName, string userName, string password)
        {
            bool ret = false;

            try
            {
                DirectoryEntry de = new DirectoryEntry("LDAP://" + domainName, userName, password);
                var nativeObject = de.NativeObject;

                //DirectorySearcher dsearch = new DirectorySearcher(de);
                //SearchResult results = null;

                //results = dsearch.FindOne();

                //var user = GetOneUser(dsearch);
                //string name = results.GetPropertyValue("name");

                ret = true;
            }
            catch (DirectoryServicesCOMException ex)
            {
                ret = false;
            }
            catch (Exception aw)
            {
                ret = false;
            }

            return ret;
        }
        public static bool CheckLdapConnection(string ldapPath)
        {
            try
            {
                // Tạo kết nối LDAP
                using (var ldapConnection = new LdapConnection(ldapPath))
                {
                    // Đặt thông tin xác thực nếu cần
                    ldapConnection.Credential = new NetworkCredential(_userName, _password);

                    // Thử kết nối tới máy chủ
                    ldapConnection.Bind(); // Sẽ ném ra ngoại lệ nếu kết nối thất bại
                }

                return true; // Kết nối thành công
            }
            catch (LdapException e)
            {
                return false; // Dịch vụ LDAP không truy cập được
            }
            catch (Exception e)
            {
                return false; // Có lỗi mạng khác xảy ra
            }



            //try
            //{
            //    // Tạo đối tượng DirectoryEntry mà không cần username và password (anonymous bind)
            //    using (DirectoryEntry ldapConnection = new DirectoryEntry(ldapPath))
            //    {
            //        // Thử truy cập thuộc tính NativeObject để kiểm tra kết nối
            //        object nativeObj = ldapConnection.NativeObject;

            //        // Nếu không có ngoại lệ, kết nối thành công
            //        return true;
            //    }
            //}
            //catch (DirectoryServicesCOMException comEx)
            //{
            //    // Bắt lỗi nếu không thể kết nối LDAP
            //    Console.WriteLine($"Lỗi COM: {comEx.Message}");
            //}
            //catch (Exception ex)
            //{
            //    // Bắt lỗi chung
            //    Console.WriteLine($"Lỗi: {ex.Message}");
            //}

            //// Trả về false nếu không thể kết nối
            //return false;
        }
    }
    public static  class ADExtensionMethods
    {
        public static  string GetPropertyValue(this SearchResult sr, string propertyName)
        {
            string ret = string.Empty;

            if (sr.Properties[propertyName].Count > 0)
                ret = sr.Properties[propertyName][0].ToString();

            return ret;
        }
    }


}

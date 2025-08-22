using DevExtreme.AspNet.Data;
using HtmlAgilityPack;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Config;
using SurveyReportRE.Models.Request;
using System.Data;
using System.Dynamic;

[ApiController]
[Route("api/[controller]/[action]")]
public class SearchController : BaseControllerApi<Search>
{
	private readonly IBaseRepository<Search> _BaseRepository;
	private readonly IConfiguration configuration;
	private readonly IBaseRepository<EnumData> _enumDataRepository;
	public static string PATH_TEMPLATE = "";
	public static string BLOB_PATH = "";
	public static string SUPER_USER = "";
	public static string DOMAIN_NAME = "";

	public SearchController(IBaseRepository<Search> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
	{
		configuration = config;
		_BaseRepository = BaseRepository;
		_enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
		BLOB_PATH = configuration.GetSection("BlobStorage:Path").Value;
		SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
		DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
	}

	[HttpPost]
	public object Query([FromBody] FilterRequest valuesData) //DataSourceLoadOptions loadOptions)
	{

		DataTable searchQuery = DataUtil.ExecuteStoredProcedureReturn(_BaseRepository._connectionString, "usp_Survey_Search",
				("@FromDate", valuesData.FromDate), ("@ToDate", valuesData.ToDate), ("@Outline", valuesData.Outline), ("@Content", valuesData.Content));

		List<Dictionary<string, object>> result = new List<Dictionary<string, object>>();
		foreach (DataRow row in searchQuery.Rows)
		{
			Dictionary<string, object> rowData = new Dictionary<string, object>();
			rowData.Add("Id", row.Field<Int64>("Id"));
			rowData.Add("FileName", row.Field<string>("FileName"));
			//rowData.Add("Extension", row.Field<string>("Extension"));
			rowData.Add("Path", row.Field<string>("Path"));
			rowData.Add("Line", row.Field<string>("Line"));
			rowData.Add("FileSize", row.Field<string>("FileSize"));
			rowData.Add("DateCreated", row.Field<string>("DateCreated"));
			rowData.Add("DateAccessed", row.Field<string>("DateAccessed"));
			rowData.Add("SurveyId", row.Field<Int64>("SurveyId"));

			if (!string.IsNullOrEmpty(valuesData.Content))
			{
				string fileName = row.Field<string>("FileName");
				if (!string.IsNullOrEmpty(fileName))
				{
					var listFile = System.IO.Directory.GetFiles(BLOB_PATH, $"*{fileName}*.txt", SearchOption.AllDirectories);
					foreach (var file in listFile)
					{
						if (System.IO.File.Exists(file))
						{
							string contentFiles = System.IO.File.ReadAllText(file);
							if (contentFiles.Contains(valuesData.Content))
							{
                                result.Add(rowData);
                            }
						}
					}
				}
			}
			else
			{
				result.Add(rowData);
			}
		}



		return Ok(result);
	}

}


using Microsoft.AspNetCore.SignalR;
using SurveyReportRE.Models.Migration.Business.MasterData;
using System.Threading.Tasks;

public class FileProcessingHub : Hub
{
    public async Task NotifyFileProcessingCompleted(int surveyId)
    {
        await Clients.Caller.SendAsync("FileProcessingCompleted", surveyId);
    }
    public string GetConnectionId()
    {
        return Context.ConnectionId;
    }
    public async Task RenderSurveyTabNotCompleted(string TabName)
    {
        await Clients.Caller.SendAsync("RenderSurveyTabNotCompleted", TabName);

    }
    public async Task SubmitRecallVisible(string connectionId, long? id)
    {
        await Clients.Caller.SendAsync("SubmitRecallVisible", connectionId);

    }
}

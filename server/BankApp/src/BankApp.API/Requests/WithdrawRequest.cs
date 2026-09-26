namespace BankApp.API.Requests
{
    // The frontend sends "Checking" (a string), but the model binder expects an AccountType enum value. It can't match them, so the binding fails entirely
    // That's why we need this request model to accept a string and then convert it to an AccountType enum in the controller
    public record WithdrawRequest(string AccountType, decimal Amount, string Description);
}

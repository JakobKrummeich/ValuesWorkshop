namespace ValuesWorkshop.Domain.Tests;

public class QuizProgressTests
{
    [Fact]
    public void Initially_no_question_is_posed()
    {
        new QuizProgress().CurrentQuestion.ShouldBeNull();
    }
}

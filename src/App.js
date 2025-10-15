import { Console } from '@woowacourse/mission-utils';

class App {
  async run() {
    const userInputString = await Console.readLineAsync('덧셈할 문자열을 입력해 주세요.\n');
    const trimmedUserInputString = userInputString.trim();

    if (trimmedUserInputString === '') {
      Console.print('결과 : 0');
    }
  }
}

export default App;

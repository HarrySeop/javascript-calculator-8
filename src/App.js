import { Console } from '@woowacourse/mission-utils';

/**
 * 기본 구분자(쉼표, 콜론)로 문자열을 나눕니다.
 * - 선행/후행/연속 구분자 등으로 인해 값이 비어 있으면 Error를 던집니다.
 * @param {string} trimmedUserInputString - 사용자 입력 문자열(공백 제거된 상태)
 * @returns {string[]} 구분자를 기준으로 분리된 문자열 배열
 */
const splitByDefaultDelimiters = (trimmedUserInputString) => {
  const splitStrings = trimmedUserInputString.split(/[,:]/);

  const hasEmptyString = splitStrings.some((splitString) => splitString === '');
  if (hasEmptyString) {
    throw new Error('[ERROR] 구분자를 기준으로 값이 비어 있습니다.');
  }

  return splitStrings;
};
class App {
  async run() {
    const userInputString = await Console.readLineAsync('덧셈할 문자열을 입력해 주세요.\n');
    const trimmedUserInputString = userInputString.trim();

    if (trimmedUserInputString === '') {
      Console.print('결과 : 0');
      return;
    }

    const splitStrings = splitByDefaultDelimiters(trimmedUserInputString);
    Console.print(splitStrings);
  }
}

export default App;

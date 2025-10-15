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

/**
 * 문자열 배열을 숫자 배열로 변환하기 전에 모든 값이 숫자인지 검증합니다.
 * - 숫자가 아닌 값이 하나라도 있으면 Error를 던집니다.
 * @param {string[]} splitStrings - 구분자로 분리된 문자열 배열
 * @returns {number[]} 변환된 숫자 배열
 */
const convertToValidatedNumbers = (splitStrings) => {
  const hasOnlySpaces = splitStrings.some((splitString) => splitString.trim() === '');
  if (hasOnlySpaces) {
    throw new Error('[ERROR] 공백만 있는 값은 입력할 수 없습니다.');
  }
  const convertedNumbers = splitStrings.map((splitString) => Number(splitString));

  const hasNonNumber = convertedNumbers.some((numberValue) => Number.isNaN(numberValue));
  if (hasNonNumber) {
    throw new Error('[ERROR] 숫자가 아닌 값을 입력하시면 안됩니다.');
  }

  return convertedNumbers;
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
    const splitNumbers = convertToValidatedNumbers(splitStrings);
    Console.print(splitStrings);
    Console.print(splitNumbers);
  }
}

export default App;

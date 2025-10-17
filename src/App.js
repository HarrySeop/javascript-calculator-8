import { Console } from '@woowacourse/mission-utils';

const DEFAULT_DELIMITERS = [',', ':'];

/**
 * 정규식에서 안전하게 사용할 수 있도록 단일 구분자 문자에 이스케이프를 적용합니다.
 * @param {string} delimiter - 정규식에서 사용할 단일 구분자 문자
 * @returns {string} 이스케이프된 구분자
 */
const escapeDelimiterForRegex = delimiter => delimiter.replace(/[\\^$.*+?()[\]{}|]/, '\\$&');

/**
 * 입력 문자열이 커스텀 구분자 헤더("//")로 시작하는지 여부를 반환합니다.
 * @param {string} trimmedUserInputString - 사용자 입력 문자열(공백 제거된 상태)
 * @returns {boolean} 입력이 "//"로 시작하면 true, 그렇지 않으면 false
 */
const hasCustomDelimiterHeader = trimmedUserInputString => trimmedUserInputString.startsWith('//');

/**
 * 커스텀 구분자를 추출하고 문자열에서 분리해서 반환합니다.
 * - 이 함수는 hasCustomDelimiterHeader(trimmedUserInputString) === true 인 경우에만 호출된다고 가정합니다.
 * - `//<문자>\n` 구조를 가진 입력에서 구분자를 추출합니다.
 *
 * @param {string} trimmedUserInputString - 사용자 입력(앞뒤 공백 제거된 상태, 시작이 '//'라는 전제)
 * @returns {{ customDelimiter: string, remainingInput: string }} 커스텀 구분자와 '\n' 이후 문자열
 */
const extractCustomDelimiter = trimmedUserInputString => {
  const preprocessedInput = trimmedUserInputString.replace(/\\n/, '\n');

  const delimiterBoundaryIndex = preprocessedInput.indexOf('\n');
  if (delimiterBoundaryIndex === -1) {
    throw new Error('[ERROR] 커스텀 구분자 형식이 올바르지 않습니다. ("//<문자>\\n")');
  }

  const delimiterSection = preprocessedInput.slice(2, delimiterBoundaryIndex);
  const remainingInput = preprocessedInput.slice(delimiterBoundaryIndex + 1);

  const delimiterCandidate = delimiterSection.trim();

  if (delimiterCandidate === '') {
    throw new Error('[ERROR] 커스텀 구분자가 비어 있습니다.');
  }

  if (delimiterCandidate.length !== 1) {
    throw new Error('[ERROR] 커스텀 구분자는 한 글자만 입력할 수 있습니다.');
  }

  const customDelimiter = delimiterCandidate;
  return { customDelimiter, remainingInput };
};

/**
 * 이스케이프된 구분자 배열을 사용해 구분자 정규식을 컴파일합니다.
 *
 * @param {string[]} regexSafeDelimiters - escapeDelimiterForRegex를 거친 구분자 배열
 * @returns {RegExp} 컴파일된 구분자 정규식
 */
const compileDelimiterRegex = regexSafeDelimiters => {
  const regexBody = regexSafeDelimiters.join('|');
  return new RegExp(`(?:${regexBody})`);
};

/**
 * 기본 구분자(쉼표, 콜론)로 문자열을 나눕니다.
 * - 선행/후행/연속 구분자 등으로 인해 값이 비어 있으면 Error를 던집니다.
 * @param {string} trimmedUserInputString - 사용자 입력 문자열(공백 제거된 상태)
 * @returns {string[]} 구분자를 기준으로 분리된 문자열 배열
 */
const splitByDefaultDelimiters = trimmedUserInputString => {
  const splitStrings = trimmedUserInputString.split(/[,:]/);

  const hasEmptyString = splitStrings.some(splitString => splitString === '');
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
const convertToValidatedNumbers = splitStrings => {
  const hasOnlySpaces = splitStrings.some(splitString => splitString.trim() === '');
  if (hasOnlySpaces) {
    throw new Error('[ERROR] 공백만 있는 값은 입력할 수 없습니다.');
  }
  const convertedNumbers = splitStrings.map(splitString => Number(splitString));

  const hasNonNumber = convertedNumbers.some(numberValue => Number.isNaN(numberValue));
  if (hasNonNumber) {
    throw new Error('[ERROR] 숫자가 아닌 값을 입력하시면 안됩니다.');
  }

  return convertedNumbers;
};

/**
 * 숫자 배열이 모두 양수인지 검증합니다.
 * - 0 이하의 숫자가 하나라도 있으면 Error를 던집니다.
 * @param {number[]} numbers - 검증할 숫자 배열
 */
const validatePositiveNumbers = numbers => {
  const hasZeroOrNegative = numbers.some(number => number <= 0);
  if (hasZeroOrNegative) {
    throw new Error('[ERROR] 양수만 입력할 수 있습니다.');
  }
};

/**
 * 전달된 숫자 배열의 합을 계산해 반환합니다.
 * @param {number[]} numbers - 합을 계산할 숫자 배열
 * @returns {number} 숫자 배열의 총합
 */
const sumNumbers = numbers => numbers.reduce((accumulator, currentNumber) => accumulator + currentNumber, 0);

class App {
  async run() {
    const userInputString = await Console.readLineAsync('덧셈할 문자열을 입력해 주세요.\n');
    const trimmedUserInputString = userInputString.trim();

    if (trimmedUserInputString === '') {
      Console.print('결과 : 0');
      return;
    }

    let sourceString = trimmedUserInputString;
    let delimiters = DEFAULT_DELIMITERS;

    if (hasCustomDelimiterHeader(trimmedUserInputString)) {
      const { customDelimiter, remainingInput } = extractCustomDelimiter(trimmedUserInputString);

      sourceString = remainingInput;
      delimiters = [customDelimiter, ...DEFAULT_DELIMITERS];
    }

    const regexSafeDelimiters = delimiters.map(escapeDelimiterForRegex);

    Console.print(sourceString);
    Console.print(regexSafeDelimiters);

    const delimiterRegex = compileDelimiterRegex(regexSafeDelimiters);
    Console.print(delimiterRegex);

    const splitStrings = splitByDefaultDelimiters(trimmedUserInputString);
    const numbers = convertToValidatedNumbers(splitStrings);
    validatePositiveNumbers(numbers);
    const calculatedSum = sumNumbers(numbers);

    Console.print(`결과 : ${calculatedSum}`);
  }
}

export default App;

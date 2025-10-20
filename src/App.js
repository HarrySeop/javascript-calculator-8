import { Console } from '@woowacourse/mission-utils';

/**
 * 객체나 배열을 재귀적으로 동결합니다.
 * - `Object.keys()`로 enumerable한 문자열 키만 순회합니다.
 *
 * @param {object} object - 동결할 객체
 * @returns {object} - 완전히 동결된 같은 참조 객체
 */
export function deepFreeze(object) {
  Object.keys(object).forEach(key => {
    const value = object[key];

    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });

  return Object.freeze(object);
}

const ERROR_MESSAGES = deepFreeze({
  INVALID_CUSTOM_DELIMITER_FORMAT: '[ERROR] 커스텀 구분자 형식이 올바르지 않습니다.',
  EMPTY_CUSTOM_DELIMITER: '[ERROR] 커스텀 구분자가 비어 있습니다.',
  SINGLE_CHARACTER_ONLY: '[ERROR] 커스텀 구분자는 한 글자만 입력할 수 있습니다.',
  FORBIDDEN_DELIMITER: '[ERROR] 커스텀 구분자로 계산기에 사용되는 항목(숫자, 소수점)은 입력할 수 없습니다.',
  EMPTY_VALUES: '[ERROR] 구분자를 기준으로 값이 비어 있습니다.',
  WHITESPACE_ONLY: '[ERROR] 공백만 있는 값은 입력할 수 없습니다.',
  NON_NUMERIC_VALUE: '[ERROR] 숫자가 아닌 값을 입력하시면 안됩니다.',
  POSITIVE_NUMBERS_ONLY: '[ERROR] 양수만 입력할 수 있습니다.',
});

const OUTPUT_MESSAGES = deepFreeze({
  INPUT_PROMPT: '덧셈할 문자열을 입력해 주세요.\n',
  ZERO_RESULT: '결과 : 0',
  RESULT_PREFIX: '결과 : ',
});

const DELIMITER_CONSTANTS = deepFreeze({
  CUSTOM_PREFIX: '//',
  PREFIX_LENGTH: 2,
  DELIMITER_BOUNDARY: '\n',
  DELIMITER_BOUNDARY_LENGTH: 1,
  SINGLE_CHARACTER_LENGTH: 1,
  DEFAULT_DELIMITERS: [',', ':'],
});

const REGEX_PATTERNS = deepFreeze({
  REGEX_SPECIAL_CHARACTERS: /[\\^$.*+?()[\]{}|]/,
  FORBIDDEN_DELIMITERS: /[\d.]/,
  ESCAPED_NEWLINE: /\\n/,
});

const STRING_CONSTANTS = deepFreeze({
  REGEX_REPLACEMENT: '\\$&',
  EMPTY_STRING: '',
});

const NUMBER_CONSTANTS = deepFreeze({
  NOT_FOUND_INDEX: -1,
  POSITIVE_THRESHOLD: 0,
  INITIAL_SUM: 0,
});

/**
 * 정규식에서 안전하게 사용할 수 있도록 단일 구분자 문자에 이스케이프를 적용합니다.
 *
 * @param {string} delimiter - 정규식에서 사용할 단일 구분자 문자
 * @returns {string} 이스케이프된 구분자
 */
const escapeDelimiterForRegex = delimiter =>
  delimiter.replace(REGEX_PATTERNS.REGEX_SPECIAL_CHARACTERS, STRING_CONSTANTS.REGEX_REPLACEMENT);

/**
 * 입력 문자열이 커스텀 구분자 헤더("//")로 시작하는지 여부를 반환합니다.
 *
 * @param {string} trimmedUserInputString - 사용자 입력 문자열(공백 제거된 상태)
 * @returns {boolean} 입력이 "//"로 시작하면 true, 그렇지 않으면 false
 */
const hasCustomDelimiterHeader = trimmedUserInputString =>
  trimmedUserInputString.startsWith(DELIMITER_CONSTANTS.CUSTOM_PREFIX);

/**
 * 커스텀 구분자를 추출하고 문자열에서 분리해서 반환합니다.
 * - 이 함수는 hasCustomDelimiterHeader(trimmedUserInputString) === true 인 경우에만 호출된다고 가정합니다.
 * - `//<문자>\n` 구조를 가진 입력에서 구분자를 추출합니다.
 * - 이모지를 포함한 유니코드 문자를 한 글자로 인식합니다.
 * - 계산기에 사용되는 항목(숫자, 소수점)은 구분자로 사용할 수 없습니다.
 *
 * @param {string} trimmedUserInputString - 사용자 입력(앞뒤 공백 제거된 상태, 시작이 '//'라는 전제)
 * @returns {{ customDelimiter: string, remainingInput: string }} 커스텀 구분자와 '\n' 이후 문자열
 */
const extractCustomDelimiter = trimmedUserInputString => {
  const preprocessedInput = trimmedUserInputString.replace(
    REGEX_PATTERNS.ESCAPED_NEWLINE,
    DELIMITER_CONSTANTS.DELIMITER_BOUNDARY,
  );

  const delimiterBoundaryIndex = preprocessedInput.indexOf(DELIMITER_CONSTANTS.DELIMITER_BOUNDARY);
  if (delimiterBoundaryIndex === NUMBER_CONSTANTS.NOT_FOUND_INDEX) {
    throw new Error(ERROR_MESSAGES.INVALID_CUSTOM_DELIMITER_FORMAT);
  }

  const delimiterSection = preprocessedInput.slice(DELIMITER_CONSTANTS.PREFIX_LENGTH, delimiterBoundaryIndex);
  const remainingInput = preprocessedInput.slice(
    delimiterBoundaryIndex + DELIMITER_CONSTANTS.DELIMITER_BOUNDARY_LENGTH,
  );

  const extractedDelimiter = delimiterSection.trim();

  if (extractedDelimiter === STRING_CONSTANTS.EMPTY_STRING) {
    throw new Error(ERROR_MESSAGES.EMPTY_CUSTOM_DELIMITER);
  }

  if ([...extractedDelimiter].length !== DELIMITER_CONSTANTS.SINGLE_CHARACTER_LENGTH) {
    throw new Error(ERROR_MESSAGES.SINGLE_CHARACTER_ONLY);
  }

  if (REGEX_PATTERNS.FORBIDDEN_DELIMITERS.test(extractedDelimiter)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN_DELIMITER);
  }

  const customDelimiter = extractedDelimiter;
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
 * 구분자로 문자열을 나눕니다.
 * - 선행/후행/연속 구분자 등으로 인해 값이 비어 있으면 Error를 던집니다.
 *
 * @param {string} sourceString - 분리할 대상 문자열
 * @param {RegExp} delimiterRegex - compileDelimiterRegex로 컴파일한 구분자 정규식
 * @returns {string[]} 구분자를 기준으로 분리된 문자열 배열
 */
const splitByDelimiter = (sourceString, delimiterRegex) => {
  const splitStrings = sourceString.split(delimiterRegex);

  const hasEmptyString = splitStrings.some(splitString => splitString === STRING_CONSTANTS.EMPTY_STRING);
  if (hasEmptyString) {
    throw new Error(ERROR_MESSAGES.EMPTY_VALUES);
  }

  return splitStrings;
};

/**
 * 문자열 배열을 숫자 배열로 변환하기 전에 모든 값이 숫자인지 검증합니다.
 * - 숫자가 아닌 값이 하나라도 있으면 Error를 던집니다.
 * - 정수와 소수 모두 지원합니다.
 *
 * @param {string[]} splitStrings - 구분자로 분리된 문자열 배열
 * @returns {number[]} 변환된 숫자 배열
 */
const convertToValidatedNumbers = splitStrings => {
  const hasOnlySpaces = splitStrings.some(splitString => splitString.trim() === STRING_CONSTANTS.EMPTY_STRING);
  if (hasOnlySpaces) {
    throw new Error(ERROR_MESSAGES.WHITESPACE_ONLY);
  }
  const convertedNumbers = splitStrings.map(splitString => Number(splitString));

  const hasNonNumber = convertedNumbers.some(numberValue => Number.isNaN(numberValue));
  if (hasNonNumber) {
    throw new Error(ERROR_MESSAGES.NON_NUMERIC_VALUE);
  }

  return convertedNumbers;
};

/**
 * 숫자 배열이 모두 양수인지 검증합니다.
 * - 0 이하의 숫자가 하나라도 있으면 Error를 던집니다.
 *
 * @param {number[]} numbers - 검증할 숫자 배열
 */
const validatePositiveNumbers = numbers => {
  const hasZeroOrNegative = numbers.some(number => number <= NUMBER_CONSTANTS.POSITIVE_THRESHOLD);
  if (hasZeroOrNegative) {
    throw new Error(ERROR_MESSAGES.POSITIVE_NUMBERS_ONLY);
  }
};

/**
 * 전달된 숫자 배열의 합을 계산해 반환합니다.
 *
 * @param {number[]} numbers - 합을 계산할 숫자 배열
 * @returns {number} 숫자 배열의 총합
 */
const sumNumbers = numbers =>
  numbers.reduce((accumulator, currentNumber) => accumulator + currentNumber, NUMBER_CONSTANTS.INITIAL_SUM);

class App {
  async run() {
    const userInputString = await Console.readLineAsync(OUTPUT_MESSAGES.INPUT_PROMPT);
    const trimmedUserInputString = userInputString.trim();

    let sourceString = trimmedUserInputString;
    let delimiters = DELIMITER_CONSTANTS.DEFAULT_DELIMITERS;

    if (hasCustomDelimiterHeader(trimmedUserInputString)) {
      const { customDelimiter, remainingInput } = extractCustomDelimiter(trimmedUserInputString);
      sourceString = remainingInput;
      delimiters = [customDelimiter, ...DELIMITER_CONSTANTS.DEFAULT_DELIMITERS];
    }

    if (sourceString === STRING_CONSTANTS.EMPTY_STRING) {
      Console.print(OUTPUT_MESSAGES.ZERO_RESULT);
      return;
    }

    const regexSafeDelimiters = delimiters.map(escapeDelimiterForRegex);
    const delimiterRegex = compileDelimiterRegex(regexSafeDelimiters);
    const splitStrings = splitByDelimiter(sourceString, delimiterRegex);

    const numbers = convertToValidatedNumbers(splitStrings);
    validatePositiveNumbers(numbers);

    const calculatedSum = sumNumbers(numbers);
    Console.print(`${OUTPUT_MESSAGES.RESULT_PREFIX}${calculatedSum}`);
  }
}

export default App;

import App from '../src/App.js';
import { MissionUtils } from '@woowacourse/mission-utils';

const mockQuestions = inputs => {
  MissionUtils.Console.readLineAsync = jest.fn();

  MissionUtils.Console.readLineAsync.mockImplementation(() => {
    const input = inputs.shift();
    return Promise.resolve(input);
  });
};

const getLogSpy = () => {
  const logSpy = jest.spyOn(MissionUtils.Console, 'print');
  logSpy.mockClear();
  return logSpy;
};

describe('문자열 계산기', () => {
  describe('기본 기능', () => {
    test('빈 문자열 입력 시 0 반환', async () => {
      const inputs = [''];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 0'));
    });

    test('기본 구분자(쉼표, 콜론) 계산', async () => {
      const inputs = ['1,2:3'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 6'));
    });

    test('단일 숫자 입력', async () => {
      const inputs = ['42'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 42'));
    });
  });

  describe('소수 계산', () => {
    test('소수 덧셈', async () => {
      const inputs = ['1.5,2.3'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 3.8'));
    });

    test('커스텀 구분자로 소수 계산', async () => {
      const inputs = ['//;\\n1.5;2.3;3.2'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 7'));
    });
  });

  describe('이모지 구분자 지원', () => {
    test('이모지 커스텀 구분자 계산', async () => {
      const inputs = ['//😀\\n1😀2😀3'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 6'));
    });

    test('또다른 이모지 커스텀 구분자 계산', async () => {
      const inputs = ['//🚀\\n5🚀10'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 15'));
    });
  });

  describe('커스텀 구분자 빈 값 처리', () => {
    test('커스텀 구분자만 있고 숫자 없음', async () => {
      const inputs = ['//-\\n'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 0'));
    });

    test('이모지 구분자만 있고 숫자 없음', async () => {
      const inputs = ['//😀\\n'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 0'));
    });
  });

  describe('금지된 구분자 예외 처리', () => {
    test('숫자 구분자 사용 시 에러', async () => {
      const inputs = ['//1\\n213'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow(
        '[ERROR] 커스텀 구분자로 계산기에 사용되는 항목(숫자, 소수점)은 입력할 수 없습니다.',
      );
    });

    test('소수점 구분자 사용 시 에러', async () => {
      const inputs = ['//.\\n1.2.3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow(
        '[ERROR] 커스텀 구분자로 계산기에 사용되는 항목(숫자, 소수점)은 입력할 수 없습니다.',
      );
    });

    test('여러 문자 구분자 사용 시 에러', async () => {
      const inputs = ['//ab\\n1ab2ab3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 커스텀 구분자는 한 글자만 입력할 수 있습니다.');
    });

    test('빈 커스텀 구분자 사용 시 에러', async () => {
      const inputs = ['//\\n1,2,3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 커스텀 구분자가 비어 있습니다.');
    });
  });

  describe('기존 예외 처리', () => {
    test('음수 입력 시 에러', async () => {
      const inputs = ['-1,2,3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 양수만 입력할 수 있습니다.');
    });

    test('0 입력 시 에러', async () => {
      const inputs = ['0,1,2'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 양수만 입력할 수 있습니다.');
    });

    test('숫자가 아닌 값 입력 시 에러', async () => {
      const inputs = ['1,abc,3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 숫자가 아닌 값을 입력하시면 안됩니다.');
    });

    test('빈 값이 포함된 경우 에러', async () => {
      const inputs = ['1,,3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 구분자를 기준으로 값이 비어 있습니다.');
    });

    test('공백만 있는 값 입력 시 에러', async () => {
      const inputs = ['1, ,3'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 공백만 있는 값은 입력할 수 없습니다.');
    });
  });

  describe('커스텀 구분자 형식 에러', () => {
    test('개행 문자 없는 커스텀 구분자', async () => {
      const inputs = ['//;'];
      mockQuestions(inputs);

      const app = new App();
      await expect(app.run()).rejects.toThrow('[ERROR] 커스텀 구분자 형식이 올바르지 않습니다.');
    });
  });

  describe('복합 테스트', () => {
    test('커스텀 구분자와 기본 구분자 혼용', async () => {
      const inputs = ['//;\\n1;2,3:4'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 10'));
    });

    test('큰 숫자 계산', async () => {
      const inputs = ['1000000000000000000,2000000000000000000,3000000000000000000'];
      mockQuestions(inputs);

      const logSpy = getLogSpy();
      const app = new App();
      await app.run();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('결과 : 6000000000000000000'));
    });
  });
});

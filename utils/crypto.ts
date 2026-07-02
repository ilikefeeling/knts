/**
 * PIN 검증 및 암호화 유틸리티
 */

/**
 * 6자리 문자열(숫자)을 받아 SHA-256 해시를 반환합니다.
 * @param pin 6자리 숫자 문자열
 * @returns 해시된 문자열 (Hex)
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 6자리 숫자 PIN 규칙 검증 (연속/반복 불가)
 * @param pin 검증할 PIN 번호
 * @returns { isValid: boolean, message?: string }
 */
export function validatePinRule(pin: string): { isValid: boolean; message?: string } {
  // 1. 6자리 숫자인지 확인
  if (!/^\d{6}$/.test(pin)) {
    return { isValid: false, message: "PIN 번호는 6자리 숫자여야 합니다." };
  }

  // 2. 3자리 이상 반복된 숫자 검증 (예: 111, 222)
  for (let i = 0; i <= 3; i++) {
    if (pin[i] === pin[i + 1] && pin[i + 1] === pin[i + 2]) {
      return { isValid: false, message: "동일한 숫자를 3번 이상 연속해서 사용할 수 없습니다." };
    }
  }

  // 3. 3자리 이상 연속된 숫자 검증 (예: 123, 321, 890)
  const isSequential = (s: string) => {
    for (let i = 0; i < s.length - 2; i++) {
      const a = parseInt(s[i]);
      const b = parseInt(s[i + 1]);
      const c = parseInt(s[i + 2]);
      if ((a + 1 === b && b + 1 === c) || (a - 1 === b && b - 1 === c)) {
        return true;
      }
    }
    return false;
  };

  if (isSequential(pin)) {
    return { isValid: false, message: "연속된 숫자를 3번 이상 사용할 수 없습니다." };
  }

  return { isValid: true };
}

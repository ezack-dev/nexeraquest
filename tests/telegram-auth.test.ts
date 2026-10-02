import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { validateTelegramInitData } from '@nexeraquest/auth';

describe('Telegram WebApp Authentication & Security', () => {
  const dummyBotToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_test_token';

  function generateValidInitData(userObj: any, authDate: number, token: string) {
    const userStr = JSON.stringify(userObj);
    const params = new Map<string, string>();
    params.set('auth_date', authDate.toString());
    params.set('query_id', 'AAEAAQAAAAAA');
    params.set('user', userStr);

    const dataPairs: string[] = [];
    params.forEach((val, key) => dataPairs.push(`${key}=${val}`));
    dataPairs.sort();
    const dataCheckString = dataPairs.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const searchParams = new URLSearchParams();
    searchParams.set('auth_date', authDate.toString());
    searchParams.set('query_id', 'AAEAAQAAAAAA');
    searchParams.set('user', userStr);
    searchParams.set('hash', hash);

    return searchParams.toString();
  }

  it('validates a genuine Telegram initData payload successfully', () => {
    const now = Math.floor(Date.now() / 1000);
    const user = { id: 777888999, first_name: 'Zack', username: 'zack_web3' };
    const initData = generateValidInitData(user, now, dummyBotToken);

    const result = validateTelegramInitData(initData, dummyBotToken);
    expect(result.isValid).toBe(true);
    expect(result.user?.id).toBe(777888999);
    expect(result.user?.first_name).toBe('Zack');
    expect(result.user?.username).toBe('zack_web3');
  });

  it('rejects tampered Telegram user data (hash mismatch)', () => {
    const now = Math.floor(Date.now() / 1000);
    const user = { id: 777888999, first_name: 'Zack', username: 'zack_web3' };
    const initData = generateValidInitData(user, now, dummyBotToken);

    // Tamper with user parameter
    const tampered = initData.replace('zack_web3', 'impersonator_99');
    const result = validateTelegramInitData(tampered, dummyBotToken);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid HMAC signature');
  });

  it('rejects expired Telegram sessions (> 24 hours) to prevent replay attacks', () => {
    const twoDaysAgo = Math.floor(Date.now() / 1000) - 172800; // 48h ago
    const user = { id: 777888999, first_name: 'Zack' };
    const expiredInitData = generateValidInitData(user, twoDaysAgo, dummyBotToken);

    const result = validateTelegramInitData(expiredInitData, dummyBotToken);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('rejects payloads missing hash or auth_date', () => {
    const invalidData = 'user=%7B%22id%22%3A123%7D';
    const result = validateTelegramInitData(invalidData, dummyBotToken);
    expect(result.isValid).toBe(false);
  });
});

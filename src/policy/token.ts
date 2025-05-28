export const TokenPolicy = {
  ACCESS_TOKEN: {
    EXPIRES_IN: 3600 * 1000, // 1시간
    REDIS_PREFIX: 'at',
  },
  REFRESH_TOKEN: {
    EXPIRES_IN: 604800 * 1000, // 7일
    REDIS_PREFIX: 'rt',
  },
} as const;

export type TokenType = keyof typeof TokenPolicy;

export type userType = {
  avatar?: string;
  username?: string;
  nickname?: string;
  roles?: Array<string>;
  permissions?: Array<string>;
  isRemembered?: boolean;
  loginDay?: number;
  token?: string;
  refreshToken?: string;
  expires?: Date;
};

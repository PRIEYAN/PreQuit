export const ROUTES = {
  SPLASH: 'Splash',

  ONBOARD: 'OnBoard',
  SIGNIN: 'SignIn',
  SIGNUP: 'SignUp',
  RESET_PASSWORD: 'ResetPassword',

  SEARCH: 'Search',

  FRIENDS: 'Friends',
  FRIEND_REQUESTS: 'FriendRequests',
  DM: 'DM',

  PERSONAL: 'Personal',
  SETTINGS: 'Settings',

  MAIN: 'Main',
  TAB_HOME: 'TabHome',
  TAB_SOCIAL: 'TabSocial',
  TAB_FRIENDS: 'TabFriends',
  TAB_PROFILE: 'TabProfile',
} as const;

export interface ButtonOrigin {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type RootStackParamList = {
  [ROUTES.SPLASH]: undefined;
  [ROUTES.ONBOARD]: undefined;
  [ROUTES.SIGNIN]: { origin?: ButtonOrigin } | undefined;
  [ROUTES.SIGNUP]: { origin?: ButtonOrigin } | undefined;
  [ROUTES.RESET_PASSWORD]: undefined;
  [ROUTES.MAIN]: undefined;
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.DM]: {
    conversationId?: string | null;
    peerId?: string | null;
    name?: string;
    status?: string;
  };
};

export type MainTabParamList = {
  [ROUTES.TAB_HOME]: undefined;
  [ROUTES.TAB_SOCIAL]: undefined;
  [ROUTES.TAB_FRIENDS]: undefined;
  [ROUTES.TAB_PROFILE]: undefined;
};

export default ROUTES;

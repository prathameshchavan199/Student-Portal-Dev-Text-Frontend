// Every localStorage key ever written by Login.jsx, Signup.jsx, AuthCallback.jsx,
// or Register.jsx to represent the signed-in user / session. Logout must clear
// ALL of these — missing even one (e.g. idToken) leaves a still-valid Bearer
// token in place, which axiosSetup's request interceptor will keep attaching
// to every request, making the app behave as if the user never logged out.
const AUTH_STORAGE_KEYS = [
  'user',
  'name',
  'email',
  'id',
  'provider',
  'idToken',
  'refreshToken',
  'registered',
  'sp-new-signup',
  'profileImage',
];

export function clearAuthStorage() {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

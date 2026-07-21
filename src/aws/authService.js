// import { signUp, signIn, confirmSignUp } from 'aws-amplify/auth';

// export const registerUser = async (email, password) => {
//   try {
//     const response = await signUp({
//       username: email,
//       password,
//       options: {
//         userAttributes: {
//           email,
//         },
//       },
//     });

//     return response;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// export const verifyUser = async (email, code) => {
//   try {
//     return await confirmSignUp({
//       username: email,
//       confirmationCode: code,
//     });
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// export const loginUser = async (email, password) => {
//   try {
//     return await signIn({
//       username: email,
//       password,
//     });
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };
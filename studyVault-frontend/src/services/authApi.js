/**
 * @fileoverview Canonical re-export façade for the auth API.
 *
 * The service layer lives in `../service/authAPI.js`.
 * This file exists in `services/` so consumers can import from a consistent
 * `services/` prefix rather than the legacy `service/` directory.
 * The `service/` directory will be consolidated into `services/` in a future cleanup.
 */
export {
  changePassword,
  completeRegistration,
  getProfile,
  postLogin,
  postLogin as loginUser,
  postLogout,
  postLogoutAll,
  postRegister,
  postRegister as registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  submitPasswordReset,
  updateProfile,
} from '../service/authAPI.js';

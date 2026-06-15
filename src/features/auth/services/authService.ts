import type { AuthUser } from '../models/user';
import { API_BASE_URL } from '../../../utils/api';

type CreatedUserResponse = Pick<AuthUser, 'id' | 'name' | 'email'>;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

type UpdatedUserResponse = Pick<AuthUser, 'id' | 'name' | 'email'>;


const buildHeaders = (): Record<string, string> => {
  // Replace with your actual header building logic (e.g., adding auth tokens)
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${yourAuthToken}`
  };
};

// --- Login Function (updated to use new login endpoint) ---
export const loginWithPassword = async (email: string, password: string): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(email);

  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password: password,
    }),
  });

  let responseData: any; // Use 'any' for broader error handling, then cast if ok
  try {
    responseData = await response.json();
  } catch (e) {
    throw new Error('ورود ناموفق بود.'); // Generic login failed message
  }

  if (!response.ok) {
    const errorMessage = responseData?.error || responseData?.message || 'ورود ناموفق بود.';
    throw new Error(errorMessage);
  }

  // Check if the response is a valid user object
  if (!responseData || typeof responseData.id === 'undefined' || !responseData.email || !responseData.name) {
     // This guards against unexpected successful responses that aren't user data
     throw new Error('ایمیل یا رمز عبور اشتباه است.');
  }

  // Ensure we have the expected user properties and return AuthUser
  const user: AuthUser = {
      id: String(responseData.id),
      name: responseData.name,
      email: responseData.email,
  };

  return user;
};


// --- Sign Up Function ---
export const signUpWithPassword = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  // Step 1: Check if email already exists (mimicking Supabase GET request)
  // Note: For Flask, we'll use a POST request to a dedicated check endpoint or
  // modify the signup endpoint to perform the check internally before creating.
  // To truly mimic the Supabase example which did a separate GET, we'll assume a
  // similar pattern or have Flask handle it in one go.
  // Let's make Flask handle the check internally in the signup endpoint.

  // The Flask signup endpoint will perform the check first.
  // So, we directly call the signup endpoint.
  const signupResponse = await fetch(`${API_BASE_URL}/api/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: trimmedName,
      email: normalizedEmail,
      password: password,
    }),
  });

  let signupData: any; // Use 'any' for broader error handling

  try {
    signupData = await signupResponse.json();
  } catch (e) {
    // If signup response is not JSON (e.g., server error text)
    throw new Error('ثبت‌نام ناموفق بود.'); // Generic signup failed message
  }

  // Check for HTTP errors or if response is not OK
  if (!signupResponse.ok) {
    // Extract specific error messages from Flask backend
    const errorMessage = signupData?.error || signupData?.message || 'ثبت‌نام ناموفق بود.';
    throw new Error(errorMessage);
  }

  // If response is OK, it should contain the created user data
  // We expect an object with id, name, email.
  const createdUser = signupData as CreatedUserResponse;

  if (!createdUser || typeof createdUser.id === 'undefined' || !createdUser.email || !createdUser.name) {
      // This case handles if the Flask server returned 201 OK but with unexpected data
      throw new Error('ثبت‌نام ناموفق بود.');
  }

  // Successfully created user, return AuthUser
  const authUser: AuthUser = {
      id: String(createdUser.id),
      name: createdUser.name,
      email: createdUser.email,
  };

  return authUser;
};

// --- Update Profile Function ---
export const updateProfile = async (
  userId: string,
  name: string,
  email: string,
): Promise<AuthUser> => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName || !normalizedEmail) {
    throw new Error('نام و ایمیل الزامی است.'); // Name and email are required.
  }

  // Step 1: Check if the new email is already in use by *another* user.
  // We'll call the backend's update endpoint, and it will perform this check internally.
  // However, for better frontend UX, you *could* make a separate GET call first,
  // but the backend logic is more robust for handling edge cases.
  // Let's directly call the PUT endpoint as designed in the backend.

  const updateResponse = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PUT', // Use PUT for updates
    headers: {
      'Content-Type': 'application/json',
      // Add any necessary authentication headers here, e.g., Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: trimmedName,
      email: normalizedEmail,
    }),
  });

  let responseData: any; // Use 'any' for broader error handling

  try {
    responseData = await updateResponse.json();
  } catch (e) {
    // If response is not JSON (e.g., server error text)
    throw new Error('به‌روزرسانی پروفایل ناموفق بود.'); // Profile update failed.
  }

  // Check for HTTP errors or if response is not OK
  if (!updateResponse.ok) {
    // Extract specific error messages from Flask backend
    const errorMessage = responseData?.error || responseData?.message || 'به‌روزرسانی پروفایل ناموفق بود.';
    throw new Error(errorMessage);
  }

  // If response is OK, it should contain the updated user data
  const updatedUser = responseData as UpdatedUserResponse;

  if (!updatedUser || typeof updatedUser.id === 'undefined' || !updatedUser.email || !updatedUser.name) {
      // This case handles if the Flask server returned 200 OK but with unexpected data
      throw new Error('به‌روزرسانی پروفایل ناموفق بود.');
  }

  // Successfully updated user, return AuthUser
  const authUser: AuthUser = {
      id: String(updatedUser.id),
      name: updatedUser.name,
      email: updatedUser.email,
  };

  return authUser;
};


export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  if (!currentPassword || !newPassword) {
    throw new Error('رمز فعلی و رمز جدید الزامی است.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/change_password`, {
    method: 'POST',
    headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'تغییر رمز عبور انجام نشد.');
  }
};


export const deleteAccount = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'حذف حساب انجام نشد.');
  }
};

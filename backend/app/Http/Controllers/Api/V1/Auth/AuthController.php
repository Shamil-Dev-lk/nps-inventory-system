<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => 'required|email',
            'password'    => 'required|string',
            'remember_me' => 'boolean',
        ]);

        $user = User::where('email', $request->email)->with('roles', 'permissions')->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // Check 2FA
        if ($user->google2fa_enabled) {
            $token = Str::random(40);
            cache()->put("2fa_token_{$token}", $user->id, now()->addMinutes(5));

            return response()->json([
                'requires_2fa'    => true,
                'two_factor_token' => $token,
                'message'         => 'Please enter your 2FA code.',
            ]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $tokenExpiry = $request->remember_me ? now()->addDays(30) : now()->addHours(8);
        $token = $user->createToken('antigravity-token', ['*'], $tokenExpiry)->plainTextToken;

        AuditLog::record('user_login', "User logged in: {$user->email}", $user, $request);

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ]);
    }

    public function verify2fa(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_token'  => 'required|string',
            'one_time_password' => 'required|string|size:6',
        ]);

        $userId = cache()->pull("2fa_token_{$request->two_factor_token}");
        if (!$userId) {
            return response()->json(['message' => '2FA session expired. Please login again.'], 401);
        }

        $user = User::findOrFail($userId);

        $google2fa = app('pragmarx.google2fa');
        if (!$google2fa->verifyKey($user->google2fa_secret, $request->one_time_password)) {
            return response()->json(['message' => 'Invalid OTP code.'], 401);
        }

        $user->update(['last_login_at' => now(), 'last_login_ip' => $request->ip()]);
        $token = $user->createToken('antigravity-token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user->load('roles', 'permissions')),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('department', 'roles', 'permissions');

        return response()->json(['data' => $this->formatUser($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        AuditLog::record('user_logout', "User logged out: {$request->user()->email}", $request->user(), $request);
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'All sessions terminated.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);
        AuditLog::record('password_changed', "Password changed for: {$request->user()->email}", $request->user(), $request);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'               => 'sometimes|string|max:255',
            'name_sinhala'       => 'nullable|string',
            'name_tamil'         => 'nullable|string',
            'phone'              => 'nullable|string',
            'mobile'             => 'nullable|string',
            'preferred_language' => 'nullable|in:en,si,ta',
            'dark_mode'          => 'boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated.',
            'data'    => $this->formatUser($user->fresh('roles', 'permissions')),
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'                 => $user->id,
            'employee_id'        => $user->employee_id,
            'name'               => $user->name,
            'name_sinhala'       => $user->name_sinhala,
            'name_tamil'         => $user->name_tamil,
            'email'              => $user->email,
            'phone'              => $user->phone,
            'mobile'             => $user->mobile,
            'designation'        => $user->designation,
            'department'         => $user->department,
            'avatar_url'         => $user->avatar_url ?? "https://ui-avatars.com/api/?name=" . urlencode($user->name) . "&background=006838&color=ffffff",
            'preferred_language' => $user->preferred_language ?? 'en',
            'dark_mode'          => $user->dark_mode,
            'is_active'          => $user->is_active,
            'google2fa_enabled'  => $user->google2fa_enabled,
            'last_login_at'      => $user->last_login_at,
            'roles'              => $user->getRoleNames(),
            'permissions'        => $user->getAllPermissions()->pluck('name'),
        ];
    }
}

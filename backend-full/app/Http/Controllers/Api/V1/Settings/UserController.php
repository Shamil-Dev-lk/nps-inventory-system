<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Http\Resources\Auth\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('manage-users');

        $users = User::with(['roles', 'department'])
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%")
                ->orWhere('employee_id', 'like', "%{$request->search}%"))
            ->when($request->role, fn($q) => $q->role($request->role))
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($request->per_page ?? 20);

        return UserResource::collection($users);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage-users');

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users',
            'password'      => ['required', Password::min(8)->mixedCase()->numbers()],
            'role'          => 'required|exists:roles,name',
            'designation'   => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'phone'         => 'nullable|string|max:20',
            'mobile'        => 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'joining_date'  => 'nullable|date',
        ]);

        $user = User::create([
            ...$validated,
            'employee_id'       => 'EMP-' . str_pad(User::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT),
            'password'          => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);
        AuditLog::record('user_created', "User created: {$user->name}", $user);

        return response()->json([
            'message' => 'User created successfully.',
            'data'    => new UserResource($user->load('roles', 'department')),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('manage-users');
        return response()->json(['data' => new UserResource($user->load('roles', 'department'))]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('manage-users');

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:users,email,' . $user->id,
            'designation'   => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role'          => 'sometimes|exists:roles,name',
            'phone'         => 'nullable|string|max:20',
            'mobile'        => 'nullable|string|max:20',
            'preferred_language' => 'sometimes|in:en,si,ta',
            'dark_mode'     => 'sometimes|boolean',
            'address'       => 'nullable|string',
            'joining_date'  => 'nullable|date',
        ]);

        $user->update($validated);
        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        AuditLog::record('user_updated', "User updated: {$user->name}", $user);
        return response()->json(['message' => 'User updated.', 'data' => new UserResource($user->fresh()->load('roles', 'department'))]);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('manage-users');

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        AuditLog::record('user_deleted', "User deleted: {$user->name}", $user);
        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }

    public function toggleStatus(User $user): JsonResponse
    {
        $this->authorize('manage-users');
        $user->update(['is_active' => !$user->is_active]);
        $status = $user->is_active ? 'activated' : 'deactivated';
        AuditLog::record('user_status_changed', "User {$status}: {$user->name}", $user);
        return response()->json(['message' => "User {$status}.", 'is_active' => $user->is_active]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->authorize('manage-users');
        $request->validate(['password' => ['required', Password::min(8)->mixedCase()->numbers()]]);
        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();
        AuditLog::record('password_reset', "Password reset for: {$user->name}", $user);
        return response()->json(['message' => 'Password reset successfully.']);
    }
}

<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'name' => $this->name,
            'name_sinhala' => $this->name_sinhala,
            'name_tamil' => $this->name_tamil,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'designation' => $this->designation,
            'department' => $this->whenLoaded('department'),
            'avatar_url' => $this->avatar_url,
            'preferred_language' => $this->preferred_language,
            'dark_mode' => $this->dark_mode,
            'is_active' => $this->is_active,
            'google2fa_enabled' => $this->google2fa_enabled,
            'roles' => $this->whenLoaded('roles', fn() => $this->getRoleNames()),
            'permissions' => $this->whenLoaded('permissions', fn() => $this->getAllPermissions()->pluck('name')),
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
        ];
    }
}

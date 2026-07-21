<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'employee_id', 'name', 'name_sinhala', 'name_tamil',
        'email', 'password', 'phone', 'mobile',
        'designation', 'department_id', 'avatar', 'signature',
        'google2fa_secret', 'google2fa_enabled',
        'preferred_language', 'dark_mode', 'is_active',
        'last_login_at', 'last_login_ip',
    ];

    protected $hidden = [
        'password', 'remember_token', 'google2fa_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'google2fa_enabled' => 'boolean',
        'dark_mode' => 'boolean',
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];

    // Relationships
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // Accessors
    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=006838&color=fff';
    }

    public function getLocalizedNameAttribute(): string
    {
        $lang = app()->getLocale();
        return match ($lang) {
            'si' => $this->name_sinhala ?? $this->name,
            'ta' => $this->name_tamil ?? $this->name,
            default => $this->name,
        };
    }
}

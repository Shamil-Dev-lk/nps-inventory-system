<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class OrganizationSetting extends Model
{
    protected $fillable = [
        'name_en', 'name_si', 'name_ta', 'short_name',
        'district', 'province', 'address',
        'telephone', 'fax', 'mobile', 'email', 'website',
        'gps_latitude', 'gps_longitude',
        'chairman_name', 'secretary_name',
        'working_hours_start', 'working_hours_end',
        'official_logo', 'government_logo', 'favicon',
        'login_background', 'dashboard_background',
        'primary_color', 'secondary_color', 'accent_color',
        'footer_text', 'copyright', 'system_name', 'system_subtitle',
        'currency', 'currency_symbol', 'date_format', 'timezone',
        'default_language', 'enable_sms', 'enable_email_notifications',
        'enable_push_notifications', 'enable_ai_features',
        'openai_api_key', 'sms_provider', 'sms_api_key',
        'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption',
    ];

    protected $casts = [
        'enable_sms' => 'boolean',
        'enable_email_notifications' => 'boolean',
        'enable_push_notifications' => 'boolean',
        'enable_ai_features' => 'boolean',
    ];

    protected $hidden = ['openai_api_key', 'sms_api_key', 'smtp_password'];

    /**
     * Get the singleton organization settings instance.
     */
    public static function getInstance(): static
    {
        return Cache::remember('org_settings', 3600, function () {
            return static::firstOrCreate([], [
                'name_en' => config('organization.name_en'),
                'name_si' => config('organization.name_si'),
                'name_ta' => config('organization.name_ta'),
                'short_name' => config('organization.short_name'),
                'district' => config('organization.district'),
                'province' => config('organization.province'),
                'primary_color' => config('organization.primary_color'),
                'secondary_color' => config('organization.secondary_color'),
                'accent_color' => config('organization.accent_color'),
                'system_name' => config('organization.system_name'),
                'system_subtitle' => config('organization.system_subtitle'),
            ]);
        });
    }

    /**
     * Clear settings cache when updated.
     */
    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('org_settings');
        });
    }

    public function getLocalizedNameAttribute(): string
    {
        $lang = app()->getLocale();
        return match ($lang) {
            'si' => $this->name_si ?? $this->name_en,
            'ta' => $this->name_ta ?? $this->name_en,
            default => $this->name_en,
        };
    }

    public function getOfficialLogoUrlAttribute(): ?string
    {
        return $this->official_logo ? asset('storage/' . $this->official_logo) : null;
    }

    public function getGovernmentLogoUrlAttribute(): ?string
    {
        return $this->government_logo ? asset('storage/' . $this->government_logo) : null;
    }
}

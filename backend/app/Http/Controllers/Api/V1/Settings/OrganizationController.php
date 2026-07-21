<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\OrganizationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class OrganizationController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = OrganizationSetting::getInstance();
        return response()->json([
            'data' => array_merge($settings->toArray(), [
                'official_logo_url' => $settings->official_logo_url,
                'government_logo_url' => $settings->government_logo_url,
            ])
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorize('manage-settings');

        $validated = $request->validate([
            'name_en' => 'sometimes|string|max:255',
            'name_si' => 'sometimes|nullable|string|max:255',
            'name_ta' => 'sometimes|nullable|string|max:255',
            'short_name' => 'sometimes|string|max:50',
            'district' => 'sometimes|string|max:100',
            'province' => 'sometimes|string|max:100',
            'address' => 'sometimes|nullable|string',
            'telephone' => 'sometimes|nullable|string|max:20',
            'fax' => 'sometimes|nullable|string|max:20',
            'mobile' => 'sometimes|nullable|string|max:20',
            'email' => 'sometimes|nullable|email',
            'website' => 'sometimes|nullable|url',
            'gps_latitude' => 'sometimes|nullable|string',
            'gps_longitude' => 'sometimes|nullable|string',
            'chairman_name' => 'sometimes|nullable|string|max:255',
            'secretary_name' => 'sometimes|nullable|string|max:255',
            'working_hours_start' => 'sometimes|nullable|date_format:H:i',
            'working_hours_end' => 'sometimes|nullable|date_format:H:i',
            'primary_color' => 'sometimes|nullable|string|max:7',
            'secondary_color' => 'sometimes|nullable|string|max:7',
            'accent_color' => 'sometimes|nullable|string|max:7',
            'footer_text' => 'sometimes|nullable|string',
            'copyright' => 'sometimes|nullable|string',
            'system_name' => 'sometimes|nullable|string|max:100',
            'system_subtitle' => 'sometimes|nullable|string|max:255',
            'currency' => 'sometimes|nullable|string|max:10',
            'currency_symbol' => 'sometimes|nullable|string|max:10',
            'date_format' => 'sometimes|nullable|string|max:20',
            'timezone' => 'sometimes|nullable|timezone',
            'default_language' => 'sometimes|nullable|in:en,si,ta',
            'enable_sms' => 'sometimes|boolean',
            'enable_email_notifications' => 'sometimes|boolean',
            'enable_push_notifications' => 'sometimes|boolean',
            'enable_ai_features' => 'sometimes|boolean',
            'openai_api_key' => 'sometimes|nullable|string',
        ]);

        $settings = OrganizationSetting::getInstance();
        $oldValues = $settings->toArray();
        $settings->update($validated);

        AuditLog::record('settings_updated', 'Organization settings updated', $settings, $oldValues, $settings->fresh()->toArray());
        Cache::forget('org_settings');

        return response()->json(['message' => 'Settings updated successfully.', 'data' => $settings->fresh()]);
    }

    public function uploadLogo(Request $request, string $type): JsonResponse
    {
        $this->authorize('manage-settings');

        $request->validate([
            'logo' => 'required|image|mimes:jpg,jpeg,png,svg,webp|max:2048',
        ]);

        $field = match($type) {
            'official' => 'official_logo',
            'government' => 'government_logo',
            'favicon' => 'favicon',
            default => abort(422, 'Invalid logo type'),
        };

        $settings = OrganizationSetting::getInstance();

        // Delete old logo
        if ($settings->$field) {
            Storage::disk('public')->delete($settings->$field);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $settings->update([$field => $path]);
        Cache::forget('org_settings');

        return response()->json([
            'message' => 'Logo uploaded successfully.',
            'url' => asset('storage/' . $path),
        ]);
    }
}

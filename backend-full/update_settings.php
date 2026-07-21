<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\OrganizationSetting;

$settings = OrganizationSetting::first();
if ($settings) {
    $settings->primary_color = '#1D4ED8';
    $settings->save();
    
    // Clear cache
    Illuminate\Support\Facades\Cache::forget('org_settings');
    echo "Settings updated successfully to Beautiful Blue.\n";
} else {
    echo "Settings not found.\n";
}

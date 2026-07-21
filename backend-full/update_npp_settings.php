<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\OrganizationSetting;

$hex = '#C21F4C';
list($r, $g, $b) = sscanf($hex, "#%02x%02x%02x");
$r /= 255; $g /= 255; $b /= 255;
$max = max($r, $g, $b); $min = min($r, $g, $b);
$l = ($max + $min) / 2;
if ($max == $min) {
    $h = $s = 0;
} else {
    $d = $max - $min;
    $s = $l > 0.5 ? $d / (2 - $max - $min) : $d / ($max + $min);
    switch ($max) {
        case $r: $h = ($g - $b) / $d + ($g < $b ? 6 : 0); break;
        case $g: $h = ($b - $r) / $d + 2; break;
        case $b: $h = ($r - $g) / $d + 4; break;
    }
    $h /= 6;
}
$h = round($h * 360, 1);
$s = round($s * 100, 1);
$l = round($l * 100, 1);
$hsl = "{$h} {$s}% {$l}%";
echo "HSL: " . $hsl . "\n";

$settings = OrganizationSetting::first();
if ($settings) {
    $settings->primary_color = $hex;
    $settings->save();
    Illuminate\Support\Facades\Cache::forget('org_settings');
    echo "DB updated successfully.\n";
}

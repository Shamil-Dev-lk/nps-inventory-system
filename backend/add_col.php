<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasColumn('organization_settings', 'print_settings')) {
    Schema::table('organization_settings', function (Blueprint $table) {
        $table->json('print_settings')->nullable();
    });
    echo "Column added.\n";
} else {
    echo "Column already exists.\n";
}

<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = \App\Models\User::where('email', 'store@nps.gov.lk')->first();
if($u) {
    $u->password = \Illuminate\Support\Facades\Hash::make('Store@123!');
    $u->save();
    echo "Reset successfully.\n";
} else {
    echo "User not found. Attempting to create...\n";
    $u = \App\Models\User::create([
        'name' => 'Store Keeper',
        'email' => 'store@nps.gov.lk',
        'password' => \Illuminate\Support\Facades\Hash::make('Store@123!'),
        'employee_id' => 'EMP-0002',
        'designation' => 'Store Keeper',
        'email_verified_at' => now(),
        'is_active' => true,
    ]);
    $u->assignRole('store-keeper');
    echo "Created successfully.\n";
}

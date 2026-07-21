<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(['email' => 'admin@nps.gov.lk'], [
            'name' => 'System Administrator',
            'email' => 'admin@nps.gov.lk',
            'password' => Hash::make('Admin@123!'),
            'employee_id' => 'EMP-0001',
            'designation' => 'System Administrator',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $admin->assignRole('super-admin');

        $storeKeeper = User::firstOrCreate(['email' => 'store@nps.gov.lk'], [
            'name' => 'Store Keeper',
            'email' => 'store@nps.gov.lk',
            'password' => Hash::make('Store@123!'),
            'employee_id' => 'EMP-0002',
            'designation' => 'Store Keeper',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $storeKeeper->assignRole('store-keeper');
    }
}

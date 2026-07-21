<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganizationSettingSeeder::class,
            RolesPermissionsSeeder::class,
            DepartmentSeeder::class,
            WarehouseSeeder::class,
            UnitSeeder::class,
            BrandSeeder::class,
            ItemCategorySeeder::class,
            SupplierSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['code' => 'GEN', 'name' => 'Generic', 'country' => 'Sri Lanka'],
            ['code' => 'HP', 'name' => 'HP', 'country' => 'USA'],
            ['code' => 'DELL', 'name' => 'Dell', 'country' => 'USA'],
            ['code' => 'CANON', 'name' => 'Canon', 'country' => 'Japan'],
            ['code' => 'EPSON', 'name' => 'Epson', 'country' => 'Japan'],
            ['code' => 'KYOCERA', 'name' => 'Kyocera', 'country' => 'Japan'],
            ['code' => 'CASIO', 'name' => 'Casio', 'country' => 'Japan'],
            ['code' => 'LOCAL', 'name' => 'Local Brand', 'country' => 'Sri Lanka'],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(['code' => $brand['code']], $brand);
        }
    }
}

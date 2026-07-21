<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use App\Models\Shelf;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = Warehouse::firstOrCreate(['code' => 'MAIN'], [
            'code' => 'MAIN',
            'name_en' => 'Main Store',
            'name_si' => 'ප්රටම ග්රාම',
            'address' => 'Nikaweratiya Pradeshiya Sabha, Nikaweratiya',
            'is_main' => true,
            'is_active' => true,
        ]);

        $shelves = ['A', 'B', 'C', 'D'];
        foreach ($shelves as $shelf) {
            $s = Shelf::firstOrCreate(['warehouse_id' => $warehouse->id, 'code' => $shelf], [
                'warehouse_id' => $warehouse->id,
                'code' => $shelf,
                'name' => 'Shelf ' . $shelf,
            ]);
        }
    }
}

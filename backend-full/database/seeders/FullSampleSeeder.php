<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Asset;
use App\Models\Customer;
use App\Models\Shelf;
use App\Models\StorageBin;
use App\Models\SubCategory;
use Illuminate\Support\Carbon;

class FullSampleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Assets
        DB::table('assets')->insertOrIgnore([
            ['asset_code' => 'AST-NPS-001', 'name' => 'Toyota Hilux Double Cab', 'description' => 'Official vehicle for Engineering Division', 'status' => 'active', 'purchase_cost' => 12500000.00, 'created_at' => $now, 'updated_at' => $now],
            ['asset_code' => 'AST-NPS-002', 'name' => 'Dell OptiPlex 7000 Desktop', 'description' => 'IT Admin PC', 'status' => 'active', 'purchase_cost' => 285000.00, 'created_at' => $now, 'updated_at' => $now],
            ['asset_code' => 'AST-NPS-003', 'name' => 'JCB Backhoe Loader', 'description' => 'Heavy machinery for road maintenance', 'status' => 'maintenance', 'purchase_cost' => 35000000.00, 'created_at' => $now, 'updated_at' => $now],
            ['asset_code' => 'AST-NPS-004', 'name' => 'Canon imageRUNNER Copier', 'description' => 'Main Office Photocopier', 'status' => 'active', 'purchase_cost' => 450000.00, 'created_at' => $now, 'updated_at' => $now],
            ['asset_code' => 'AST-NPS-005', 'name' => 'Conference Table (Teak)', 'description' => 'Council Meeting Room', 'status' => 'active', 'purchase_cost' => 120000.00, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 2. Customers
        DB::table('customers')->insertOrIgnore([
            ['name' => 'Nikaweratiya Public Library', 'email' => 'library@nikaweratiya.gov.lk', 'phone' => '037-2260111', 'address' => 'Library Road, Nikaweratiya', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Maho Pradeshiya Sabha', 'email' => 'info@maho.ps.gov.lk', 'phone' => '037-2275222', 'address' => 'Maho', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Wariyapola Divisional Secretariat', 'email' => 'ds.wariyapola@gmail.com', 'phone' => '037-2267333', 'address' => 'Wariyapola Town', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Local Contractors Union', 'email' => 'contractors.nw@yahoo.com', 'phone' => '037-2260444', 'address' => 'No 45, Kurunegala Rd, Nikaweratiya', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Nikaweratiya Base Hospital', 'email' => 'bh.nikaweratiya@health.gov.lk', 'phone' => '037-2260555', 'address' => 'Hospital Rd, Nikaweratiya', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 3. Shelves
        $warehouseId = DB::table('warehouses')->value('id') ?? 1;
        DB::table('shelves')->insertOrIgnore([
            ['id' => 1, 'warehouse_id' => $warehouseId, 'name' => 'Stationery Shelf A', 'code' => 'SHF-STA-A', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'warehouse_id' => $warehouseId, 'name' => 'Hardware Rack B', 'code' => 'SHF-HDW-B', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'warehouse_id' => $warehouseId, 'name' => 'Chemicals Cabinet', 'code' => 'SHF-CHE-C', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 4. Storage Bins
        DB::table('storage_bins')->insertOrIgnore([
            ['shelf_id' => 1, 'name' => 'Top Bin 1', 'code' => 'BIN-STA-T1', 'created_at' => $now, 'updated_at' => $now],
            ['shelf_id' => 1, 'name' => 'Bottom Bin 2', 'code' => 'BIN-STA-B2', 'created_at' => $now, 'updated_at' => $now],
            ['shelf_id' => 2, 'name' => 'Heavy Duty Bin 1', 'code' => 'BIN-HDW-H1', 'created_at' => $now, 'updated_at' => $now],
            ['shelf_id' => 3, 'name' => 'Pesticides Bin', 'code' => 'BIN-CHE-P1', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 5. SubCategories
        $categoryId = DB::table('item_categories')->value('id') ?? 1;
        DB::table('sub_categories')->insertOrIgnore([
            ['category_id' => $categoryId, 'name_en' => 'Office Supplies', 'name_si' => 'කාර්යාල උපකරණ', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $categoryId, 'name_en' => 'Electrical Items', 'name_si' => 'විදුලි උපකරණ', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $categoryId, 'name_en' => 'Plumbing Materials', 'name_si' => 'ජලනල ද්‍රව්‍ය', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $categoryId, 'name_en' => 'Cleaning Equipment', 'name_si' => 'පිරිසිදු කිරීමේ ද්‍රව්‍ය', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Add some dummy items if none exist to make tables look good
        $itemCount = DB::table('items')->count();
        if ($itemCount < 5) {
            $unitId = DB::table('units')->value('id') ?? 1;
            DB::table('items')->insertOrIgnore([
                ['item_code' => 'ITM-001', 'name_en' => 'A4 Paper Ream (Double A)', 'name_si' => 'A4 කඩදාසි', 'category_id' => $categoryId, 'unit_id' => $unitId, 'current_quantity' => 150, 'reorder_level' => 20, 'purchase_price' => 2100.00, 'selling_price' => 2500.00, 'created_at' => $now, 'updated_at' => $now],
                ['item_code' => 'ITM-002', 'name_en' => 'LED Bulb 12W', 'name_si' => 'LED බල්බ 12W', 'category_id' => $categoryId, 'unit_id' => $unitId, 'current_quantity' => 45, 'reorder_level' => 10, 'purchase_price' => 450.00, 'selling_price' => 550.00, 'created_at' => $now, 'updated_at' => $now],
                ['item_code' => 'ITM-003', 'name_en' => 'PVC Pipe 2 inch', 'name_si' => 'PVC බට අඟල් 2', 'category_id' => $categoryId, 'unit_id' => $unitId, 'current_quantity' => 80, 'reorder_level' => 15, 'purchase_price' => 850.00, 'selling_price' => 950.00, 'created_at' => $now, 'updated_at' => $now],
                ['item_code' => 'ITM-004', 'name_en' => 'Portland Cement (50kg)', 'name_si' => 'සිමෙන්ති', 'category_id' => $categoryId, 'unit_id' => $unitId, 'current_quantity' => 200, 'reorder_level' => 50, 'purchase_price' => 2300.00, 'selling_price' => 2450.00, 'created_at' => $now, 'updated_at' => $now],
                ['item_code' => 'ITM-005', 'name_en' => 'Broom (Coconut Ekel)', 'name_si' => 'ඉදල', 'category_id' => $categoryId, 'unit_id' => $unitId, 'current_quantity' => 30, 'reorder_level' => 10, 'purchase_price' => 250.00, 'selling_price' => 350.00, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }
    }
}

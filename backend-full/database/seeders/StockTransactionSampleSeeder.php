<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class StockTransactionSampleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $warehouseId = DB::table('warehouses')->value('id') ?? 1;
        $supplierId = DB::table('suppliers')->value('id') ?? 1;
        $departmentId = DB::table('departments')->value('id') ?? 1;
        $adminId = DB::table('users')->where('email', 'admin@nps.gov.lk')->value('id') ?? 1;
        
        $item1 = DB::table('items')->where('item_code', 'ITM-001')->first() ?? (object)['id' => 1, 'purchase_price' => 2100.00];
        $item2 = DB::table('items')->where('item_code', 'ITM-002')->first() ?? (object)['id' => 2, 'purchase_price' => 450.00];

        $rand = Str::random(5);

        // 1. Add GRNs (Stock Receipts)
        $grn1Id = DB::table('goods_received_notes')->insertGetId([
            'grn_number' => 'GRN-SMPL-' . $rand,
            'supplier_id' => $supplierId,
            'warehouse_id' => $warehouseId,
            'received_date' => $now->copy()->subDays(5),
            'invoice_number' => 'INV-2401-882',
            'total_amount' => 105000.00,
            'status' => 'approved',
            'received_by' => $adminId,
            'approved_by' => $adminId,
            'approved_at' => $now->copy()->subDays(4),
            'remarks' => 'Monthly stationery supply',
            'created_at' => $now->copy()->subDays(5),
            'updated_at' => $now->copy()->subDays(4),
        ]);

        DB::table('grn_items')->insert([
            [
                'grn_id' => $grn1Id,
                'item_id' => $item1->id,
                'ordered_quantity' => 50,
                'received_quantity' => 50,
                'accepted_quantity' => 50,
                'rejected_quantity' => 0,
                'unit_price' => $item1->purchase_price,
                'total_price' => 50 * $item1->purchase_price,
                'created_at' => $now->copy()->subDays(5),
                'updated_at' => $now->copy()->subDays(5),
            ]
        ]);

        // 2. Add Stock Issues
        $issue1Id = DB::table('stock_issues')->insertGetId([
            'issue_number' => 'ISS-SMPL-' . $rand,
            'issue_to_type' => 'department',
            'department_id' => $departmentId,
            'warehouse_id' => $warehouseId,
            'issue_date' => $now->copy()->subDays(2),
            'status' => 'issued',
            'issued_by' => $adminId,
            'approved_by' => $adminId,
            'approved_at' => $now->copy()->subDays(1),
            'purpose' => 'For office use in Admin branch',
            'created_at' => $now->copy()->subDays(2),
            'updated_at' => $now->copy()->subDays(1),
        ]);

        DB::table('stock_issue_items')->insert([
            [
                'stock_issue_id' => $issue1Id,
                'item_id' => $item1->id,
                'quantity' => 10,
                'unit_price' => $item1->purchase_price,
                'total_price' => 10 * $item1->purchase_price,
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(2),
            ]
        ]);

        // 3. Add Stock Adjustments (Note: items directly on table)
        DB::table('stock_adjustments')->insert([
            'adjustment_number' => 'ADJ-SMPL-' . $rand,
            'adjustment_type' => 'increase',
            'item_id' => $item2->id,
            'warehouse_id' => $warehouseId,
            'quantity' => 5,
            'unit_cost' => $item2->purchase_price,
            'adjustment_date' => $now->copy()->subDays(1),
            'reason' => 'Found extra stock during audit',
            'status' => 'approved',
            'adjusted_by' => $adminId,
            'approved_by' => $adminId,
            'approved_at' => $now->copy()->subHours(12),
            'created_at' => $now->copy()->subDays(1),
            'updated_at' => $now->copy()->subHours(12),
        ]);

        // 4. Add Stock Transfer
        $transfer1Id = DB::table('stock_transfers')->insertGetId([
            'transfer_number' => 'TRF-SMPL-' . $rand,
            'transfer_type' => 'warehouse_to_warehouse',
            'from_warehouse_id' => $warehouseId,
            'to_warehouse_id' => $warehouseId, // Same warehouse for simplicity in sample
            'transfer_date' => $now->copy()->subDays(3),
            'reason' => 'Moving to front rack',
            'status' => 'completed',
            'initiated_by' => $adminId,
            'approved_by' => $adminId,
            'approved_at' => $now->copy()->subDays(2),
            'created_at' => $now->copy()->subDays(3),
            'updated_at' => $now->copy()->subDays(2),
        ]);

        DB::table('stock_transfer_items')->insert([
            [
                'stock_transfer_id' => $transfer1Id,
                'item_id' => $item2->id,
                'quantity' => 2,
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subDays(3),
            ]
        ]);
    }
}

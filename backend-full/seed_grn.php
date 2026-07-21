<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$supplier = \App\Models\Supplier::first();
$warehouse = \App\Models\Warehouse::first();
$item = \App\Models\Item::first();
$user = \App\Models\User::first();

if(!$supplier || !$warehouse || !$item) {
    echo "Missing dependencies to create a GRN.";
    exit;
}

$grn = \App\Models\GoodsReceivedNote::firstOrCreate([
    'id' => 1
], [
    'grn_number' => 'GRN-2026-00001',
    'supplier_id' => $supplier->id,
    'warehouse_id' => $warehouse->id,
    'received_date' => now(),
    'invoice_number' => 'INV-999',
    'subtotal' => 5000,
    'total_amount' => 5000,
    'status' => 'approved',
    'received_by' => $user->id,
    'approved_by' => $user->id,
    'approved_at' => now(),
]);

\App\Models\GrnItem::firstOrCreate([
    'grn_id' => $grn->id,
    'item_id' => $item->id
], [
    'ordered_quantity' => 10,
    'received_quantity' => 10,
    'accepted_quantity' => 10,
    'rejected_quantity' => 0,
    'unit_price' => 500,
    'total_price' => 5000,
]);

echo "GRN 1 created successfully.\n";

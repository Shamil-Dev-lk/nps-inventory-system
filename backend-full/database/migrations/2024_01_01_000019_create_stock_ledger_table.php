<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_ledger', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->string('transaction_type'); // grn, issue, return, transfer_in, transfer_out, adjustment_increase, adjustment_decrease
            $table->string('reference_number');
            $table->string('reference_type'); // GoodsReceivedNote, StockIssue, StockReturn, StockTransfer, StockAdjustment
            $table->unsignedBigInteger('reference_id');
            $table->decimal('quantity_in', 15, 3)->default(0);
            $table->decimal('quantity_out', 15, 3)->default(0);
            $table->decimal('balance', 15, 3)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_value', 15, 2)->default(0);
            $table->timestamp('transaction_date');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('items');
            $table->foreign('warehouse_id')->references('id')->on('warehouses');
            $table->index(['item_id', 'warehouse_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_ledger');
    }
};

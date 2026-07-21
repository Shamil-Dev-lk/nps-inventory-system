<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique();
            $table->enum('adjustment_type', ['increase', 'decrease']);
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->string('reason');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('adjusted_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->enum('status', ['draft', 'approved', 'rejected'])->default('draft');
            $table->date('adjustment_date');
            $table->string('reference_number')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('item_id')->references('id')->on('items');
            $table->foreign('warehouse_id')->references('id')->on('warehouses');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique();
            $table->enum('transfer_type', ['warehouse_to_warehouse', 'warehouse_to_department', 'department_to_warehouse'])->default('warehouse_to_warehouse');
            $table->unsignedBigInteger('from_warehouse_id')->nullable();
            $table->unsignedBigInteger('to_warehouse_id')->nullable();
            $table->unsignedBigInteger('from_department_id')->nullable();
            $table->unsignedBigInteger('to_department_id')->nullable();
            $table->date('transfer_date');
            $table->unsignedBigInteger('initiated_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->enum('status', ['draft', 'approved', 'in_transit', 'completed', 'rejected'])->default('draft');
            $table->text('reason')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_transfer_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('stock_transfer_id')->references('id')->on('stock_transfers')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
    }
};

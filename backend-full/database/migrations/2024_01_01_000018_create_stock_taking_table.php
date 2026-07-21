<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_taking', function (Blueprint $table) {
            $table->id();
            $table->string('st_number')->unique();
            $table->string('title');
            $table->unsignedBigInteger('warehouse_id');
            $table->date('count_date');
            $table->unsignedBigInteger('initiated_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->enum('status', ['draft', 'in_progress', 'completed', 'approved', 'rejected'])->default('draft');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('warehouse_id')->references('id')->on('warehouses');
        });

        Schema::create('stock_taking_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_taking_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('system_quantity', 15, 3)->default(0);
            $table->decimal('physical_quantity', 15, 3)->nullable();
            $table->decimal('variance', 15, 3)->nullable();
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->string('variance_reason')->nullable();
            $table->boolean('is_adjusted')->default(false);
            $table->timestamps();

            $table->foreign('stock_taking_id')->references('id')->on('stock_taking')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_taking_items');
        Schema::dropIfExists('stock_taking');
    }
};

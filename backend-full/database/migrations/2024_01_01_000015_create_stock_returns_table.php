<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number')->unique();
            $table->unsignedBigInteger('stock_issue_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('officer_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->date('return_date');
            $table->unsignedBigInteger('returned_by');
            $table->unsignedBigInteger('received_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->enum('status', ['draft', 'approved', 'rejected'])->default('draft');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('warehouse_id')->references('id')->on('warehouses');
        });

        Schema::create('stock_return_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_return_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('quantity', 15, 3);
            $table->enum('condition', ['good', 'damaged', 'expired', 'unused'])->default('good');
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->foreign('stock_return_id')->references('id')->on('stock_returns')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_return_items');
        Schema::dropIfExists('stock_returns');
    }
};

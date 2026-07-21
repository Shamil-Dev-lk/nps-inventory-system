<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->unsignedBigInteger('purchase_request_id')->nullable();
            $table->unsignedBigInteger('supplier_id');
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'sent', 'acknowledged', 'partially_received', 'completed', 'cancelled'])->default('draft');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('supplier_id')->references('id')->on('suppliers');
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_order_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('quantity', 15, 3);
            $table->decimal('received_quantity', 15, 3)->default(0);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->decimal('total_price', 15, 2);
            $table->string('specification')->nullable();
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
    }
};

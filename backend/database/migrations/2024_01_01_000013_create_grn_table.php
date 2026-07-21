<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_received_notes', function (Blueprint $table) {
            $table->id();
            $table->string('grn_number')->unique();
            $table->unsignedBigInteger('purchase_order_id')->nullable();
            $table->unsignedBigInteger('supplier_id');
            $table->string('invoice_number')->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('received_date');
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('received_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'approved', 'rejected'])->default('draft');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('supplier_id')->references('id')->on('suppliers');
            $table->foreign('warehouse_id')->references('id')->on('warehouses');
        });

        Schema::create('grn_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('grn_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('purchase_order_item_id')->nullable();
            $table->decimal('ordered_quantity', 15, 3)->default(0);
            $table->decimal('received_quantity', 15, 3);
            $table->decimal('accepted_quantity', 15, 3);
            $table->decimal('rejected_quantity', 15, 3)->default(0);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('grn_id')->references('id')->on('goods_received_notes')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });

        Schema::create('grn_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('grn_id');
            $table->string('title');
            $table->string('path');
            $table->string('filename');
            $table->timestamps();

            $table->foreign('grn_id')->references('id')->on('goods_received_notes')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_attachments');
        Schema::dropIfExists('grn_items');
        Schema::dropIfExists('goods_received_notes');
    }
};

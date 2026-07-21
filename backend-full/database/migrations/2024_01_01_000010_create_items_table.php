<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->string('barcode')->unique()->nullable();
            $table->string('qr_code')->unique()->nullable();
            $table->string('name_en');
            $table->string('name_si')->nullable();
            $table->string('name_ta')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->unsignedBigInteger('unit_id');
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->decimal('average_cost', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->decimal('current_quantity', 15, 3)->default(0);
            $table->decimal('available_quantity', 15, 3)->default(0);
            $table->decimal('reserved_quantity', 15, 3)->default(0);
            $table->decimal('minimum_stock', 15, 3)->default(0);
            $table->decimal('maximum_stock', 15, 3)->default(0);
            $table->decimal('reorder_level', 15, 3)->default(0);
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('shelf_id')->nullable();
            $table->unsignedBigInteger('bin_id')->nullable();
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('warranty_period')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('is_consumable')->default(true);
            $table->boolean('is_serialized')->default(false);
            $table->boolean('track_expiry')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('category_id')->references('id')->on('item_categories');
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('set null');
            $table->foreign('model_id')->references('id')->on('item_models')->onDelete('set null');
            $table->foreign('unit_id')->references('id')->on('units');
        });

        Schema::create('item_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->string('path');
            $table->string('filename');
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });

        Schema::create('item_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->string('title');
            $table->string('path');
            $table->string('filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_attachments');
        Schema::dropIfExists('item_images');
        Schema::dropIfExists('items');
    }
};

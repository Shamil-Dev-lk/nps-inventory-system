<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name_en');
            $table->string('name_si')->nullable();
            $table->string('name_ta')->nullable();
            $table->text('address')->nullable();
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->string('telephone')->nullable();
            $table->decimal('capacity', 10, 2)->nullable();
            $table->boolean('is_main')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('shelves', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('warehouse_id');
            $table->string('code');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
            $table->unique(['warehouse_id', 'code']);
        });

        Schema::create('bins', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shelf_id');
            $table->string('code');
            $table->string('name');
            $table->decimal('capacity', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('shelf_id')->references('id')->on('shelves')->onDelete('cascade');
            $table->unique(['shelf_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bins');
        Schema::dropIfExists('shelves');
        Schema::dropIfExists('warehouses');
    }
};

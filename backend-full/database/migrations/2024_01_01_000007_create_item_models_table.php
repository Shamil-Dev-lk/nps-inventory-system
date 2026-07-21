<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_models', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->text('specifications')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_models');
    }
};
